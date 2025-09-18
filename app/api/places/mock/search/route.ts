import { type NextRequest, NextResponse } from "next/server"

// Datos de ejemplo para hoteles en diferentes ciudades
const mockHotels = {
  barcelona: [
    {
      place_id: "mock-barcelona-1",
      name: "Hotel Arts Barcelona",
      formatted_address: "Carrer de la Marina, 19-21, 08005 Barcelona, España",
      vicinity: "Carrer de la Marina, 19-21",
      rating: 4.6,
      user_ratings_total: 4521,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-barcelona-2",
      name: "W Barcelona",
      formatted_address: "Plaça Rosa dels Vents, 1, 08039 Barcelona, España",
      vicinity: "Plaça Rosa dels Vents, 1",
      rating: 4.5,
      user_ratings_total: 8765,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-barcelona-3",
      name: "Hotel El Palace Barcelona",
      formatted_address: "Gran Via de les Corts Catalanes, 668, 08010 Barcelona, España",
      vicinity: "Gran Via de les Corts Catalanes, 668",
      rating: 4.7,
      user_ratings_total: 2345,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-barcelona-4",
      name: "Mandarin Oriental Barcelona",
      formatted_address: "Passeig de Gràcia, 38-40, 08007 Barcelona, España",
      vicinity: "Passeig de Gràcia, 38-40",
      rating: 4.8,
      user_ratings_total: 1876,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-barcelona-5",
      name: "Hotel 1898",
      formatted_address: "La Rambla, 109, 08002 Barcelona, España",
      vicinity: "La Rambla, 109",
      rating: 4.6,
      user_ratings_total: 3210,
      types: ["lodging", "point_of_interest", "establishment"],
    },
  ],
  madrid: [
    {
      place_id: "mock-madrid-1",
      name: "The Westin Palace Madrid",
      formatted_address: "Plaza de las Cortes, 7, 28014 Madrid, España",
      vicinity: "Plaza de las Cortes, 7",
      rating: 4.6,
      user_ratings_total: 5432,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-madrid-2",
      name: "Hotel Ritz Madrid",
      formatted_address: "Plaza de la Lealtad, 5, 28014 Madrid, España",
      vicinity: "Plaza de la Lealtad, 5",
      rating: 4.7,
      user_ratings_total: 3456,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-madrid-3",
      name: "NH Collection Madrid Suecia",
      formatted_address: "Calle del Marqués de Casa Riera, 4, 28014 Madrid, España",
      vicinity: "Calle del Marqués de Casa Riera, 4",
      rating: 4.5,
      user_ratings_total: 2345,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-madrid-4",
      name: "Hotel Urban",
      formatted_address: "Carrera de S. Jerónimo, 34, 28014 Madrid, España",
      vicinity: "Carrera de S. Jerónimo, 34",
      rating: 4.4,
      user_ratings_total: 1987,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-madrid-5",
      name: "Only YOU Boutique Hotel Madrid",
      formatted_address: "Calle del Barquillo, 21, 28004 Madrid, España",
      vicinity: "Calle del Barquillo, 21",
      rating: 4.6,
      user_ratings_total: 2876,
      types: ["lodging", "point_of_interest", "establishment"],
    },
  ],
  paris: [
    {
      place_id: "mock-paris-1",
      name: "Hôtel Plaza Athénée",
      formatted_address: "25 Avenue Montaigne, 75008 Paris, Francia",
      vicinity: "25 Avenue Montaigne",
      rating: 4.7,
      user_ratings_total: 4321,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-paris-2",
      name: "Le Meurice",
      formatted_address: "228 Rue de Rivoli, 75001 Paris, Francia",
      vicinity: "228 Rue de Rivoli",
      rating: 4.6,
      user_ratings_total: 3456,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-paris-3",
      name: "Four Seasons Hotel George V",
      formatted_address: "31 Avenue George V, 75008 Paris, Francia",
      vicinity: "31 Avenue George V",
      rating: 4.8,
      user_ratings_total: 5432,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-paris-4",
      name: "Hôtel de Crillon",
      formatted_address: "10 Place de la Concorde, 75008 Paris, Francia",
      vicinity: "10 Place de la Concorde",
      rating: 4.7,
      user_ratings_total: 2345,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-paris-5",
      name: "Le Bristol Paris",
      formatted_address: "112 Rue du Faubourg Saint-Honoré, 75008 Paris, Francia",
      vicinity: "112 Rue du Faubourg Saint-Honoré",
      rating: 4.8,
      user_ratings_total: 3210,
      types: ["lodging", "point_of_interest", "establishment"],
    },
  ],
  london: [
    {
      place_id: "mock-london-1",
      name: "The Savoy",
      formatted_address: "Strand, London WC2R 0EZ, Reino Unido",
      vicinity: "Strand",
      rating: 4.7,
      user_ratings_total: 5432,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-london-2",
      name: "The Ritz London",
      formatted_address: "150 Piccadilly, St. James's, London W1J 9BR, Reino Unido",
      vicinity: "150 Piccadilly, St. James's",
      rating: 4.6,
      user_ratings_total: 4321,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-london-3",
      name: "Claridge's",
      formatted_address: "Brook Street, Mayfair, London W1K 4HR, Reino Unido",
      vicinity: "Brook Street, Mayfair",
      rating: 4.7,
      user_ratings_total: 3456,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-london-4",
      name: "The Dorchester",
      formatted_address: "53 Park Ln, Mayfair, London W1K 1QA, Reino Unido",
      vicinity: "53 Park Ln, Mayfair",
      rating: 4.6,
      user_ratings_total: 2345,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-london-5",
      name: "The Connaught",
      formatted_address: "Carlos Pl, Mayfair, London W1K 2AL, Reino Unido",
      vicinity: "Carlos Pl, Mayfair",
      rating: 4.7,
      user_ratings_total: 1987,
      types: ["lodging", "point_of_interest", "establishment"],
    },
  ],
  // Hoteles genéricos para cualquier otra ciudad
  default: [
    {
      place_id: "mock-default-1",
      name: "Grand Hotel Central",
      formatted_address: "Calle Principal 123",
      vicinity: "Calle Principal 123",
      rating: 4.5,
      user_ratings_total: 2345,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-default-2",
      name: "Hotel Plaza",
      formatted_address: "Avenida Central 456",
      vicinity: "Avenida Central 456",
      rating: 4.3,
      user_ratings_total: 1876,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-default-3",
      name: "Boutique Hotel Elegance",
      formatted_address: "Calle del Parque 789",
      vicinity: "Calle del Parque 789",
      rating: 4.6,
      user_ratings_total: 1234,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-default-4",
      name: "City View Hotel",
      formatted_address: "Avenida del Mar 321",
      vicinity: "Avenida del Mar 321",
      rating: 4.2,
      user_ratings_total: 987,
      types: ["lodging", "point_of_interest", "establishment"],
    },
    {
      place_id: "mock-default-5",
      name: "Comfort Inn & Suites",
      formatted_address: "Calle Comercial 654",
      vicinity: "Calle Comercial 654",
      rating: 4.0,
      user_ratings_total: 876,
      types: ["lodging", "point_of_interest", "establishment"],
    },
  ],
}

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de la URL
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || ""

    // Simular un pequeño retraso para que parezca una API real
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Determinar qué conjunto de hoteles usar basado en la consulta
    let cityHotels = mockHotels.default

    // Buscar menciones de ciudades en la consulta
    const lowerQuery = query.toLowerCase()
    if (lowerQuery.includes("barcelona")) {
      cityHotels = mockHotels.barcelona
    } else if (lowerQuery.includes("madrid")) {
      cityHotels = mockHotels.madrid
    } else if (lowerQuery.includes("paris")) {
      cityHotels = mockHotels.paris
    } else if (lowerQuery.includes("london") || lowerQuery.includes("londres")) {
      cityHotels = mockHotels.london
    }

    // Filtrar los hoteles según la consulta (si no es una de las ciudades principales)
    let results = cityHotels

    if (query && !["barcelona", "madrid", "paris", "london", "londres"].some((city) => lowerQuery.includes(city))) {
      const searchTerms = query.toLowerCase().split(" ")
      results = cityHotels.filter((hotel) => {
        const hotelName = hotel.name.toLowerCase()
        return searchTerms.some((term) => hotelName.includes(term))
      })

      // Si no hay resultados, devolver algunos hoteles genéricos
      if (results.length === 0) {
        results = mockHotels.default.slice(0, 3)
      }
    }

    // Devolver los resultados
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error en la API mock de búsqueda de lugares:", error)
    return NextResponse.json({ error: "Error al buscar lugares", details: error.message }, { status: 500 })
  }
}
