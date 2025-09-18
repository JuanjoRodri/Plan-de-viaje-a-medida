import type { WeatherData } from "../services/weather-service"

// Función segura para unir arrays
function safeJoin(arr: any[] | undefined | null, separator = "\n"): string {
  if (!arr || !Array.isArray(arr)) return ""
  return arr.filter((item) => item !== undefined && item !== null).join(separator)
}

// Interfaz para los parámetros del prompt
interface ItineraryPromptParams {
  destination: string
  days: string
  nights: string
  hotel: string // Nombre del hotel o preferencia
  placeId?: string // Google Place ID del hotel si es verificado
  travelers: string
  age: string
  arrivalTime: string
  departureTime: string
  preferences?: string
  budget?: string // "bajo", "medio", "alto", "personalizado"
  customBudget?: string // Valor numérico si es personalizado
  transportModes: string[]
  maxDistance: string // Restaurado desde la versión anterior
  weatherInfo: string // Ya formateada
  hotelInfo: string // Información del hotel verificado (si existe)
  budgetInfo: string // Sección de presupuesto ya formateada
  transportInfo: string // Sección de transporte ya formateada
  tripType?: string
  boardType?: "sin-pension" | "solo-desayuno" | "media-pension" | "pension-completa"
  boardTypeInfo?: string // Sección de tipo de pensión ya formateada
  startDate?: string
}

// Generar la sección del clima para el prompt
export function generateWeatherPromptSection(weatherData: WeatherData): string {
  if (!weatherData || !weatherData.forecast || !Array.isArray(weatherData.forecast)) {
    return ""
  }

  const forecastLines = weatherData.forecast.map((day) => {
    if (!day || !day.date) return ""
    try {
      const date = new Date(day.date)
      const formattedDate = date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      // Asegurarse que minTemp, maxTemp, condition, chanceOfRain existen antes de usarlos
      const minTemp = day.temperature?.min ?? "N/A"
      const maxTemp = day.temperature?.max ?? "N/A"
      const condition = day.description ?? "No disponible"
      const chanceOfRain = (day as any).chanceOfRain ?? 0 // Asumiendo que chanceOfRain puede no estar en el tipo base

      return `- ${formattedDate}: ${minTemp}°C-${maxTemp}°C, ${condition}, ${chanceOfRain}% probabilidad de lluvia`
    } catch (error) {
      console.error("Error formateando fecha del clima:", error)
      return ""
    }
  })

  return `
INFORMACIÓN DEL CLIMA:
Durante la estancia, se prevén las siguientes condiciones climáticas:
${safeJoin(forecastLines)}

IMPORTANTE: Adapta las actividades según estas condiciones climáticas. Sugiere actividades al aire libre en días con buen tiempo y alternativas en interiores para días con mal tiempo o lluvia.
`
}

