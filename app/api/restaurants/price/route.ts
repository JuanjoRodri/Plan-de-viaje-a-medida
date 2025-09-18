import { type NextRequest, NextResponse } from "next/server"
import { getRestaurantPriceDetails } from "@/app/services/restaurant-price-service"

export async function GET(request: NextRequest) {
  // Obtener parámetros de la consulta
  const searchParams = request.nextUrl.searchParams
  const name = searchParams.get("name")
  const placeId = searchParams.get("placeId")
  const destination = searchParams.get("destination")
  const numPeople = searchParams.get("numPeople")

  // Validar parámetros
  if (!name || !destination) {
    return NextResponse.json({ error: "Se requieren los parámetros name y destination" }, { status: 400 })
  }

  try {
    // Obtener detalles de precios
    const priceDetails = await getRestaurantPriceDetails(
      placeId || undefined,
      name,
      destination,
      numPeople ? Number.parseInt(numPeople, 10) : 1,
    )

    // Devolver los detalles
    return NextResponse.json(priceDetails)
  } catch (error) {
    console.error("Error obteniendo precios del restaurante:", error)
    return NextResponse.json({ error: "Error al obtener información de precios" }, { status: 500 })
  }
}
