"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import type { WeatherData as ExternalWeatherData } from "./services/weather-service"
import { getEnhancedPlaceDetails, generateGoogleMapsLink } from "./services/places-utils"
import { createClient } from "@supabase/supabase-js"
import { getUser } from "../lib/auth"
import { v4 as uuidv4 } from "uuid"

import {
  generateJsonItineraryPrompt,
  generateTransportPromptSection,
  generateBudgetPromptSection,
  generateWeatherPromptSection,
} from "./prompts/itinerary-prompts"

import type { JsonItinerary, Coordinates } from "../../types/enhanced-database"

import { getCachedPlaceSentiment } from "./services/place-sentiment-analysis"
import {
  getOrCreatePlaceVerification,
  updatePlaceVerification as updateDbPlaceVerification,
  savePlaceVerification as saveDbPlaceVerification,
  type PlaceVerificationData,
} from "./services/place-verification-database-service"
import {
  verifyPlace as verifyPlaceWithGoogle,
  geocodePlace,
  findAlternativePlace,
  isPlacePermanentlyClosed,
} from "./services/google-places-service"

// 🎯 IMPORTAR EL SISTEMA SIMPLIFICADO
import { SimpleItineraryCounter } from "./services/simple-itinerary-counter"

function shouldAnalyzeSentiment(place: any): boolean {
  console.log(`🤔 Evaluando si analizar sentimiento para:`, place)

  if (!place) {
    console.log(`❌ No place object`)
    return false
  }

  // Analizar sentimiento siempre que haya place_id disponible
  const hasPlaceId = !!(place.place_id || place.googlePlaceId || place.placeId)
  console.log(`🎯 ¿Tiene place_id?`, hasPlaceId)
  console.log(`🎯 ¿Debería analizar sentimiento?`, hasPlaceId)

  return hasPlaceId
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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
  weatherData?: ExternalWeatherData | null
  budget?: string
  customBudget?: string
  transportModes: string[]
  maxDistance: string
  tripType?: string
  boardType?: "sin-pension" | "solo-desayuno" | "media-pension" | "pension-completa"
  startDate?: string
}

function processFormData(formData: FormData): ItineraryParams {
  const destination = formData.get("destination")?.toString() || ""
  const days = formData.get("days")?.toString() || "3"
  const nights = formData.get("nights")?.toString() || "2"
  const hotel = formData.get("hotel")?.toString() || ""
  const placeId = formData.get("placeId")?.toString() || undefined
  const age = formData.get("age")?.toString() || "30-50"
  const travelers = formData.get("travelers")?.toString() || "2"
  const arrivalTime = formData.get("arrivalTime")?.toString() || "14:00"
  const departureTime = formData.get("departureTime")?.toString() || "10:00"
  const preferences = formData.get("preferences")?.toString() || undefined
  const budget = formData.get("budget")?.toString() || "medio"
  const customBudget = formData.get("customBudget")?.toString() || undefined
  const tripType = formData.get("tripType")?.toString() || undefined
  const boardType = (formData.get("boardType")?.toString() as ItineraryParams["boardType"]) || "sin-pension"
  const startDate = formData.get("startDate")?.toString() || ""
  const transportModes: string[] = []
  for (const [key, value] of formData.entries()) {
    if (key === "transportModes" && value) {
      transportModes.push(value.toString())
    }
  }
  if (transportModes.length === 0) transportModes.push("walking")
  const maxDistance = formData.get("maxDistance")?.toString() || "5"
  return {
    destination,
    days,
    nights,
    hotel,
    placeId,
    age,
    travelers,
    arrivalTime,
    departureTime,
    preferences,
    budget,
    customBudget,
    transportModes,
    maxDistance,
    tripType,
    boardType,
    startDate,
    weatherData: JSON.parse(formData.get("weatherData")?.toString() || "null"),
  }
}