// Generar la sección de transporte para el prompt (VERSIÓN MEJORADA CON CONTEXTO GEOGRÁFICO)
export function generateTransportPromptSection(transportModes: string[], maxDistance: string): string {
  function safeGetTransportModeText(modes: string[] | undefined | null): string {
    if (!modes || !Array.isArray(modes) || modes.length === 0) return "a pie"
    const validModes = modes.filter((mode) => mode && typeof mode === "string")
    if (validModes.length === 0) return "a pie"

    if (validModes.length === 1) {
      switch (validModes[0]) {
        case "walking":
          return "a pie"
        case "driving":
          return "en coche"
        case "transit":
          return "en transporte público"
        case "bicycling":
          return "en bicicleta"
        case "taxi":
          return "en taxi/VTC"
        default:
          return "a pie"
      }
    }

    const modeDescriptions = validModes
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
          case "taxi":
            return "en taxi/VTC"
          default:
            return ""
        }
      })
      .filter((desc) => desc !== "")

    if (modeDescriptions.length === 0) return "a pie"
    if (modeDescriptions.length === 1) return modeDescriptions[0]
    if (modeDescriptions.length === 2) return `${modeDescriptions[0]} y ${modeDescriptions[1]}`
    const lastMode = modeDescriptions.pop()
    return `${modeDescriptions.join(", ")} y ${lastMode}`
  }

  const transportModeText = safeGetTransportModeText(transportModes)
  const maxDistanceValue = maxDistance || "5"

  return `
RESTRICCIONES DE DISTANCIA Y TRANSPORTE:

El usuario ha seleccionado desplazarse principalmente ${transportModeText} con una distancia máxima de ${maxDistanceValue} km desde el alojamiento.

CONTEXTO GEOGRÁFICO Y LIMITACIONES:
- IMPORTANTE: Como IA, no tienes acceso a datos geográficos en tiempo real ni conocimiento exacto de distancias
- Si el destino es un pueblo pequeño o zona costera: Los restaurantes y atracciones principales suelen estar concentrados en el centro histórico/casco urbano
- Si el destino es una ciudad grande: Puede haber múltiples zonas de interés separadas
- En pueblos pequeños (como Peñíscola, Cudillero, Santillana del Mar, etc.): TODO debe estar accesible a pie en máximo 15-20 minutos

MANEJO DE INCERTIDUMBRE GEOGRÁFICA - OBLIGATORIO:
- Si NO estás seguro de la distancia real de un lugar, DEBES indicarlo con una nota: "⚠️ Distancia a verificar - se recomienda consultar con un profesional local"
- Si un restaurante o atracción podría estar fuera del radio de ${maxDistanceValue}km, inclúyelo SOLO si añades la nota de verificación
- PRIORIZA SIEMPRE lugares que estés SEGURO que están dentro del radio establecido
- Para pueblos pequeños: Asume que el centro histórico/casco urbano está dentro de 1-2km máximo

RESTRICCIONES ESTRICTAS POR MODO DE TRANSPORTE:
- A PIE + ${maxDistanceValue}km: 
  * Máximo 20-25 minutos caminando por trayecto
  * En pueblos pequeños: Todo debe estar en el casco urbano/centro histórico
  * PROHIBIDO: Restaurantes en polígonos industriales, centros comerciales alejados, o "afueras"
  
- TRANSPORTE PÚBLICO + ${maxDistanceValue}km:
  * Solo lugares accesibles con transporte público directo
  * Máximo 30 minutos de trayecto
  
- COCHE + ${maxDistanceValue}km:
  * Máximo ${maxDistanceValue}km de distancia real por carretera
  * Incluir tiempo estimado de conducción

REGLAS OBLIGATORIAS:
- La distancia máxima desde el alojamiento para actividades debe ser de ${maxDistanceValue} km.
- Organiza el itinerario para que las actividades estén agrupadas por proximidad geográfica.
- Prioriza lugares que estés dentro del radio de ${maxDistanceValue} km desde el hotel.
- Para cada actividad, incluye una estimación de tiempo de transporte desde la actividad anterior o el hotel, usando el modo de transporte principal.

RESTRICCIONES ESPECIALES PARA RESTAURANTES:
- Los restaurantes deben estar preferiblemente en el centro histórico o casco urbano.
- Si la distancia máxima es de 5km o menos, los restaurantes NO deben estar en zonas residenciales alejadas o "afueras".
- Prioriza restaurantes accesibles con el modo de transporte seleccionado.
- Si no estás seguro de la ubicación exacta de un restaurante, añade: "⚠️ Verificar ubicación exacta"

EXCEPCIONES PERMITIDAS:
- Si recomiendas lugares fuera del radio establecido, DEBES indicarlo claramente con: "⚠️ Fuera del radio establecido - verificar distancia real"
- Las excepciones solo se permiten para atracciones muy importantes o únicas del destino.
- NUNCA hagas excepciones para restaurantes sin la nota de verificación correspondiente.

PROHIBICIONES ABSOLUTAS:
- NO incluyas lugares en otras ciudades, pueblos o municipios diferentes al destino principal.
- NO incluyas lugares en otras provincias o comunidades autónomas.
- NO incluyas excursiones que requieran más del doble de la distancia máxima establecida.
- NO recomiendes lugares sin estar razonablemente seguro de que están dentro del radio o sin añadir la nota de verificación.
`
}

