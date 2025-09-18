"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function verifyDestination(destination: string): Promise<{
  isValid: boolean
  message: string
  suggestions?: { name: string; description: string }[]
  normalizedName?: string
  coordinates?: { lat: number; lon: number }
  country?: string
  region?: string
}> {
  try {
    const prompt = `
      Actúa como un experto en geografía y turismo. Necesito verificar si el siguiente destino es un lugar turístico válido:
      
      "${destination}"
      
      Por favor, analiza y responde con la siguiente información:
      
      1. ¿Es un destino turístico válido? (Sí/No)
      2. Si es válido, proporciona el nombre normalizado en formato "Ciudad, País" o "Región, País"
      3. Si es válido, proporciona las coordenadas aproximadas (latitud y longitud)
      4. Si es válido, proporciona el país y la región/provincia/estado
      5. Si no es válido o es ambiguo, proporciona hasta 3 sugerencias de destinos que podrían coincidir
      6. Para cada sugerencia, incluye una breve descripción (máximo 1 frase)
      7. Proporciona un mensaje explicativo sobre el resultado
      
      Responde SOLO en formato JSON con esta estructura exacta:
      {
        "isValid": true o false,
        "message": "Mensaje explicativo",
        "normalizedName": "Nombre normalizado (solo si isValid es true)",
        "coordinates": {
          "lat": latitud (número),
          "lon": longitud (número)
        },
        "country": "Nombre del país",
        "region": "Nombre de la región/provincia/estado",
        "suggestions": [
          {
            "name": "Nombre de la sugerencia 1",
            "description": "Breve descripción 1"
          },
          {
            "name": "Nombre de la sugerencia 2",
            "description": "Breve descripción 2"
          }
        ]
      }
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
      maxTokens: 800,
    })

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta")
    }

    const result = JSON.parse(jsonMatch[0])
    return result
  } catch (error) {
    console.error("Error verificando destino:", error)
    return {
      isValid: false,
      message: "Error al verificar el destino. Por favor, intenta con un destino más específico.",
    }
  }
}
