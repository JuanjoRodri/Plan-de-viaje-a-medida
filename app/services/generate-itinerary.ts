"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { WeatherData } from "./services/weather-service"
import { getEnhancedPlaceDetails, generateGoogleMapsLink } from "./services/places-utils"
import { GOOGLE_PLACES_API_KEY, checkApiKeys } from "./config"
import { geocodePlace, searchPlaces } from "./services/google-places-service"
import { getPriceLevelDescription } from "./services/price-estimation-service"
import { getCachedPlaceSentiment } from "./services/place-sentiment-analysis"
// Actualizar la importación
import { getBestPlacesForItinerary } from "./services/optimized-places-service"

// Importar los nuevos prompts
import {
  generateItineraryPrompt,
  generateWeatherPromptSection,
  generateTransportPromptSection,
  generateBudgetPromptSection,
} from "./prompts/itinerary-prompts"

// Definir la interfaz para los parámetros
export interface ItineraryParams {
  destination: string
  days: string
  nights: string
  hotel: string
  placeId?: string
  age: string
  travelers: string
  arrivalTime: string
  departureTime: string
  preferences?: string
  weatherData?: WeatherData | null
  budget?: string
  customBudget?: string
  transportModes: string[]
  maxDistance: string
  tripType?: string
  boardType?: string // Añadir esta línea
}