// 🎯 FUNCIÓN SIMPLIFICADA PARA VERIFICAR LÍMITES
export async function checkItineraryLimits(): Promise<{
  canGenerate: boolean
  used: number
  limit: number
  message?: string
}> {
  const user = await getUser()
  if (!user) return { canGenerate: false, used: 0, limit: 0, message: "Usuario no autenticado" }

  return await SimpleItineraryCounter.checkLimits(user.id)
}

function _convertJsonToHtml(itineraryJson: JsonItinerary): string {
  let html = `<h1>${itineraryJson.title}</h1>`
  html += `<p><strong>Destino:</strong> ${itineraryJson.destination.name}</p>`
  html += `<p><strong>Fechas:</strong> ${itineraryJson.startDate} a ${itineraryJson.endDate} (${itineraryJson.daysCount} días)</p>`

  if (itineraryJson.preferences?.hotel?.name) {
    html += `<p><strong>Alojamiento:</strong> ${itineraryJson.preferences.hotel.name} ${itineraryJson.preferences.hotel.verified ? "(Verificado)" : ""}</p>`
  }

  itineraryJson.dailyPlans.forEach((day) => {
    html += `<div class="day-container" style="margin-bottom: 20px; padding:10px; border: 1px solid #ccc;">`
    html += `<h2>Día ${day.dayNumber}: ${day.title || ""} (${day.date})</h2>`
    if (day.summary) html += `<p>${day.summary}</p>`

    day.activities.forEach((activity) => {
      html += `<div class="activity-container" style="margin-left: 20px; margin-bottom: 10px;">`
      html += `<h3>${activity.startTime} ${activity.title} (${activity.type})</h3>`
      if (activity.description) html += `<p>${activity.description}</p>`
      if (activity.location) {
        const mapsLink =
          activity.location.mapsUrl || generateGoogleMapsLink(activity.location.name, itineraryJson.destination.name)
        html += `<p><strong>Lugar:</strong> <a href="${mapsLink}" target="_blank">${activity.location.name}</a> ${activity.location.verified ? "<span style='color:green;'>✓</span>" : "<span style='color:orange;'>?</span>"}`
        if (activity.location.address) html += ` (${activity.location.address})`
        html += `</p>`

        if (activity.sentiment && activity.sentiment.summary) {
          html += `<p style="font-size:0.9em; color:#555;"><em>Sentimiento IA: ${activity.sentiment.summary} (Score: ${activity.sentiment.score.toFixed(1)})</em></p>`
        }
      }
      if (activity.priceEstimate) {
        html += `<p><strong>Precio Estimado:</strong> ${activity.priceEstimate.amount} ${activity.priceEstimate.currency} ${activity.priceEstimate.perPerson ? "por persona" : ""}</p>`
      }
      if (activity.notes) html += `<p><em>Notas: ${activity.notes}</em></p>`
      html += `</div>`
    })
    html += `</div>`
  })

  if (itineraryJson.generalNotes) {
    html += `<h2>Notas Generales del Viaje</h2><p>${itineraryJson.generalNotes}</p>`
  }
  return html
}

