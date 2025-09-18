import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { hotelName, destination } = await request.json()

    if (!hotelName || !destination) {
      return NextResponse.json({ error: "Se requieren el nombre del hotel y el destino" }, { status: 400 })
    }

    console.log(`AI Verify Hotel: Verificando "${hotelName}" en "${destination}"`)

    // Usar IA para verificar si el hotel existe y es real
    const prompt = `
      Actúa como un experto en verificación de hoteles. Analiza si el hotel "${hotelName}" existe realmente en "${destination}".

      Considera:
      1. ¿Es un nombre de hotel real y conocido?
      2. ¿Existe en la ubicación especificada?
      3. ¿Es una cadena hotelera reconocida o un hotel independiente legítimo?
      4. ¿El nombre parece inventado o poco realista?

      Responde SOLO en formato JSON con esta estructura:
      {
        "exists": true/false,
        "confidence": número entre 0 y 1,
        "reason": "explicación breve en español",
        "suggestions": ["hotel alternativo 1", "hotel alternativo 2"] (solo si exists es false)
      }
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt,
      temperature: 0.3,
      maxTokens: 300,
    })

    // Extraer el JSON de la respuesta
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No se pudo extraer JSON de la respuesta de IA")
    }

    const result = JSON.parse(jsonMatch[0])

    // Validar la estructura de la respuesta
    if (typeof result.exists !== "boolean" || typeof result.confidence !== "number") {
      throw new Error("Respuesta de IA con formato inválido")
    }

    return NextResponse.json({
      verified: result.exists,
      confidence: result.confidence,
      reason: result.reason,
      suggestions: result.suggestions || [],
      hotelName,
      destination,
    })
  } catch (error) {
    console.error("Error en verificación de hotel con IA:", error)
    return NextResponse.json(
      {
        error: `Error al verificar el hotel: ${error instanceof Error ? error.message : "Error desconocido"}`,
        verified: false,
        confidence: 0,
      },
      { status: 500 },
    )
  }
}
