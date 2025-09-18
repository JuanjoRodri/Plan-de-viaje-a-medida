import { type NextRequest, NextResponse } from "next/server"
import { getWeatherForecast, verifyLocation } from "@/app/services/weather-service"

export async function GET(request: NextRequest) {
  try {
    // Get the location from the query parameters
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location")

    if (!location) {
      return NextResponse.json({ success: false, error: "Se requiere un parámetro de ubicación" }, { status: 400 })
    }

    // Verify the location first
    const verificationResult = await verifyLocation(location)

    if (!verificationResult.verified) {
      return NextResponse.json(
        {
          success: false,
          error: `Ubicación no verificada: ${verificationResult.message}`,
        },
        { status: 400 },
      )
    }

    // Get weather forecast for the verified location
    const weatherData = await getWeatherForecast(verificationResult.normalizedLocation)

    if (!weatherData) {
      return NextResponse.json({ success: false, error: "No se pudieron obtener datos del clima" }, { status: 500 })
    }

    if (weatherData) {
      // Ensure location is properly formatted for display
      if (typeof weatherData.location === "object" && weatherData.location !== null) {
        // Make sure name and country are strings
        weatherData.location.name = weatherData.location.name || "Ubicación desconocida"
        weatherData.location.country = weatherData.location.country || ""
      }
    }

    return NextResponse.json({ success: true, data: weatherData })
  } catch (error) {
    console.error("Error en API de clima:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido al obtener datos del clima",
      },
      { status: 500 },
    )
  }
}
