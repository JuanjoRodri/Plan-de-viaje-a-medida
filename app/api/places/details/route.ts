import { type NextRequest, NextResponse } from "next/server"

// API Key de Google Places para el servidor
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_MAPS_SERVER_API_KEY

export async function GET(request: NextRequest) {
  try {
    // Obtener el ID del lugar de los parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get("placeId")

    // Validar que se proporcionó un ID de lugar
    if (!placeId) {
      return NextResponse.json({ error: "Se requiere un ID de lugar (placeId)" }, { status: 400 })
    }

    // Validar que la API key esté configurada
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json({ error: "API key de Google Places no configurada en el servidor" }, { status: 500 })
    }

    console.log(`API Places Details: Obteniendo detalles para place_id "${placeId}"`)

    // Construir la URL de la API
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,international_phone_number,website,rating,user_ratings_total,price_level,url,photos,opening_hours,reviews,types,geometry&key=${GOOGLE_PLACES_API_KEY}`

    // Realizar la solicitud a la API con un timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })

      clearTimeout(timeoutId)

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error HTTP en Google Places API: ${response.status} ${response.statusText}`, errorText)
        return NextResponse.json(
          { error: `Error en la API de Google Places: ${response.status} ${response.statusText}` },
          { status: response.status },
        )
      }

      // Intentar parsear la respuesta como JSON
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error al parsear respuesta JSON de Google Places API:", jsonError)
        const responseText = await response.text()
        return NextResponse.json(
          { error: `Respuesta no válida de Google Places API: ${responseText.substring(0, 100)}...` },
          { status: 500 },
        )
      }

      // Verificar el estado de la respuesta de la API
      if (data.status !== "OK") {
        console.error("Error en la API de Google Places:", data.status, data.error_message)

        // Si la API key es inválida, proporcionar un mensaje más claro
        if (data.status === "REQUEST_DENIED" && data.error_message?.includes("API key")) {
          return NextResponse.json(
            {
              error:
                "La API key de Google Places es inválida o tiene restricciones. Por favor, verifica la configuración.",
              details: data.error_message,
              status: data.status,
            },
            { status: 403 },
          )
        }

        return NextResponse.json(
          {
            error: `Error en la API de Google Places: ${data.status}`,
            details: data.error_message,
            status: data.status,
          },
          { status: 500 },
        )
      }

      // Devolver los resultados
      return NextResponse.json({ result: data.result })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        return NextResponse.json(
          { error: "La solicitud a la API de Google Places ha excedido el tiempo de espera" },
          { status: 504 },
        )
      }

      console.error("Error al realizar la solicitud a Google Places API:", error)
      return NextResponse.json(
        {
          error: `Error al obtener detalles del lugar: ${error instanceof Error ? error.message : "Error desconocido"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error general en la ruta de detalles de lugares:", error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
