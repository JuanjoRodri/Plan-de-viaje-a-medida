"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getPlaceDetails } from "./google-places-service"

export type SentimentResult = {
  score: number // -1 (muy negativo) a 1 (muy positivo)
  summary: string
  keywords: string[]
  recommendation: boolean // true si se recomienda, false si no
}

export type PlaceReview = {
  name: string
  location: string
  reviews: string[]
}

export async function analyzeSentiment(place: PlaceReview): Promise<SentimentResult> {
  try {
    // Limitamos el número de reseñas para no exceder tokens
    const limitedReviews = place.reviews.slice(0, 5).join("\n\n")

    const prompt = `
      Actúa como un experto analista de sentimiento para reseñas de viajes. Analiza las siguientes reseñas para "${place.name}" en ${place.location} y proporciona:
      
      1. Una puntuación de sentimiento de -1 (muy negativo) a 1 (muy positivo)
      2. Un breve resumen del sentimiento general (máximo 2 frases)
      3. Palabras clave principales mencionadas en las reseñas (máximo 5)
      4. Una recomendación clara: ¿Se debería incluir este lugar en un itinerario de viaje? (sí/no)
      
      Reseñas a analizar:
      ${limitedReviews}
      
      Responde SOLO en formato JSON con esta estructura exacta:
      {
        "score": número entre -1 y 1,
        "summary": "resumen breve",
        "keywords": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
        "recommendation": true o false
      }
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta")
    }

    const result = JSON.parse(jsonMatch[0]) as SentimentResult
    return result
  } catch (error) {
    console.error("Error en análisis de sentimiento:", error)
    // Devolver un resultado neutral en caso de error
    return {
      score: 0,
      summary: "No se pudo analizar el sentimiento debido a un error.",
      keywords: [],
      recommendation: true, // Por defecto recomendamos incluirlo
    }
  }
}

// NUEVA FUNCIÓN: Obtiene reseñas reales de Google Places
export async function getPlaceReviewsFromGoogle(placeId: string): Promise<PlaceReview | null> {
  console.log(`🔍 [Sentiment] Obteniendo reseñas de Google Places para place_id: ${placeId}`)

  try {
    const placeDetails = await getPlaceDetails(placeId)

    if (!placeDetails) {
      console.log(`❌ [Sentiment] No se pudieron obtener detalles para place_id: ${placeId}`)
      return null
    }

    if (!placeDetails.reviews || placeDetails.reviews.length === 0) {
      console.log(`⚠️ [Sentiment] No hay reseñas disponibles para: ${placeDetails.name}`)
      return {
        name: placeDetails.name,
        location: placeDetails.formatted_address,
        reviews: ["No hay reseñas disponibles para este lugar."],
      }
    }

    const reviewTexts = placeDetails.reviews
      .filter((review) => review.text && review.text.trim().length > 10) // Filtrar reseñas muy cortas
      .map((review) => review.text)
      .slice(0, 5) // Máximo 5 reseñas

    console.log(`✅ [Sentiment] Obtenidas ${reviewTexts.length} reseñas para: ${placeDetails.name}`)

    return {
      name: placeDetails.name,
      location: placeDetails.formatted_address,
      reviews: reviewTexts.length > 0 ? reviewTexts : ["No hay reseñas de texto disponibles para este lugar."],
    }
  } catch (error) {
    console.error(`❌ [Sentiment] Error obteniendo reseñas para place_id ${placeId}:`, error)
    return null
  }
}

// Función para obtener reseñas simuladas (MANTENER para compatibilidad hacia atrás)
export async function getPlaceReviews(placeName: string, location: string): Promise<PlaceReview> {
  try {
    // En un caso real, aquí llamaríamos a una API externa
    // Como no tenemos acceso a reseñas reales, devolvemos un mensaje de error
    throw new Error("Datos no disponibles, consultar con un administrador")
  } catch (error) {
    console.error("Error obteniendo reseñas:", error)
    return {
      name: placeName,
      location,
      reviews: ["Datos no disponibles, consultar con un administrador"],
    }
  }
}