// Generar la sección de presupuesto para el prompt
export function generateBudgetPromptSection(budget: string, customBudget?: string, bestPlacesInfo?: string): string {
  let budgetDescription = ""
  let budgetInstructions = ""

  switch (budget) {
    case "bajo":
      budgetDescription = "económico (€)"
      budgetInstructions =
        "Prioriza opciones económicas y asequibles. Busca restaurantes con nivel de precio € (1 de 4) y atracciones gratuitas o de bajo costo."
      break
    case "medio":
      budgetDescription = "estándar (€€)"
      budgetInstructions =
        "Equilibra opciones de precio moderado. Prioriza restaurantes con nivel de precio €€ (2 de 4) y atracciones de costo medio."
      break
    case "alto":
      budgetDescription = "premium (€€€-€€€€)"
      budgetInstructions =
        "Prioriza experiencias de alta calidad y exclusivas. Incluye los mejores restaurantes (€€€ o €€€€, 3 o 4 de 4) y atracciones premium. NO recomiendes opciones económicas a menos que sean excepcionalmente buenas o únicas."
      break
    default: // personalizado
      const budgetValue = Number.parseInt(customBudget?.replace(/[^0-9]/g, "") || "0", 10)
      if (budgetValue <= 50) {
        budgetDescription = `personalizado de ${customBudget} (considerado económico, €)`
        budgetInstructions = "Prioriza opciones económicas y asequibles."
      } else if (budgetValue <= 150) {
        budgetDescription = `personalizado de ${customBudget} (considerado estándar, €€)`
        budgetInstructions = "Equilibra opciones de precio moderado."
      } else {
        budgetDescription = `personalizado de ${customBudget} (considerado premium, €€€-€€€€)`
        budgetInstructions = "Prioriza experiencias de alta calidad y exclusivas."
      }
  }

  return `
INFORMACIÓN DE PRESUPUESTO:
- El usuario ha seleccionado un presupuesto ${budgetDescription}.
- ${budgetInstructions}
- Para cada actividad o comida que tenga un costo, incluye una estimación en el campo \`priceEstimate\`.
- Si recomiendas algún lugar fuera del rango de presupuesto, indícalo en las notas de la actividad.
${bestPlacesInfo || ""}
`
}

// Generar el prompt completo para el itinerario HTML
export function generateItineraryPrompt(params: ItineraryPromptParams): string {
  const tripInfo = `
INFORMACIÓN DEL VIAJE:
- Destino: ${params.destination}
- Duración: ${params.days} días y ${params.nights} noches
- Alojamiento: ${params.hotel}
- Viajeros: ${params.travelers} personas, ${params.age} años
- Hora de llegada: ${params.arrivalTime}
- Hora de salida: ${params.departureTime}
${params.tripType ? `- Tipo de viaje: ${params.tripType}` : ""}
${params.preferences ? `- Preferencias: ${params.preferences}` : ""}
`
  const formatInstructions = `
INSTRUCCIONES DE FORMATO - OBLIGATORIAS:

1. MARCADO DE LUGARES (CRÍTICO):
   - TODOS los lugares mencionados DEBEN llevar [PLACE] inmediatamente después del nombre entre comillas
   - Esto incluye: monumentos, museos, restaurantes, plazas, parques, iglesias, mercados, barrios, estaciones, aeropuertos
   - Formato OBLIGATORIO: "Nombre del Lugar" [PLACE]
   - Ejemplos CORRECTOS:
     * "Coliseo Romano" [PLACE]
     * "Restaurante La Pergola" [PLACE]

2. ESTRUCTURA DEL ITINERARIO:
   - Genera un itinerario detallado en formato HTML
   - Organiza por días con actividades para mañana, tarde y noche
   - Incluye horarios aproximados para cada actividad
   - Añade breves descripciones de cada lugar y actividad

3. INFORMACIÓN ADICIONAL:
   - Incluye recomendaciones de restaurantes para las comidas principales
   - Añade tiempos estimados de desplazamiento entre lugares

IMPORTANTE: Si no marcas TODOS los lugares con [PLACE], el sistema no podrá verificarlos ni añadir enlaces útiles. Esto es OBLIGATORIO.
`
  return `
Eres un experto en planificación de viajes. Crea un itinerario personalizado para un viaje con la siguiente información:
${tripInfo}
${params.weatherInfo || ""}
${params.hotelInfo || ""}
${params.budgetInfo || ""}
${params.transportInfo || ""}
${params.boardTypeInfo || ""}
${formatInstructions}
Genera un itinerario completo y detallado en HTML que sea práctico, realista y adaptado a las necesidades del viajero.
`
}

