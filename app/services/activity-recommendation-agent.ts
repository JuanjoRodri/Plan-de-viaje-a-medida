"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface RecommendationRequest {
  query: string
  destination: string
  timeOfDay: string
  activityType: string
  context?: {
    totalDays?: number
    preferences?: string[]
    budget?: string
  }
}

interface ActivityRecommendation {
  id: string
  title: string
  type: "sightseeing" | "meal" | "transport" | "accommodation" | "event" | "free_time" | "custom"
  locationName: string
  description: string
  suggestedStartTime: string
  suggestedEndTime?: string
  estimatedPrice?: string
  notes?: string
  reasoning: string
}

interface RecommendationResponse {
  success: boolean
  recommendations?: ActivityRecommendation[]
  error?: string
}

export async function getActivityRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
  try {
    console.log(`🤖 Generando recomendaciones para: "${request.query}" en ${request.destination}`)

    const prompt = `
Eres un experto agente de viajes especializado en ${request.destination}. 

El usuario pregunta: "${request.query}"

Contexto del viaje:
- Destino: ${request.destination}
- Hora del día: ${request.timeOfDay}
- Tipo de actividad preferida: ${request.activityType}
${request.context?.totalDays ? `- Duración del viaje: ${request.context.totalDays} días` : ""}
${request.context?.preferences ? `- Preferencias: ${request.context.preferences.join(", ")}` : ""}
${request.context?.budget ? `- Presupuesto: ${request.context.budget}` : ""}

Proporciona EXACTAMENTE 8 recomendaciones específicas y reales para ${request.destination}. 

IMPORTANTE: Solo recomienda lugares que REALMENTE EXISTEN y están ABIERTOS en ${request.destination}.

Para cada recomendación, devuelve un JSON con esta estructura:
{
  "id": "unique_id",
  "title": "Nombre específico del lugar/actividad",
  "type": "sightseeing|meal|transport|accommodation|event|free_time|custom",
  "locationName": "Nombre exacto del lugar en ${request.destination}",
  "description": "Descripción breve y atractiva (máximo 100 caracteres)",
  "suggestedStartTime": "HH:MM",
  "suggestedEndTime": "HH:MM",
  "estimatedPrice": "XX€",
  "notes": "Consejos útiles o información adicional",
  "reasoning": "Por qué recomiendas este lugar"
}

Responde SOLO con un array JSON válido de 8 recomendaciones, sin texto adicional.
`

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.7,
    })

    // Parsear la respuesta JSON
    let raw = result.text.trim()

    // Eliminar \`\`\`json / \`\`\` fences
    raw = raw
      .replace(/^```(?:json)?\s*/i, "") // abre fence
      .replace(/\s*```$/i, "") // cierra fence

    // En caso de que venga texto extra, aislar el 1er '[' y el último ']'
    const firstBracket = raw.indexOf("[")
    const lastBracket = raw.lastIndexOf("]")
    if (firstBracket !== -1 && lastBracket !== -1) {
      raw = raw.slice(firstBracket, lastBracket + 1)
    }

    let aiRecommendations: ActivityRecommendation[]
    try {
      aiRecommendations = JSON.parse(raw)
    } catch (parseError) {
      console.error("❌ Error parseando respuesta del agente:", parseError, "\nTexto recibido:\n", raw)
      return {
        success: false,
        error: "Error procesando las recomendaciones del agente",
      }
    }

    // Validar que tenemos recomendaciones
    if (!Array.isArray(aiRecommendations) || aiRecommendations.length === 0) {
      console.error("❌ El agente no devolvió recomendaciones válidas")
      return {
        success: false,
        error: "El agente no pudo generar recomendaciones válidas",
      }
    }

    console.log(`🔍 Validando ${aiRecommendations.length} recomendaciones con Google Places...`)

    // 🆕 VALIDACIÓN CON GOOGLE PLACES
    const validatedRecommendations: ActivityRecommendation[] = []

    // Importar el servicio de Google Places
    const { verifyPlace } = await import("@/app/services/google-places-service")

    for (const recommendation of aiRecommendations) {
      try {
        console.log(`  🔍 Verificando: "${recommendation.title}" en ${request.destination}`)

        // Verificar si el lugar existe en Google Places
        const verification = await verifyPlace(recommendation.title, request.destination)

        if (verification.exists && verification.placeId) {
          // El lugar existe y está verificado
          const validatedRecommendation: ActivityRecommendation = {
            ...recommendation,
            // Usar el nombre corregido de Google Places si está disponible
            title: verification.correctedName || recommendation.title,
            locationName: verification.correctedName || recommendation.locationName,
            // Añadir información adicional en las notas si está disponible
            notes: verification.address
              ? `${recommendation.notes || ""}\n📍 ${verification.address}`.trim()
              : recommendation.notes,
          }

          validatedRecommendations.push(validatedRecommendation)
          console.log(`    ✅ Verificado: "${validatedRecommendation.title}"`)

          // Parar cuando tengamos 5 recomendaciones válidas
          if (validatedRecommendations.length >= 5) {
            break
          }
        } else {
          console.log(`    ❌ No verificado: "${recommendation.title}" (no existe o está cerrado)`)
        }
      } catch (verificationError) {
        console.error(`    ⚠️ Error verificando "${recommendation.title}":`, verificationError)
        // En caso de error de verificación, continuar con la siguiente recomendación
        continue
      }
    }

    console.log(`✅ Validación completada: ${validatedRecommendations.length} recomendaciones verificadas`)

    // Verificar que tenemos al menos algunas recomendaciones válidas
    if (validatedRecommendations.length === 0) {
      console.error("❌ No se pudieron verificar recomendaciones")
      return {
        success: false,
        error: "No se encontraron lugares válidos para las recomendaciones",
      }
    }

    return {
      success: true,
      recommendations: validatedRecommendations,
    }
  } catch (error) {
    console.error("❌ Error en getActivityRecommendations:", error)
    return {
      success: false,
      error: "Error interno del agente de recomendaciones",
    }
  }
}
