"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getPlaceDetails } from "./google-places-service"

export type PlaceSentimentResult = {
  score: number // 0 a 5, siendo 5 la mejor puntuación
  summary: string
  keywords: string[]
  recommendation: boolean // true si se recomienda, false si no
  confidence: number // 0 a 1, confianza en el análisis
}

export async function analyzePlaceSentiment(placeId: string): Promise<PlaceSentimentResult> {
  try {
    // Obtener detalles del lugar, incluyendo reseñas
    const placeDetails = await getPlaceDetails(placeId, true) // El segundo parámetro indica que queremos incluir reseñas

    if (!placeDetails || !placeDetails.reviews || placeDetails.reviews.length === 0) {
      console.log("No se encontraron reseñas para el lugar:", placeId)
      return {
        score: 2.5, // Puntuación neutral
        summary: "No hay suficientes reseñas para analizar este lugar.",
        keywords: [],
        recommendation: true, // Por defecto recomendamos
        confidence: 0.3,
      }
    }

    // Limitar el número de reseñas para no exceder tokens
    const limitedReviews = placeDetails.reviews.slice(0, 10)

    // Extraer el texto de las reseñas
    const reviewTexts = limitedReviews
      .map((review) => `[${review.rating}/5 estrellas] ${review.text || "Sin texto"}`)
      .join("\n\n")

    const prompt = `
      Actúa como un experto analista de sentimiento para reseñas de lugares turísticos. Analiza las siguientes reseñas para "${placeDetails.name}" y proporciona:
      
      1. Una puntuación de recomendación de 0 a 5 (siendo 5 la mejor puntuación)
      2. Un breve resumen del sentimiento general (máximo 2 frases)
      3. Palabras clave principales mencionadas en las reseñas (máximo 5)
      4. Una recomendación clara: ¿Se debería incluir este lugar en un itinerario de viaje? (sí/no)
      5. Un nivel de confianza en tu análisis (de 0 a 1)
      
      IMPORTANTE: Responde COMPLETAMENTE EN ESPAÑOL. Incluso si las reseñas están en otro idioma, tu análisis debe estar en español.
      
      Reseñas a analizar:
      ${reviewTexts}
      
      Responde SOLO en formato JSON con esta estructura exacta:
      {
        "score": número entre 0 y 5,
        "summary": "resumen breve en español",
        "keywords": ["palabra1", "palabra2", "palabra3", "palabra4", "palabra5"],
        "recommendation": true o false,
        "confidence": número entre 0 y 1
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

    const result = JSON.parse(jsonMatch[0]) as PlaceSentimentResult
    return result
  } catch (error) {
    console.error("Error en análisis de sentimiento del lugar:", error)
    // Devolver un resultado neutral en caso de error
    return {
      score: 2.5,
      summary: "No se pudo analizar el sentimiento debido a un error.",
      keywords: [],
      recommendation: true, // Por defecto recomendamos incluirlo
      confidence: 0.3,
    }
  }
}

// Función para obtener una versión en caché o nueva del análisis
export async function getCachedPlaceSentiment(placeId: string): Promise<PlaceSentimentResult> {
  // Temporalmente sin caché - llamar directamente al análisis
  return analyzePlaceSentiment(placeId)
}