// Generar el prompt completo para el itinerario JSON
export function generateJsonItineraryPrompt(params: ItineraryPromptParams): string {
  // Información básica del viaje (similar a la anterior, pero para guiar el JSON)
  const tripContext = `
Contexto del Viaje para generar JSON:
- Destino Principal (nombre para \`JsonDestinationInfo.name\`): ${params.destination}
- Fechas: ${params.days} días, ${params.nights} noches. Fecha de inicio: ${params.startDate}. (Calcula \`endDate\` sumando ${Number(params.days) - 1} días a la fecha de inicio. Formato YYYY-MM-DD)
- Alojamiento Principal (nombre para \`JsonTravelPreferences.hotel.name\`): ${params.hotel}
  ${params.placeId ? `- Google Place ID del Hotel (para \`JsonTravelPreferences.hotel.googlePlaceId\`): ${params.placeId}` : ""}
- Viajeros (\`travelers\`): ${params.travelers}
- Rango de Edad (para guiar el tipo de actividades): ${params.age}
- Hora de Llegada al destino el primer día: ${params.arrivalTime}
- Hora de Salida del destino el último día: ${params.departureTime}
- Tipo de Viaje (para \`JsonTravelPreferences.activityTypes\` o notas generales): ${params.tripType || "General"}
- Preferencias Adicionales (para \`JsonTravelPreferences.activityTypes\` o notas): ${params.preferences || "Ninguna específica"}
- Tipo de Pensión en Hotel (para \`JsonTravelPreferences.boardType\`): ${params.boardType || "room_only"}
  Posibles valores para \`boardType\`: "room_only", "breakfast", "half_board", "full_board", "all_inclusive".
  ${params.boardTypeInfo || ""}
`

  // Instrucciones específicas para la IA sobre cómo generar el JSON
  const jsonFormatInstructions = `
INSTRUCCIONES ESTRICTAS PARA GENERAR EL JSON (Formato JsonItinerary):

1.  **Respuesta ÚNICA en JSON VÁLIDO**: Tu respuesta DEBE SER EXCLUSIVAMENTE un objeto JSON válido. No incluyas texto antes o después del JSON.

2.  **Estructura Principal \`JsonItinerary\`**:
    *   \`id\`: Deja este campo como una string vacía (""). Lo asignaremos nosotros.
    *   \`userId\`: Deja este campo como una string vacía (""). Lo asignaremos nosotros.
    *   \`title\`: Un título atractivo para el itinerario. Ej: "Aventura en ${params.destination}".
    *   \`destination\`: Objeto \`JsonDestinationInfo\`.
        *   \`name\`: "${params.destination}".
        *   (Opcional) \`googlePlaceId\`, \`coordinates\`, \`country\`, \`description\` si los conoces con certeza.
    *   \`startDate\`, \`endDate\`: Calcula estas fechas. \`startDate\` es mañana. Formato "YYYY-MM-DD".
    *   \`daysCount\`: Número total de días (ej: ${params.days}).
    *   \`travelers\`: ${params.travelers}.
    *   \`budget\`: Objeto \`JsonBudgetInfo\`.
        *   \`type\`: "${params.budget || "medium"}" (puede ser "low", "medium", "high", "custom").
        *   \`estimatedTotal\`: (Opcional) Si puedes estimar un total para el viaje.
        *   \`currency\`: "EUR" (o la moneda local del destino si la conoces).
    *   \`preferences\`: Objeto \`JsonTravelPreferences\`.
        *   \`hotel\`: Objeto \`JsonHotelPreference\` con \`name\`: "${params.hotel}" ${params.placeId ? `, \`googlePlaceId\`: "${params.placeId}"` : ""}.
        *   \`boardType\`: "${params.boardType || "room_only"}".
        *   \`activityTypes\`: Array de strings basado en \`tripType\` y \`preferences\`. Ej: ["culture", "food"].
        *   \`pace\`: "moderate" (o "relaxed", "packed" según el tipo de viaje).
        *   \`transportation\`: Array basado en \`transportModes\`. Ej: ["walk", "public"].
    *   \`dailyPlans\`: Array de objetos \`JsonDailyPlan\`, uno por cada día.
    *   \`createdAt\`, \`updatedAt\`: Deja estos campos como strings vacías (""). Los asignaremos nosotros.
    *   \`version\`: Pon el número 1.

3.  **Estructura \`JsonDailyPlan\` (para cada día)**:
    *   \`dayNumber\`: Número del día (1, 2, ...).
    *   \`date\`: Fecha del día "YYYY-MM-DD".
    *   \`title\`: Título para el día. Ej: "Explorando el Centro Histórico".
    *   \`activities\`: Array de objetos \`JsonActivity\`.

4.  **Estructura \`JsonActivity\` (para cada actividad)**:
    *   \`id\`: String temporal única para esta actividad. Ej: "day1_activity1", "day1_meal_lunch".
    *   \`title\`: Nombre descriptivo de la actividad. Ej: "Visita al Museo X", "Almuerzo en Restaurante Y".
    *   \`startTime\`: Hora de inicio "HH:mm".
    *   \`endTime\`: (Opcional) Hora de fin "HH:mm".
    *   \`durationMinutes\`: (Opcional) Duración estimada en minutos.
    *   \`description\`: Breve descripción de la actividad.
    *   \`type\`: Tipo de actividad. Valores: "sightseeing", "meal", "transport", "accommodation", "free_time", "event", "custom".
    *   \`location\`: (Opcional) Objeto \`JsonActivityLocation\` si aplica.
        *   \`name\`: Nombre del lugar. Ej: "Museo X", "Restaurante Y". ¡ESTE ES EL NOMBRE QUE USAREMOS PARA VERIFICAR!
        *   \`address\`: (Opcional) Dirección si la conoces.
        *   \`verified\`: \`false\` (lo verificaremos nosotros).
        *   \`verificationSource\`: \`"ai_suggestion"\`.
    *   \`priceEstimate\`: (Opcional) Objeto \`JsonPriceEstimate\` si tiene costo.
        *   \`amount\`: Número.
        *   \`currency\`: Ej: "EUR".
        *   \`perPerson\`: \`true\` o \`false\`.
    *   \`notes\`: (Opcional) Notas adicionales.
    *   \`transportToNext\`: (Opcional) Detalles del transporte a la siguiente actividad.
        *   \`mode\`: Ej: "walk", "metro".
        *   \`durationMinutes\`: Estimación.

5.  **LUGARES (\`JsonActivityLocation.name\`) - ¡MUY IMPORTANTE!**:
    *   Para CADA lugar (monumento, restaurante, museo, parque, etc.), proporciona el **nombre MÁS COMPLETO Y OFICIAL posible** en el campo \`location.name\`.
    *   Ejemplo: Si la actividad es visitar el Coliseo, en \`location\`, \`name\` debe ser "Coliseo Romano". Para un restaurante, "Restaurante El Celler de Can Roca" en lugar de solo "El Celler".
    *   **Si el nombre es común, intenta añadir un detalle distintivo si lo conoces (ej. "Café Central de la Plaza Mayor").**
    *   NO uses marcadores como [PLACE]. Simplemente pon el nombre en \`location.name\`.
    *   Si conoces información contextual útil para la verificación (ej. "cerca del ayuntamiento", "en la calle principal"), inclúyela en el campo \`description\` o \`notes\` de la actividad.

6.  **Consideraciones Adicionales**:
    *   Adapta las actividades al clima (sección \`INFORMACIÓN DEL CLIMA\`).
    *   Respeta las restricciones de transporte y distancia (sección \`RESTRICCIONES DE DISTANCIA Y TRANSPORTE\`).
    *   Ajusta las recomendaciones al presupuesto (sección \`INFORMACIÓN DE PRESUPUESTO\`).
    *   Considera el tipo de pensión del hotel para las recomendaciones de comidas.
    *   Sé creativo y realista. El itinerario debe ser útil.
    *   Si un campo es opcional y no tienes información, omítelo del JSON o pon \`null\` si el tipo lo permite (pero es mejor omitir).

Ejemplo MUY SIMPLIFICADO de la estructura de una actividad con ubicación:
\`\`\`json
{
  // ... otros campos de JsonActivity ...
  "location": {
    "name": "Nombre del Lugar Sugerido por IA (lo más específico posible)",
    "verified": false,
    "verificationSource": "ai_suggestion"
    // ... otros campos opcionales de JsonActivityLocation si los conoces ...
  }
  // ...
}
\`\`\`
`

  // Combinar todas las secciones del prompt
  return `
Eres un experto planificador de viajes encargado de generar un itinerario detallado en formato JSON.
Utiliza la siguiente información y directrices para construir tu respuesta.

${tripContext}

${params.weatherInfo || ""}

${params.hotelInfo || ""}

${params.budgetInfo || ""}

${params.transportInfo || ""}

${jsonFormatInstructions}

HORARIOS DE COMIDAS ESPAÑOLES (OBLIGATORIO RESPETAR):
- Comida (mediodía): Entre 13:30 y 15:00. Usa "Comida" en lugar de "Almuerzo".
- Cena: Entre 21:00 y 22:00
- Desayuno: Entre 8:00 y 10:00 (si aplica)
- Respeta estos horarios culturales españoles para las actividades de tipo "meal".

Por favor, genera el objeto JSON completo y válido.
`
}