export async function generateItinerary(
  formData: FormData,
): Promise<{ success: boolean; html?: string; itineraryJson?: JsonItinerary; error?: string; rawAiOutput?: string }> {
  const params = processFormData(formData)
  let rawAiOutput: string | undefined = undefined
  let tempHtmlOutput: string | undefined = undefined
  try {
    console.log(`🚀 Iniciando generación de itinerario para: ${params.destination}`)
    const user = await getUser()
    if (!user) {
      console.error("❌ Error de autenticación: Usuario no encontrado.")
      return { success: false, error: "Usuario no autenticado" }
    }
    console.log(`👤 Usuario autenticado: ${user.id}`)

    // 🎯 USAR SISTEMA SIMPLIFICADO PARA VERIFICAR LÍMITES
    const limits = await SimpleItineraryCounter.checkLimits(user.id)
    if (!limits.canGenerate) {
      console.warn(`⚠️ Límite de itinerarios alcanzado para el usuario ${user.id}.`)
      return { success: false, error: limits.message || "Límite mensual de itinerarios alcanzado" }
    }
    console.log(`📈 Límites de uso OK (${limits.used}/${limits.limit}).`)

    const weatherPromptSection = params.weatherData ? generateWeatherPromptSection(params.weatherData as any) : ""
    const transportPromptSection = generateTransportPromptSection(params.transportModes, params.maxDistance)

    let hotelDetailsForPrompt: any = null
    if (params.placeId) {
      try {
        console.log(`🏨 Obteniendo detalles del hotel verificado con placeId: ${params.placeId}`)
        hotelDetailsForPrompt = await getEnhancedPlaceDetails(params.placeId)
        if (hotelDetailsForPrompt) {
          console.log("🏨 Detalle completo de hotelDetailsForPrompt:", JSON.stringify(hotelDetailsForPrompt, null, 2))
          if (hotelDetailsForPrompt.geometry) {
            console.log("🏨 Geometría del hotel:", JSON.stringify(hotelDetailsForPrompt.geometry, null, 2))
            if (hotelDetailsForPrompt.geometry.location) {
              console.log(
                "🏨 Ubicación de la geometría del hotel:",
                JSON.stringify(hotelDetailsForPrompt.geometry.location, null, 2),
              )
              console.log(
                "🏨 Tipo de lat:",
                typeof hotelDetailsForPrompt.geometry.location.lat,
                "Valor:",
                hotelDetailsForPrompt.geometry.location.lat,
              )
              console.log(
                "🏨 Tipo de lng:",
                typeof hotelDetailsForPrompt.geometry.location.lng,
                "Valor:",
                hotelDetailsForPrompt.geometry.location.lng,
              )
            } else {
              console.warn("🏨 ADVERTENCIA: hotelDetailsForPrompt.geometry.location NO ESTÁ PRESENTE.")
            }
          } else {
            console.warn("🏨 ADVERTENCIA: hotelDetailsForPrompt.geometry NO ESTÁ PRESENTE.")
          }
        } else {
          console.warn(
            `🏨 ADVERTENCIA: No se pudieron obtener hotelDetailsForPrompt para placeId: ${params.placeId}, getEnhancedPlaceDetails devolvió null/undefined.`,
          )
        }
      } catch (e) {
        console.error("❌ Error obteniendo detalles del hotel para el prompt:", e)
        hotelDetailsForPrompt = null // Asegurarse que es null en caso de error
      }
    }

    const hotelInfoForPrompt = hotelDetailsForPrompt
      ? `
INFORMACIÓN DEL ALOJAMIENTO VERIFICADO (para tu referencia al generar el JSON):
- Nombre: ${hotelDetailsForPrompt.name}
- Dirección: ${hotelDetailsForPrompt.formatted_address || "No disponible"}
- Calificación: ${hotelDetailsForPrompt.rating ? `${hotelDetailsForPrompt.rating}/5` : "No disponible"}
- Google Place ID: ${params.placeId}
- Coordenadas: Lat: ${hotelDetailsForPrompt.geometry?.location?.lat || "No disponible"}, Lng: ${hotelDetailsForPrompt.geometry?.location?.lng || "No disponible"}
Considera esta información al rellenar \`JsonTravelPreferences.hotel\`.
`
      : `El usuario ha indicado como preferencia de alojamiento: "${params.hotel}". Si es un nombre genérico, elige un hotel adecuado. Si es específico, úsalo.`

    const budgetPromptSection = generateBudgetPromptSection(params.budget!, params.customBudget)
    let boardTypeInfoForPrompt = ""
    if (params.boardType) {
      switch (params.boardType) {
        case "sin-pension":
          boardTypeInfoForPrompt = "El hotel es sin pensión. Recomienda lugares para todas las comidas."
          break
        case "solo-desayuno":
          boardTypeInfoForPrompt = "El hotel incluye desayuno. Recomienda almuerzos y cenas."
          break
        case "media-pension":
          boardTypeInfoForPrompt = "El hotel incluye desayuno y cena. Recomienda almuerzos."
          break
        case "pension-completa":
          boardTypeInfoForPrompt =
            "El hotel incluye todas las comidas. Enfócate en actividades, no en restaurantes para comidas principales."
          break
      }
    }
    const jsonPrompt = generateJsonItineraryPrompt({
      ...params,
      weatherInfo: weatherPromptSection,
      hotelInfo: hotelInfoForPrompt,
      budgetInfo: budgetPromptSection,
      transportInfo: transportPromptSection,
      boardTypeInfo: boardTypeInfoForPrompt,
      maxDistance: params.maxDistance,
    })
    console.log("🤖 Preparando y enviando prompt a la IA...")
    const { text: rawAiJsonOutput } = await generateText({
      model: openai("gpt-4o"),
      prompt: jsonPrompt,
      temperature: 0.6,
      maxTokens: 4000,
    })
    rawAiOutput = rawAiJsonOutput
    console.log("✅ Respuesta JSON cruda recibida de la IA.")
    let cleanedJsonOutput = rawAiOutput.trim()
    if (cleanedJsonOutput.startsWith("```json")) {
      cleanedJsonOutput = cleanedJsonOutput.substring(7)
      if (cleanedJsonOutput.endsWith("```")) {
        cleanedJsonOutput = cleanedJsonOutput.substring(0, cleanedJsonOutput.length - 3)
      }
    } else if (cleanedJsonOutput.startsWith("```")) {
      cleanedJsonOutput = cleanedJsonOutput.substring(3)
      if (cleanedJsonOutput.endsWith("```")) {
        cleanedJsonOutput = cleanedJsonOutput.substring(0, cleanedJsonOutput.length - 3)
      }
    }
    cleanedJsonOutput = cleanedJsonOutput.trim()
    let parsedItinerary: JsonItinerary
    try {
      parsedItinerary = JSON.parse(cleanedJsonOutput)
    } catch (e) {
      console.error("❌ Error parseando JSON de IA (después de limpiar):", e)
      console.error("AI Output (crudo) con error:", rawAiOutput)
      console.error("AI Output (limpio intentado) con error:", cleanedJsonOutput)
      return {
        success: false,
        error: "Error al procesar la respuesta de la IA (JSON inválido incluso después de limpiar).",
        rawAiOutput,
      }
    }
    console.log("👍 JSON parseado correctamente.")

    console.log("🔄 Iniciando proceso de enriquecimiento del itinerario...")
    parsedItinerary.id = uuidv4()
    parsedItinerary.userId = user.id
    const now = new Date().toISOString()
    parsedItinerary.createdAt = now
    parsedItinerary.updatedAt = now
    parsedItinerary.version = 1

    // Asegurar que las coordenadas del hotel se establecen si el hotel fue verificado
    if (params.placeId && hotelDetailsForPrompt && hotelDetailsForPrompt.geometry?.location) {
      if (!parsedItinerary.preferences) parsedItinerary.preferences = {}
      if (!parsedItinerary.preferences.hotel) parsedItinerary.preferences.hotel = {}

      const hotelCoords = {
        lat: hotelDetailsForPrompt.geometry.location.lat,
        lng: hotelDetailsForPrompt.geometry.location.lng,
      }

      // Solo actualizar si las coordenadas son números válidos
      if (
        typeof hotelCoords.lat === "number" &&
        !isNaN(hotelCoords.lat) &&
        typeof hotelCoords.lng === "number" &&
        !isNaN(hotelCoords.lng)
      ) {
        parsedItinerary.preferences.hotel.name =
          hotelDetailsForPrompt.name || parsedItinerary.preferences.hotel.name || params.hotel
        parsedItinerary.preferences.hotel.googlePlaceId = params.placeId
        parsedItinerary.preferences.hotel.verified = true
        parsedItinerary.preferences.hotel.coordinates = hotelCoords
        parsedItinerary.preferences.hotel.address =
          hotelDetailsForPrompt.formatted_address || parsedItinerary.preferences.hotel.address
        console.log(
          `🏨✅ Coordenadas del hotel establecidas explícitamente:`,
          JSON.stringify(parsedItinerary.preferences.hotel.coordinates),
        )
      } else {
        console.warn(
          `🏨❌ Coordenadas del hotel de hotelDetailsForPrompt no son números válidos. Lat: ${hotelCoords.lat}, Lng: ${hotelCoords.lng}. No se establecerán explícitamente.`,
        )
      }
    } else {
      if (params.placeId) {
        if (!hotelDetailsForPrompt) {
          console.warn(
            `🏨❌ No se establecieron coords del hotel porque hotelDetailsForPrompt es nulo/undefined para placeId ${params.placeId}.`,
          )
        } else if (!hotelDetailsForPrompt.geometry?.location) {
          console.warn(
            `🏨❌ No se establecieron coords del hotel porque hotelDetailsForPrompt.geometry?.location es nulo/undefined para placeId ${params.placeId}. Detalle de geometría: ${JSON.stringify(hotelDetailsForPrompt.geometry)}`,
          )
        }
      }
      if (parsedItinerary.preferences?.hotel?.coordinates) {
        console.log(
          "🏨 Coordenadas del hotel (posiblemente de IA, no sobreescritas explícitamente):",
          JSON.stringify(parsedItinerary.preferences.hotel.coordinates),
        )
      } else {
        console.log("🏨 No hay coordenadas del hotel (ni de verificación explícita ni de IA).")
      }
    }

    // Asegurar que las coordenadas del destino principal están establecidas
    const areCoordsValid = (coords: any): coords is Coordinates => {
      return (
        coords &&
        typeof coords.lat === "number" &&
        typeof coords.lng === "number" &&
        !isNaN(coords.lat) &&
        !isNaN(coords.lng)
      )
    }

    if (!parsedItinerary.destination) {
      parsedItinerary.destination = { name: params.destination }
    } else if (!parsedItinerary.destination.name) {
      parsedItinerary.destination.name = params.destination
    }

    if (!areCoordsValid(parsedItinerary.destination.coordinates)) {
      console.warn(
        `⚠️ Coordenadas del destino principal ausentes o inválidas desde la IA para "${parsedItinerary.destination.name}". Intentando geocodificar.`,
      )
      try {
        const geocodedDestination = await geocodePlace(parsedItinerary.destination.name)
        if (
          geocodedDestination &&
          typeof geocodedDestination.lat === "number" &&
          typeof geocodedDestination.lng === "number"
        ) {
          parsedItinerary.destination.coordinates = {
            lat: geocodedDestination.lat,
            lng: geocodedDestination.lng,
          }
          console.log(
            `🌍 Coordenadas del destino principal geocodificadas exitosamente:`,
            parsedItinerary.destination.coordinates,
          )
        } else {
          console.error(`❌ Falló la geocodificación para el destino principal: "${parsedItinerary.destination.name}"`)
        }
      } catch (geoError) {
        console.error(
          `❌ Error durante la geocodificación del destino principal "${parsedItinerary.destination.name}":`,
          geoError,
        )
      }
    } else {
      console.log(`🌍 Coordenadas del destino principal desde la IA:`, parsedItinerary.destination.coordinates)
    }

    for (const day of parsedItinerary.dailyPlans || []) {
      for (const activity of day.activities || []) {
        activity.id = uuidv4()
        if (activity.location && activity.location.name && activity.location.verificationSource === "ai_suggestion") {
          const placeNameFromAI = activity.location.name
          let finalDbVerification: PlaceVerificationData | null = null
          let wasReplaced = false

          try {
            console.log(`  ➡️ Verificando en BD para: "${placeNameFromAI}" en ${parsedItinerary.destination.name}`)
            const dbCheck = await getOrCreatePlaceVerification(placeNameFromAI, parsedItinerary.destination.name)

            const threeMonthsAgo = new Date()
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
            const isDbDataOld = dbCheck && new Date(dbCheck.verified_at) < threeMonthsAgo

            if (dbCheck && !isDbDataOld) {
              console.log(`    ♻️ Usando datos recientes de BD para "${placeNameFromAI}"`)
              finalDbVerification = dbCheck
            } else {
              if (dbCheck && isDbDataOld) {
                console.log(
                  `    ⏰ Datos de BD antiguos para "${placeNameFromAI}". Se intentará actualizar con Google.`,
                )
              } else {
                console.log(`    🤷‍♀️ No encontrado en BD para "${placeNameFromAI}". Se consultará Google.`)
              }

              const googleVerificationResult = await verifyPlaceWithGoogle(
                placeNameFromAI,
                parsedItinerary.destination.name,
                parsedItinerary.preferences?.hotel?.coordinates || parsedItinerary.destination.coordinates,
              )

              if (googleVerificationResult && googleVerificationResult.exists) {
                console.log(
                  `      🔍 Google Places encontró: "${googleVerificationResult.correctedName}" (ID: ${googleVerificationResult.placeId})`,
                )

                // NUEVA VERIFICACIÓN: Comprobar si está cerrado permanentemente
                if (
                  googleVerificationResult.placeDetails &&
                  isPlacePermanentlyClosed(googleVerificationResult.placeDetails)
                ) {
                  console.log(`      ⚠️ LUGAR CERRADO PERMANENTEMENTE: "${googleVerificationResult.correctedName}"`)

                  // Buscar alternativa automáticamente
                  const placeTypes = googleVerificationResult.placeDetails.types || []
                  const primaryType =
                    placeTypes.find((type) =>
                      ["restaurant", "tourist_attraction", "museum", "park", "cafe", "bar", "store"].includes(type),
                    ) || "tourist_attraction"

                  const searchCoords =
                    parsedItinerary.preferences?.hotel?.coordinates || parsedItinerary.destination.coordinates
                  const alternative = await findAlternativePlace(
                    placeNameFromAI,
                    primaryType,
                    parsedItinerary.destination.name,
                    searchCoords,
                    2000, // 2km radius
                  )

                  if (alternative) {
                    console.log(`      🔄 REEMPLAZANDO "${placeNameFromAI}" por "${alternative.name}"`)

                    // Verificar la alternativa
                    const alternativeVerification = await verifyPlaceWithGoogle(
                      alternative.name,
                      parsedItinerary.destination.name,
                      searchCoords,
                    )

                    if (
                      alternativeVerification &&
                      alternativeVerification.exists &&
                      (!alternativeVerification.placeDetails ||
                        !isPlacePermanentlyClosed(alternativeVerification.placeDetails))
                    ) {
                      // Usar la alternativa
                      if (isDbDataOld && dbCheck) {
                        finalDbVerification = await updateDbPlaceVerification(dbCheck.id, alternativeVerification)
                      } else {
                        finalDbVerification = await saveDbPlaceVerification(
                          alternative.name,
                          parsedItinerary.destination.name,
                          alternativeVerification,
                        )
                      }
                      wasReplaced = true
                      console.log(`      ✅ ALTERNATIVA VERIFICADA Y GUARDADA: "${alternative.name}"`)
                    } else {
                      console.log(`      ❌ Alternativa también tiene problemas, manteniendo original con advertencia`)
                      // Mantener el lugar original pero marcarlo como problemático
                      if (isDbDataOld && dbCheck) {
                        finalDbVerification = await updateDbPlaceVerification(dbCheck.id, googleVerificationResult)
                      } else {
                        finalDbVerification = await saveDbPlaceVerification(
                          placeNameFromAI,
                          parsedItinerary.destination.name,
                          googleVerificationResult,
                        )
                      }
                    }
                  } else {
                    console.log(
                      `      ❌ No se encontró alternativa para "${placeNameFromAI}", manteniendo original con advertencia`,
                    )
                    // Mantener el lugar original pero marcarlo como problemático
                    if (isDbDataOld && dbCheck) {
                      finalDbVerification = await updateDbPlaceVerification(dbCheck.id, googleVerificationResult)
                    } else {
                      finalDbVerification = await saveDbPlaceVerification(
                        placeNameFromAI,
                        parsedItinerary.destination.name,
                        googleVerificationResult,
                      )
                    }
                  }
                } else {
                  // Lugar abierto, proceder normalmente
                  if (isDbDataOld && dbCheck) {
                    finalDbVerification = await updateDbPlaceVerification(dbCheck.id, googleVerificationResult)
                  } else {
                    finalDbVerification = await saveDbPlaceVerification(
                      placeNameFromAI,
                      parsedItinerary.destination.name,
                      googleVerificationResult,
                    )
                  }
                }
              } else {
                console.log(`      ⚠️ Google Places no encontró o no verificó: "${placeNameFromAI}"`)
                if (dbCheck) {
                  console.log(
                    `      -> Manteniendo datos de BD existentes (aunque antiguos o no re-verificados por Google) para "${placeNameFromAI}"`,
                  )
                  finalDbVerification = dbCheck
                }
              }
            }

            if (finalDbVerification) {
              console.log(
                `    ✅ Lugar procesado: "${placeNameFromAI}" -> "${finalDbVerification.place_name}" (ID BD: ${finalDbVerification.id})${wasReplaced ? " [REEMPLAZADO]" : ""}`,
              )

              // MAPEO COMPLETO DE TODOS LOS CAMPOS DISPONIBLES
              activity.location.googlePlaceId = finalDbVerification.place_id
              activity.location.placeId = finalDbVerification.place_id // Compatibilidad
              activity.location.address = finalDbVerification.formatted_address || activity.location.address
              activity.location.coordinates = finalDbVerification.coordinates
                ? { lat: finalDbVerification.coordinates.lat, lng: finalDbVerification.coordinates.lng }
                : activity.location.coordinates
              activity.location.mapsUrl =
                finalDbVerification.official_url ||
                (finalDbVerification.place_id
                  ? `https://www.google.com/maps/place/?q=place_id:${finalDbVerification.place_id}`
                  : generateGoogleMapsLink(finalDbVerification.place_name, parsedItinerary.destination.name))
              activity.location.verified = true
              activity.location.verificationSource = finalDbVerification.place_id ? "google_places" : "database_cache"
              activity.location.name = finalDbVerification.place_name

              // NUEVOS CAMPOS AÑADIDOS
              activity.location.rating = finalDbVerification.rating
              activity.location.userRating = finalDbVerification.rating // Alias para compatibilidad
              activity.location.userRatingsTotal = (finalDbVerification as any).user_ratings_total
              activity.location.website = (finalDbVerification as any).website
              activity.location.phoneNumber = (finalDbVerification as any).phone_number
              activity.location.openingHours = (finalDbVerification as any).opening_hours
              activity.location.priceLevel = finalDbVerification.price_level
              activity.location.businessStatus = finalDbVerification.business_status

              // Añadir nota si fue reemplazado
              if (wasReplaced) {
                const originalNote = activity.notes || ""
                activity.notes = originalNote + (originalNote ? " " : "") + `[Lugar actualizado por disponibilidad]`
              }

              // ANÁLISIS DE SENTIMIENTO MEJORADO
              console.log(`🎭 Verificando condiciones para sentimiento:`, {
                place_id: !!finalDbVerification.place_id,
                place_types: finalDbVerification.place_types,
                place_name: finalDbVerification.place_name,
              })

              if (
                finalDbVerification.place_id &&
                finalDbVerification.place_types &&
                shouldAnalyzeSentiment({
                  place_types: finalDbVerification.place_types,
                  place_id: finalDbVerification.place_id,
                })
              ) {
                try {
                  console.log(`    🤔 Analizando sentimiento para "${finalDbVerification.place_name}"...`)
                  const sentiment = await getCachedPlaceSentiment(finalDbVerification.place_id)
                  activity.sentiment = {
                    score: sentiment.score,
                    summary: sentiment.summary,
                    keywords: sentiment.keywords,
                    label: sentiment.score > 3.5 ? "positive" : sentiment.score < 2.5 ? "negative" : "neutral",
                    source: "internal_model",
                    reviewCount: sentiment.review_count,
                  }
                  console.log(`      -> Sentimiento: ${sentiment.summary} (Score: ${sentiment.score})`)
                } catch (sentimentError) {
                  console.error(
                    `    ❌ Error analizando sentimiento para ${finalDbVerification.place_name}:`,
                    sentimentError,
                  )
                }
              }
            } else {
              console.warn(`    ⚠️ Lugar no verificado/guardado en BD (final): "${placeNameFromAI}"`)
              activity.location.verified = false
              activity.location.verificationSource = "not_verified"
              activity.location.mapsUrl = generateGoogleMapsLink(placeNameFromAI, parsedItinerary.destination.name)
            }
          } catch (verificationError) {
            console.error(`  ❌ Error crítico procesando lugar "${placeNameFromAI}":`, verificationError)
            activity.location.verified = false
            activity.location.verificationSource = "verification_error"
            activity.location.mapsUrl = generateGoogleMapsLink(placeNameFromAI, parsedItinerary.destination.name)
          }
        }
      }
    }
    console.log("✅ Proceso de enriquecimiento completado.")

    // 🎯 INCREMENTAR CONTADORES ANTES DE GUARDAR EN BD
    console.log("📊 Incrementando contadores de usuario...")
    const incrementResult = await SimpleItineraryCounter.incrementCounters(user.id)

    if (!incrementResult.success) {
      // El error ya se loguea dentro de incrementCounters.
      // Aquí solo añadimos contexto de que la generación ya se hizo.
      console.error(
        `CRITICAL: El contador de uso no pudo ser actualizado para el usuario ${user.id} después de la generación. El itinerario se guardará, pero el recuento de uso es incorrecto.`,
      )
      // No detenemos el proceso, ya que el usuario debe recibir el itinerario que se generó.
      // El problema está en el contador, no en la generación.
    }

    tempHtmlOutput = _convertJsonToHtml(parsedItinerary)

    try {
      const { error: saveError } = await supabase.from("itineraries").insert({
        id: parsedItinerary.id,
        user_id: user.id,
        title: parsedItinerary.title,
        destination: parsedItinerary.destination.name,
        days: Number.parseInt(params.days),
        nights: Number.parseInt(params.nights),
        travelers: Number.parseInt(params.travelers),
        budget_type: params.budget || "medio",
        hotel: params.hotel,
        arrival_time: params.arrivalTime,
        departure_time: params.departureTime,
        html_content: tempHtmlOutput,
        json_content: parsedItinerary,
        weather_data: params.weatherData,
        budget_details: parsedItinerary.budget
          ? {
              total_estimated: parsedItinerary.budget.totalEstimated,
              breakdown: parsedItinerary.budget.breakdown,
              currency: parsedItinerary.budget.currency,
            }
          : null,
        board_type: params.boardType,
        start_date: parsedItinerary.startDate,
        end_date: parsedItinerary.endDate,
        is_history: true,
        is_current: true,
        is_favorite: false,
        generation_params: {
          destination: params.destination,
          days: Number.parseInt(params.days),
          travelers: Number.parseInt(params.travelers),
          budget_type: params.budget || "medio",
          board_type: params.boardType,
          hotel: params.hotel,
          arrival_time: params.arrivalTime,
          departure_time: params.departureTime,
          weather_included: !!params.weatherData,
          timestamp: now,
        },
      })

      if (saveError) {
        console.error("Error guardando itinerario en BD:", saveError)
      } else {
        console.log(`💾 Itinerario guardado en BD con ID: ${parsedItinerary.id}`)
      }
    } catch (dbError) {
      console.error("Error crítico guardando en BD:", dbError)
    }

    console.log(`🎉 Itinerario generado y enriquecido exitosamente para ${params.destination}.`)
    return { success: true, html: tempHtmlOutput, itineraryJson: parsedItinerary, rawAiOutput }
  } catch (error) {
    console.error("❌ Error catastrófico en generateItinerary:", error)
    const errorMessage =
      error instanceof Error ? `${error.name}: ${error.message}` : "Error desconocido al generar el itinerario JSON"
    return { success: false, error: errorMessage, rawAiOutput }
  }
}
