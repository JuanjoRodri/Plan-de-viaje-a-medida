import { type NextRequest, NextResponse } from "next/server"

// Datos de ejemplo para detalles de hoteles
const mockHotelDetails = {
  "mock-barcelona-1": {
    place_id: "mock-barcelona-1",
    name: "Hotel Arts Barcelona",
    formatted_address: "Carrer de la Marina, 19-21, 08005 Barcelona, España",
    formatted_phone_number: "+34 932 21 10 00",
    international_phone_number: "+34 932 21 10 00",
    website: "https://www.hotelartsbarcelona.com/",
    rating: 4.6,
    user_ratings_total: 4521,
    price_level: 4,
    url: "https://maps.google.com/?cid=12345678901234567890",
    opening_hours: {
      weekday_text: [
        "Lunes: Abierto 24 horas",
        "Martes: Abierto 24 horas",
        "Miércoles: Abierto 24 horas",
        "Jueves: Abierto 24 horas",
        "Viernes: Abierto 24 horas",
        "Sábado: Abierto 24 horas",
        "Domingo: Abierto 24 horas",
      ],
      open_now: true,
    },
    reviews: [
      {
        author_name: "Juan Pérez",
        rating: 5,
        text: "Excelente hotel con vistas impresionantes al mar. El servicio es de primera clase.",
        time: 1620000000,
      },
      {
        author_name: "María García",
        rating: 4,
        text: "Muy buena ubicación y habitaciones cómodas. El desayuno es espectacular.",
        time: 1625000000,
      },
    ],
    types: ["lodging", "point_of_interest", "establishment"],
  },
  // Añadir más detalles para otros hoteles según sea necesario
}

// Función para generar detalles de hotel si no existen
function generateHotelDetails(placeId: string, hotelName: string) {
  return {
    place_id: placeId,
    name: hotelName || "Hotel Desconocido",
    formatted_address: "Dirección no disponible",
    formatted_phone_number: "+34 900 00 00 00",
    website: "https://www.ejemplo.com/",
    rating: 4.0,
    user_ratings_total: 1000,
    price_level: 3,
    url: "https://maps.google.com/?cid=00000000000000000000",
    opening_hours: {
      weekday_text: [
        "Lunes: Abierto 24 horas",
        "Martes: Abierto 24 horas",
        "Miércoles: Abierto 24 horas",
        "Jueves: Abierto 24 horas",
        "Viernes: Abierto 24 horas",
        "Sábado: Abierto 24 horas",
        "Domingo: Abierto 24 horas",
      ],
      open_now: true,
    },
    reviews: [
      {
        author_name: "Usuario Anónimo",
        rating: 4,
        text: "Buena experiencia en general.",
        time: 1620000000,
      },
    ],
    types: ["lodging", "point_of_interest", "establishment"],
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obtener el ID del lugar de los parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get("placeId")
    const hotelName = searchParams.get("name") || ""

    // Validar que se proporcionó un ID de lugar
    if (!placeId) {
      return NextResponse.json({ error: "Se requiere un ID de lugar (placeId)" }, { status: 400 })
    }

    // Simular un pequeño retraso para que parezca una API real
    await new Promise((resolve) => setTimeout(resolve, 700))

    // Obtener los detalles del hotel o generar detalles ficticios si no existen
    const details = mockHotelDetails[placeId] || generateHotelDetails(placeId, hotelName)

    // Devolver los detalles
    return NextResponse.json({ result: details })
  } catch (error) {
    console.error("Error en la API mock de detalles de lugares:", error)
    return NextResponse.json({ error: "Error al obtener detalles del lugar", details: error.message }, { status: 500 })
  }
}