// Exportar la función generateItinerary
export async function generateItinerary(
  params: ItineraryParams,
): Promise<{ success: boolean; html: string; error?: string }> {
  try {
    console.log("Generando itinerario para:", params.destination)

    // Convertir valores de string a número donde sea necesario
    const numericDays = Number.parseInt(params.days, 10)
    const numericNights = Number.parseInt(params.nights, 10)
    const numericTravelers = Number.parseInt(params.travelers, 10)
    const maxDistance = Number.parseInt(params.maxDistance || "3", 10)

    // Verificar si las API keys están configuradas
    const apiKeys = checkApiKeys()
    if (!apiKeys.googlePlacesApiKey) {
      console.warn("API key de Google Places no configurada. Algunas funcionalidades pueden no estar disponibles.")
    }

    // Obtener las coordenadas del destino para verificaciones posteriores
    let destinationCoords: { lat: number; lng: number } | null = null
    try {
      const geocodeResult = await geocodePlace(params.destination)
      if (geocodeResult) {
        destinationCoords = {
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
        }
        console.log(`Coordenadas de ${params.destination}:`, destinationCoords)
      }
    } catch (error) {
      console.error("Error obteniendo coordenadas del destino:", error)
    }

    // Obtener coordenadas del hotel si está disponible
    let hotelCoords: { lat: number; lng: number } | null = null
    if (params.placeId) {
      try {
        const hotelDetails = await getEnhancedPlaceDetails(params.placeId)
        if (hotelDetails && hotelDetails.location) {
          hotelCoords = {
            lat: hotelDetails.location.lat,
            lng: hotelDetails.location.lng,
          }
        }
      } catch (error) {
        console.error("Error obteniendo coordenadas del hotel:", error)
      }
    }

    // Usar las coordenadas del hotel si están disponibles, de lo contrario usar las del destino
    const searchCoords = hotelCoords || destinationCoords

    // Obtener los mejores lugares según el presupuesto
    let bestPlacesInfo = ""
    if (searchCoords && params.budget) {
      try {
        console.log("Buscando los mejores lugares según presupuesto...")
        // Convertir el radio de km a metros
        const searchRadius = maxDistance * 1000
        bestPlacesInfo = await getBestPlacesForItinerary(
          params.destination,
          params.budget as "bajo" | "medio" | "alto" | "personalizado",
          params.customBudget,
          searchCoords,
          searchRadius,
        )
        console.log("Lugares premium encontrados")
      } catch (error) {
        console.error("Error obteniendo los mejores lugares:", error)
      }
    }

    // Preparar información de niveles de precio según el presupuesto
    let budgetInfo = ""
    if (params.budget) {
      let priceLevelRange = ""
      let budgetDescription = ""
      let budgetInstructions = ""

      switch (params.budget) {
        case "bajo":
          priceLevelRange = "1"
          budgetDescription = "económico (€)"
          budgetInstructions =
            "Prioriza opciones económicas y asequibles. Busca restaurantes con nivel de precio € y atracciones gratuitas o de bajo costo."
          break
        case "medio":
          priceLevelRange = "2"
          budgetDescription = "estándar (€€)"
          budgetInstructions =
            "Equilibra opciones de precio moderado. Prioriza restaurantes con nivel de precio €€ y atracciones de costo medio."
          break
        case "alto":
          priceLevelRange = "3-4"
          budgetDescription = "premium (€€€-€€€€)"
          budgetInstructions =
            "Prioriza experiencias de alta calidad y exclusivas. Incluye los mejores restaurantes (€€€-€€€€) y atracciones premium. NO recomiendes opciones económicas a menos que sean excepcionalmente buenas o únicas."
          break
        default:
          if (params.customBudget) {
            // Analizar el presupuesto personalizado para determinar el nivel
            const budgetValue = Number.parseInt(params.customBudget.replace(/[^0-9]/g, ""), 10)
            if (budgetValue <= 50) {
              priceLevelRange = "1"
              budgetDescription = "económico (€)"
              budgetInstructions =
                "Prioriza opciones económicas y asequibles. Busca restaurantes con nivel de precio € y atracciones gratuitas o de bajo costo."
            } else if (budgetValue <= 150) {
              priceLevelRange = "2"
              budgetDescription = "estándar (€€)"
              budgetInstructions =
                "Equilibra opciones de precio moderado. Prioriza restaurantes con nivel de precio €€ y atracciones de costo medio."
            } else {
              priceLevelRange = "3-4"
              budgetDescription = "premium (€€€-€€€€)"
              budgetInstructions =
                "Prioriza experiencias de alta calidad y exclusivas. Incluye los mejores restaurantes (€€€-€€€€) y atracciones premium. NO recomiendes opciones económicas a menos que sean excepcionalmente buenas o únicas."
            }
          }
      }

      budgetInfo = `
INFORMACIÓN DE PRESUPUESTO:
- Has seleccionado un presupuesto ${budgetDescription}.
- Recomendaremos principalmente lugares con nivel de precio ${priceLevelRange}.
- ${budgetInstructions}
- No incluiremos precios específicos en euros en el itinerario, ya que las recomendaciones estarán adaptadas a tu nivel de presupuesto.
- Si recomendamos algún lugar fuera de tu rango de presupuesto, lo indicaremos claramente como una experiencia especial o excepcional.

${bestPlacesInfo}
`
    }

    // Preparar información del modo de transporte y distancia máxima
    const transportModes = params.transportModes || ["walking"]
    const transportModeText = getTransportModeText(transportModes)

    const transportInfo = `
RESTRICCIONES DE DISTANCIA Y TRANSPORTE:
- El usuario se desplazará principalmente ${transportModeText}
- La distancia máxima desde el alojamiento debe ser de ${maxDistance} km
- Organiza el itinerario para que las actividades estén agrupadas por proximidad geográfica
- Prioriza lugares que estén dentro del radio de ${maxDistance} km desde el hotel
- Incluye información sobre cómo desplazarse entre lugares (tiempo estimado ${transportModeText})
- Si recomiendas lugares fuera del radio establecido, DEBES indicarlo claramente y justificar por qué vale la pena el desplazamiento
- Distancias recomendadas según modo de transporte:
 * A pie: máximo 2 km
 * En bicicleta: máximo 10 km
 * En transporte público: máximo 20 km
 * En coche: máximo 50 km
`

    // Preparar información del clima si está disponible
    let weatherInfo = ""
    let weatherHtml = ""

    if (params.weatherData) {
      weatherInfo = `
      INFORMACIÓN DEL CLIMA:
      Durante la estancia en ${params.destination}, se prevén las siguientes condiciones climáticas:
      ${params.weatherData.forecast
        .map(
          (day) =>
            `- ${new Date(day.date).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}: ${day.minTemp}°C-${day.maxTemp}°C, ${day.condition}, ${day.chanceOfRain}% probabilidad de lluvia`,
        )
        .join("\n")}
      
      IMPORTANTE: Adapta las actividades según estas condiciones climáticas. Sugiere actividades al aire libre en días con buen tiempo y alternativas en interiores para días con mal tiempo o lluvia.
      `

      // Crear HTML para mostrar el clima en el itinerario
      weatherHtml = `<div class="weather-forecast-container">
        <h3>Pronóstico del tiempo durante tu estancia</h3>
        <div class="weather-forecast-grid">
          ${params.weatherData.forecast
            .map((day) => {
              const date = new Date(day.date)
              const formattedDate = date.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })

              // Simplificado para brevedad
              return `
            <div class="weather-day-card">
              <div class="weather-day-header">
                <div class="weather-day-date">${formattedDate}</div>
              </div>
              <div class="weather-day-details">
                <div class="weather-day-temp">${day.minTemp}°C - ${day.maxTemp}°C</div>
                <div class="weather-day-condition">${day.condition}</div>
              </div>
            </div>
            `
            })
            .join("")}
        </div>
      </div>`
    }

    // Preparar información del hotel verificado si está disponible
    let hotelInfo = ""
    let hotelMapLink = ""

    if (params.placeId) {
      try {
        const hotelDetails = await getEnhancedPlaceDetails(params.placeId)
        if (hotelDetails) {
          hotelInfo = `
          INFORMACIÓN DEL ALOJAMIENTO VERIFICADO:
          - Nombre: ${hotelDetails.name}
          - Dirección: ${hotelDetails.formatted_address || "No disponible"}
          - Calificación: ${hotelDetails.rating ? `${hotelDetails.rating}/5 (${hotelDetails.user_ratings_total || 0} reseñas)` : "No disponible"}
          - Sitio web: ${hotelDetails.website || "No disponible"}
          ${hotelCoords ? `- Coordenadas: ${hotelCoords.lat}, ${hotelCoords.lng}` : ""}
          
          IMPORTANTE: Utiliza esta información precisa del alojamiento para calcular las distancias y tiempos de desplazamiento.
          `

          // Crear enlace a Google Maps para el hotel
          if (hotelDetails.url) {
            hotelMapLink = `
            <div class="hotel-info">
              <h3>Alojamiento verificado</h3>
              <div class="hotel-card">
                <h4>${hotelDetails.name}</h4>
                <p>${hotelDetails.formatted_address || ""}</p>
                ${
                  hotelDetails.rating
                    ? `<div class="hotel-rating">
                    <div class="stars">
                      ${Array.from({ length: 5 })
                        .map(
                          (_, i) =>
                            `<span key=${i} class="${i < Math.floor(hotelDetails.rating) ? "text-yellow-500" : "text-gray-300"}">★</span>`,
                        )
                        .join("")}
                    </div>
                    <span>${hotelDetails.rating.toFixed(1)}/5 (${hotelDetails.user_ratings_total || 0} reseñas)</span>
                  </div>`
                    : ""
                }
                <div class="hotel-links">
                  ${hotelDetails.url ? `<a href="${hotelDetails.url}" target="_blank" class="hotel-map-link">Ver en Google Maps</a>` : ""}
                  ${hotelDetails.website ? `<a href="${hotelDetails.website}" target="_blank" class="hotel-website-link">Sitio web oficial</a>` : ""}
                </div>
              </div>
            </div>`
          }
        }
      } catch (error) {
        console.error("Error obteniendo detalles del hotel:", error)
      }
    }

    // Preparar información del tipo de pensión si está disponible
    let boardTypeInfo = ""
    if (params.boardType) {
      switch (params.boardType) {
        case "sin-pension":
          boardTypeInfo = `
INFORMACIÓN DE PENSIÓN DEL HOTEL:
- El alojamiento NO incluye comidas
- DEBES recomendar restaurantes para desayuno, almuerzo y cena
- Incluye variedad de opciones gastronómicas para todas las comidas del día
`
          break
        case "solo-desayuno":
          boardTypeInfo = `
INFORMACIÓN DE PENSIÓN DEL HOTEL:
- El alojamiento INCLUYE DESAYUNO
- NO recomiendes lugares para desayunar (excepto como alternativa ocasional)
- DEBES recomendar restaurantes para almuerzo y cena
- Enfócate en opciones gastronómicas para almuerzo y cena
`
          break
        case "media-pension":
          boardTypeInfo = `
INFORMACIÓN DE PENSIÓN DEL HOTEL:
- El alojamiento INCLUYE DESAYUNO Y CENA
- NO recomiendes lugares para desayunar ni cenar (excepto como alternativas ocasionales)
- SOLO recomienda restaurantes para ALMUERZO
- Enfócate más en actividades ya que las comidas principales están cubiertas
`
          break
        case "pension-completa":
          boardTypeInfo = `
INFORMACIÓN DE PENSIÓN DEL HOTEL:
- El alojamiento INCLUYE TODAS LAS COMIDAS (desayuno, almuerzo y cena)
- NO recomiendes restaurantes para comidas principales
- Puedes mencionar cafeterías o lugares para aperitivos/meriendas ocasionales
- ENFÓCATE PRINCIPALMENTE EN ACTIVIDADES, no en gastronomía
- Las recomendaciones gastronómicas deben ser mínimas y solo como experiencias especiales
`
          break
      }
    }

    // Preparar secciones del prompt
    const weatherInfoSection = params.weatherData ? generateWeatherPromptSection(params.weatherData) : ""

    const transportInfoSection = generateTransportPromptSection(params.transportModes, params.maxDistance)

    const budgetInfoSection = params.budget
      ? generateBudgetPromptSection(params.budget, params.customBudget, bestPlacesInfo)
      : ""

    // Construir el prompt completo usando el generador de prompts
    const prompt = generateItineraryPrompt({
      destination: params.destination,
      days: params.days,
      nights: params.nights,
      hotel: params.hotel,
      travelers: params.travelers,
      age: params.age,
      arrivalTime: params.arrivalTime,
      departureTime: params.departureTime,
      preferences: params.preferences,
      budget: params.budget,
      customBudget: params.customBudget,
      transportModes: params.transportModes,
      maxDistance: params.maxDistance,
      weatherInfo: weatherInfoSection,
      hotelInfo: hotelInfo,
      budgetInfo: budgetInfoSection,
      transportInfo: transportInfoSection,
      tripType: params.tripType,
      boardTypeInfo: boardTypeInfo, // Añadir esta línea
    })

    // Generar el itinerario con la IA - CAMBIADO A GPT-4O-MINI
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.7,
      maxTokens: 4000,
    })

    // Procesar el texto generado
    let cleanedText = text

    // Eliminar delimitadores de código markdown si existen
    cleanedText = cleanedText.replace(/^\s*```html\s*/i, "")
    cleanedText = cleanedText.replace(/\s*```\s*$/i, "")

    // Si hay datos del clima, insertar el HTML del clima
    if (params.weatherData) {
      cleanedText = weatherHtml + cleanedText

      // Traducir términos en inglés comunes relacionados con el clima
      cleanedText = cleanedText.replace(/clear sky/gi, "cielo despejado")
      cleanedText = cleanedText.replace(/overcast clouds/gi, "nublado")
      cleanedText = cleanedText.replace(/broken clouds/gi, "parcialmente nublado")
      cleanedText = cleanedText.replace(/scattered clouds/gi, "nubes dispersas")
      cleanedText = cleanedText.replace(/few clouds/gi, "pocas nubes")
      cleanedText = cleanedText.replace(/light rain/gi, "lluvia ligera")
      cleanedText = cleanedText.replace(/moderate rain/gi, "lluvia moderada")
      cleanedText = cleanedText.replace(/heavy rain/gi, "lluvia intensa")
    }

    // Si hay información del hotel verificado, insertarla al principio del itinerario
    if (hotelMapLink) {
      cleanedText = hotelMapLink + cleanedText
    }

    // Verificar si la API key de Google Places está configurada
    if (!GOOGLE_PLACES_API_KEY) {
      console.log("API key de Google Places no configurada. Omitiendo verificación de lugares.")

      // Añadir nota sobre la API key al final del itinerario
      cleanedText += `
        <div class="api-key-notice" style="margin-top: 2rem; padding: 1rem; background-color: #fff3cd; border-left: 4px solid #ffc107; font-size: 0.9rem;">
          <p><strong>Nota:</strong> La verificación de lugares con Google Places API no está disponible actualmente. Para habilitar esta función, configura la API key de Google Places.</p>
        </div>
        `

      return { success: true, html: cleanedText }
    }

    // Verificación de lugares
    try {
      // Extraer y verificar los lugares marcados con [PLACE]
      const placeRegex = /"([^"]+)"\s*\[PLACE\]/g
      const places = [...cleanedText.matchAll(placeRegex)]

      console.log(`Encontrados ${places.length} lugares para verificar`)

      // Verificar un máximo de 30 lugares para no exceder límites de API
      const placesToVerify = places.slice(0, 30)

      // Contador para lugares problemáticos y cerrados permanentemente
      let problematicPlaces = 0
      let permanentlyClosedPlaces = 0
      let verifiedPlaces = 0

      // Verificar cada lugar y actualizar los enlaces
      for (const placeMatch of placesToVerify) {
        const placeName = placeMatch[1]

        try {
          // Verificar si el lugar existe y está cerca del destino
          console.log(`Verificando lugar: ${placeName} en ${params.destination}`)

          // Buscar el lugar en Google Places
          const searchResults = await searchPlaces(
            `${placeName} ${params.destination}`,
            undefined,
            undefined,
            searchCoords
              ? {
                  lat: searchCoords.lat,
                  lng: searchCoords.lng,
                  radius: maxDistance * 1000, // Convertir km a metros
                }
              : undefined,
          )

          if (searchResults && searchResults.length > 0) {
            verifiedPlaces++
            const firstResult = searchResults[0]
            const placeId = firstResult.place_id

            // Verificar si el lugar está cerrado permanentemente
            if (firstResult.permanently_closed === true || firstResult.business_status === "CLOSED_PERMANENTLY") {
              permanentlyClosedPlaces++

              // Generar un enlace de búsqueda genérico
              const searchLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + " " + params.destination)}`

              // Reemplazar el texto marcado con una advertencia de cierre permanente
              const oldText = `"${placeName}" [PLACE]`
              const newText = `<span class="closed-place-container">
                <span class="closed-place-name">${placeName}</span>
                <span class="closed-place-badge" title="Lugar cerrado permanentemente">Cerrado permanentemente</span>
                <a href="${searchLink}" target="_blank" class="closed-place-search">Buscar alternativas</a>
              </span>`

              cleanedText = cleanedText.replace(oldText, newText)
              continue
            }

            // Generar enlace a Google Maps
            const mapsLink = placeId
              ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
              : generateGoogleMapsLink(placeName, params.destination)

            // Determinar el nivel de precio si está disponible
            let priceLevel = ""
            if (firstResult.price_level !== undefined) {
              const priceLevelSymbols = "€".repeat(firstResult.price_level)
              priceLevel = ` <span class="price-level" title="${getPriceLevelDescription(firstResult.price_level)}">${priceLevelSymbols}</span>`
            }

            // Obtener análisis de sentimiento si tenemos placeId
            let sentimentHtml = ""
            if (placeId) {
              try {
                const sentiment = await getCachedPlaceSentiment(placeId)

                // Crear HTML para el análisis de sentimiento
                const sentimentColor = getSentimentColor(sentiment.score)

                sentimentHtml = `
                <div class="place-sentiment">
                  <div class="sentiment-score">
                    <div class="ai-stars">
                      ${Array.from({ length: 5 })
                        .map((_, i) => {
                          const starFill = sentiment.score - i
                          if (starFill >= 1) return `<span class="ai-star-full">★</span>`
                          if (starFill > 0) return `<span class="ai-star-half">★</span>`
                          return `<span class="ai-star-empty">★</span>`
                        })
                        .join("")}
                    </div>
                    <span class="ai-label">IA</span>
                  </div>
                  <div class="sentiment-tooltip">
                    <p class="sentiment-summary">${sentiment.summary}</p>
                    ${
                      sentiment.keywords.length > 0
                        ? `<div class="sentiment-keywords">
                        ${sentiment.keywords.map((keyword) => `<span class="sentiment-keyword">${keyword}</span>`).join(" ")}
                      </div>`
                        : ""
                    }
                  </div>
                </div>
                `
              } catch (error) {
                console.error(`Error analizando sentimiento para ${placeName}:`, error)
              }
            }

            // Obtener calificación oficial de Google si está disponible
            let ratingHtml = ""
            if (firstResult.rating) {
              ratingHtml = `
              <div class="place-rating">
                <div class="google-stars">
                  ${Array.from({ length: 5 })
                    .map(
                      (_, i) =>
                        `<span class="${i < Math.floor(firstResult.rating) ? "google-star-full" : "google-star-empty"}">★</span>`,
                    )
                    .join("")}
                </div>
                <span class="rating-value">${firstResult.rating.toFixed(1)}</span>
                ${
                  firstResult.user_ratings_total
                    ? `<span class="rating-count">(${firstResult.user_ratings_total})</span>`
                    : ""
                }
              </div>
              `
            }

            // Reemplazar el texto marcado con el enlace real a Google Maps y la información adicional
            const oldText = `"${placeName}" [PLACE]`
            const newText = `
            <div class="place-container">
              <a href="${mapsLink}" target="_blank" class="verified-place-link">
                ${placeName}${priceLevel} 
                <span class="verified-badge" title="Ubicación verificada">✓</span>
              </a>
              <div class="place-details">
                ${ratingHtml}
                ${sentimentHtml}
              </div>
            </div>
            `

            cleanedText = cleanedText.replace(oldText, newText)
          } else {
            // Si el lugar no existe o está demasiado lejos, marcar como problemático
            problematicPlaces++

            // Generar un enlace de búsqueda genérico
            const searchLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + " " + params.destination)}`

            // Reemplazar el texto marcado con un enlace de búsqueda
            const oldText = `"${placeName}" [PLACE]`
            const newText = `<a href="${searchLink}" target="_blank" class="unverified-place-link">${placeName} <span class="unverified-badge" title="Ubicación no verificada">?</span></a>`

            cleanedText = cleanedText.replace(oldText, newText)
          }
        } catch (error) {
          console.error(`Error verificando lugar ${placeName}:`, error)
          problematicPlaces++

          // En caso de error, crear un enlace de búsqueda genérico
          const searchLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + " " + params.destination)}`
          const oldText = `"${placeName}" [PLACE]`
          const newText = `<a href="${searchLink}" target="_blank" class="error-place-link">${placeName} <span class="error-badge" title="Error al verificar">!</span></a>`

          cleanedText = cleanedText.replace(oldText, newText)
        }
      }

      console.log(
        `Verificados ${verifiedPlaces} lugares. Problemáticos: ${problematicPlaces}. Cerrados permanentemente: ${permanentlyClosedPlaces}`,
      )

      // Si hay lugares cerrados permanentemente, añadir una advertencia al principio del itinerario
      if (permanentlyClosedPlaces > 0) {
        const warningHtml = `
          <div class="closed-places-warning" style="margin: 2rem 0; padding: 1rem; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0.5rem;">
            <h3 style="margin-top: 0; color: #dc2626; display: flex; align-items: center; gap: 0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              Advertencia: Lugares cerrados permanentemente
            </h3>
            <p style="margin-bottom: 0.5rem;">Se han detectado ${permanentlyClosedPlaces} lugares que están marcados como cerrados permanentemente en Google Maps.</p>
            <p style="margin-bottom: 0;">Estos lugares han sido marcados en el itinerario. Te recomendamos buscar alternativas para estos establecimientos.</p>
          </div>
          `

        // Insertar la advertencia al principio del itinerario
        cleanedText = warningHtml + cleanedText
      }

      // Añadir estilos CSS para los badges de verificación y análisis de sentimiento
      const verificationStyles = `
      <style>
        .verified-place-link {
          color: #059669;
          text-decoration: none;
          border-bottom: 1px dotted #059669;
        }
        .verified-place-link:hover {
          border-bottom: 1px solid #059669;
        }
        .verified-badge {
          display: inline-block;
          width: 16px;
          height: 16px;
          background-color: #059669;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          line-height: 16px;
          text-align: center;
          margin-left: 4px;
        }
        .unverified-place-link {
          color: #d97706;
          text-decoration: none;
          border-bottom: 1px dotted #d97706;
        }
        .unverified-place-link:hover {
          border-bottom: 1px solid #d97706;
        }
        .unverified-badge {
          display: inline-block;
          width: 16px;
          height: 16px;
          background-color: #d97706;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          line-height: 16px;
          text-align: center;
          margin-left: 4px;
        }
        .error-place-link {
          color: #dc2626;
          text-decoration: none;
          border-bottom: 1px dotted #dc2626;
        }
        .error-place-link:hover {
          border-bottom: 1px solid #dc2626;
        }
        .error-badge {
          display: inline-block;
          width: 16px;
          height: 16px;
          background-color: #dc2626;
          color: white;
          border-radius: 50%;
          font-size: 10px;
          line-height: 16px;
          text-align: center;
          margin-left: 4px;
        }
        .price-level {
          color: #6b7280;
          font-size: 0.85em;
        }
        
        /* Estilos para el contenedor de lugar */
        .place-container {
          display: inline-flex;
          flex-direction: column;
          margin-bottom: 0.5rem;
        }
        
        /* Estilos para los detalles del lugar */
        .place-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.25rem;
          font-size: 0.85rem;
        }
        
        /* Estilos para la calificación de Google */
        .place-rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .google-stars {
          display: inline-flex;
        }
        .google-star-full {
          color: #FBBC05;
        }
        .google-star-empty {
          color: #E0E0E0;
        }
        .rating-value {
          font-weight: 500;
        }
        .rating-count {
          color: #6b7280;
          font-size: 0.8em;
        }
        
        /* Estilos para el análisis de sentimiento */
        .place-sentiment {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .sentiment-score {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: help;
        }
        .ai-stars {
          display: inline-flex;
        }
        .ai-star-full {
          color: #10B981;
        }
        .ai-star-half {
          color: #10B981;
          opacity: 0.7;
        }
        .ai-star-empty {
          color: #E0E0E0;
        }
        .ai-label {
          font-size: 0.7em;
          background-color: #10B981;
          color: white;
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
        }
        
        /* Tooltip para el análisis de sentimiento */
        .sentiment-tooltip {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          width: 250px;
          background-color: white;
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          z-index: 10;
        }
        .place-sentiment:hover .sentiment-tooltip {
          display: block;
        }
        .sentiment-summary {
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
        }
        .sentiment-keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .sentiment-keyword {
          font-size: 0.75rem;
          background-color: #F3F4F6;
          padding: 0.1rem 0.4rem;
          border-radius: 0.25rem;
        }
      </style>
      `

      const closedPlacesStyles = `
      <style>
        /* Estilos para lugares cerrados permanentemente */
        .closed-place-container {
          display: inline-flex;
          flex-direction: column;
          margin-bottom: 0.5rem;
          border: 1px solid #fee2e2;
          padding: 0.5rem;
          border-radius: 0.375rem;
          background-color: #fef2f2;
        }
        .closed-place-name {
          text-decoration: line-through;
          color: #dc2626;
        }
        .closed-place-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          background-color: #dc2626;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          margin: 0.25rem 0;
        }
        .closed-place-search {
          font-size: 0.75rem;
          color: #4b5563;
          text-decoration: underline;
        }
        .closed-place-search:hover {
          color: #1f2937;
        }
      </style>
      `

      // Añadir los estilos al HTML
      cleanedText = verificationStyles + closedPlacesStyles + cleanedText

      // Verificar si quedan enlaces sin procesar (por límite de API)
      if (places.length > placesToVerify.length) {
        const remainingPlaces = places.length - placesToVerify.length
        const noticeHtml = `
          <div class="api-limit-notice" style="margin-top: 2rem; padding: 1rem; background-color: #e0f2fe; border-left: 4px solid #0ea5e9; font-size: 0.9rem;">
            <p><strong>Nota:</strong> Hay ${remainingPlaces} lugares adicionales que no se han verificado debido a límites de la API. Considera verificar manualmente estos lugares antes de visitarlos.</p>
          </div>
          `
        cleanedText += noticeHtml
      }
    } catch (error) {
      console.error("Error verificando lugares:", error)
      cleanedText += `
        <div class="api-key-notice" style="margin-top: 2rem; padding: 1rem; background-color: #fff3cd; border-left: 4px solid #ffc107; font-size: 0.9rem;">
          <p><strong>Error al verificar lugares:</strong> ${error.message}.</p>
          <p>Asegúrate de que la API key de Google Places está configurada correctamente y tiene los permisos necesarios.</p>
        </div>
        `
    }

    return { success: true, html: cleanedText }
  } catch (error) {
    console.error("Error al generar itinerario:", error)
    return {
      success: false,
      html: "",
      error: error instanceof Error ? error.message : "Error desconocido al generar el itinerario",
    }
  }
}

// Función auxiliar para convertir los modos de transporte a texto descriptivo
function getTransportModeText(modes: string[]): string {
  if (!modes || modes.length === 0) return "a pie"

  if (modes.length === 1) {
    switch (modes[0]) {
      case "walking":
        return "a pie"
      case "driving":
        return "en coche"
      case "transit":
        return "en transporte público"
      case "bicycling":
        return "en bicicleta"
      default:
        return "a pie"
    }
  }

  // Si hay múltiples modos, crear una descripción combinada
  const modeDescriptions = modes
    .map((mode) => {
      switch (mode) {
        case "walking":
          return "a pie"
        case "driving":
          return "en coche"
        case "transit":
          return "en transporte público"
        case "bicycling":
          return "en bicicleta"
        default:
          return ""
      }
    })
    .filter((desc) => desc !== "")

  if (modeDescriptions.length === 2) {
    return `${modeDescriptions[0]} y ${modeDescriptions[1]}`
  }

  const lastMode = modeDescriptions.pop()
  return `${modeDescriptions.join(", ")} y ${lastMode}`
}

// Función para determinar el color basado en la puntuación de sentimiento
function getSentimentColor(score: number): string {
  if (score >= 4) return "text-green-600"
  if (score >= 3) return "text-emerald-500"
  if (score >= 2) return "text-amber-500"
  return "text-red-500"
}
