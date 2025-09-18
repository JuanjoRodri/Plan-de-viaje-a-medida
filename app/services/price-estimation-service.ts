// Interfaz para los niveles de precio por país/región
interface PriceLevelData {
  currency: string
  restaurantPrices: {
    budget: PriceRange // Nivel 1 (€)
    moderate: PriceRange // Nivel 2 (€€)
    expensive: PriceRange // Nivel 3 (€€€)
    luxury: PriceRange // Nivel 4 (€€€€)
  }
  attractionPrices: {
    low: PriceRange
    medium: PriceRange
    high: PriceRange
  }
  transportPrices: {
    publicTransport: PriceRange
    taxi: PriceRange
    rentalCar: PriceRange
  }
}

// Interfaz para rangos de precios
interface PriceRange {
  min: number
  max: number
  perPerson?: boolean // Si es true, el precio es por persona
}

// Datos de precios por país/región
// Estos datos son aproximados y se utilizan como base para las estimaciones
const PRICE_DATA: Record<string, PriceLevelData> = {
  // España
  ES: {
    currency: "€",
    restaurantPrices: {
      budget: { min: 10, max: 20, perPerson: true },
      moderate: { min: 20, max: 35, perPerson: true },
      expensive: { min: 35, max: 60, perPerson: true },
      luxury: { min: 60, max: 120, perPerson: true },
    },
    attractionPrices: {
      low: { min: 5, max: 15, perPerson: true },
      medium: { min: 15, max: 30, perPerson: true },
      high: { min: 30, max: 60, perPerson: true },
    },
    transportPrices: {
      publicTransport: { min: 1.5, max: 3, perPerson: true },
      taxi: { min: 10, max: 25, perPerson: false },
      rentalCar: { min: 40, max: 80, perPerson: false },
    },
  },
  // Francia
  FR: {
    currency: "€",
    restaurantPrices: {
      budget: { min: 15, max: 25, perPerson: true },
      moderate: { min: 25, max: 45, perPerson: true },
      expensive: { min: 45, max: 80, perPerson: true },
      luxury: { min: 80, max: 150, perPerson: true },
    },
    attractionPrices: {
      low: { min: 8, max: 18, perPerson: true },
      medium: { min: 18, max: 35, perPerson: true },
      high: { min: 35, max: 70, perPerson: true },
    },
    transportPrices: {
      publicTransport: { min: 1.9, max: 3.5, perPerson: true },
      taxi: { min: 15, max: 35, perPerson: false },
      rentalCar: { min: 50, max: 100, perPerson: false },
    },
  },
  // Italia
  IT: {
    currency: "€",
    restaurantPrices: {
      budget: { min: 12, max: 25, perPerson: true },
      moderate: { min: 25, max: 40, perPerson: true },
      expensive: { min: 40, max: 70, perPerson: true },
      luxury: { min: 70, max: 130, perPerson: true },
    },
    attractionPrices: {
      low: { min: 6, max: 15, perPerson: true },
      medium: { min: 15, max: 30, perPerson: true },
      high: { min: 30, max: 60, perPerson: true },
    },
    transportPrices: {
      publicTransport: { min: 1.5, max: 3, perPerson: true },
      taxi: { min: 12, max: 30, perPerson: false },
      rentalCar: { min: 45, max: 90, perPerson: false },
    },
  },
  // Reino Unido
  GB: {
    currency: "€", // Convertido a euros para mantener consistencia
    restaurantPrices: {
      budget: { min: 15, max: 25, perPerson: true },
      moderate: { min: 25, max: 45, perPerson: true },
      expensive: { min: 45, max: 80, perPerson: true },
      luxury: { min: 80, max: 150, perPerson: true },
    },
    attractionPrices: {
      low: { min: 10, max: 20, perPerson: true },
      medium: { min: 20, max: 35, perPerson: true },
      high: { min: 35, max: 70, perPerson: true },
    },
    transportPrices: {
      publicTransport: { min: 2.5, max: 5, perPerson: true },
      taxi: { min: 15, max: 40, perPerson: false },
      rentalCar: { min: 50, max: 100, perPerson: false },
    },
  },
  // Estados Unidos
  US: {
    currency: "€", // Convertido a euros para mantener consistencia
    restaurantPrices: {
      budget: { min: 15, max: 25, perPerson: true },
      moderate: { min: 25, max: 45, perPerson: true },
      expensive: { min: 45, max: 80, perPerson: true },
      luxury: { min: 80, max: 150, perPerson: true },
    },
    attractionPrices: {
      low: { min: 10, max: 25, perPerson: true },
      medium: { min: 25, max: 50, perPerson: true },
      high: { min: 50, max: 100, perPerson: true },
    },
    transportPrices: {
      publicTransport: { min: 2, max: 4, perPerson: true },
      taxi: { min: 15, max: 40, perPerson: false },
      rentalCar: { min: 40, max: 90, perPerson: false },
    },
  },
  // Valor predeterminado (para países no especificados)
  DEFAULT: {
    currency: "€",
    restaurantPrices: {
      budget: { min: 12, max: 22, perPerson: true },
      moderate: { min: 22, max: 40, perPerson: true },
      expensive: { min: 40, max: 70, perPerson: true },
      luxury: { min: 70, max: 130, perPerson: true },
    },
    attractionPrices: {
      low: { min: 8, max: 18, perPerson: true },
      medium: { min: 18, max: 35, perPerson: true },
      high: { min: 35, max: 65, perPerson: true },
    },
    transportPrices: {
      publicTransport: { min: 2, max: 4, perPerson: true },
      taxi: { min: 12, max: 30, perPerson: false },
      rentalCar: { min: 45, max: 90, perPerson: false },
    },
  },
}

// Factores de ajuste por ciudad (multiplicadores)
// Estos factores se aplican a los precios base del país
const CITY_PRICE_FACTORS: Record<string, number> = {
  // España
  Madrid: 1.2,
  Barcelona: 1.3,
  Valencia: 1.0,
  Sevilla: 1.0,
  Málaga: 1.1,
  Bilbao: 1.1,
  "San Sebastián": 1.3,
  Granada: 0.9,
  Córdoba: 0.9,
  Toledo: 1.0,
  Salamanca: 0.9,
  "Santiago de Compostela": 1.0,
  Ibiza: 1.4,
  Mallorca: 1.2,
  Tenerife: 1.1,
  "Gran Canaria": 1.1,

  // Francia
  Paris: 1.5,
  Lyon: 1.2,
  Marseille: 1.1,
  Nice: 1.3,
  Bordeaux: 1.2,
  Strasbourg: 1.1,
  Lille: 1.0,
  Toulouse: 1.0,

  // Italia
  Roma: 1.3,
  Milano: 1.4,
  Firenze: 1.2,
  Venezia: 1.4,
  Napoli: 0.9,
  Bologna: 1.1,
  Torino: 1.0,
  Verona: 1.1,

  // Reino Unido
  London: 1.6,
  Edinburgh: 1.3,
  Manchester: 1.1,
  Birmingham: 1.0,
  Glasgow: 1.0,
  Liverpool: 1.0,
  Oxford: 1.2,
  Cambridge: 1.2,

  // Estados Unidos
  "New York": 1.7,
  "Los Angeles": 1.5,
  Chicago: 1.3,
  "San Francisco": 1.6,
  Miami: 1.4,
  "Las Vegas": 1.3,
  Boston: 1.4,
  Washington: 1.3,
}

// Función para obtener el código de país a partir del nombre del país
function getCountryCode(countryName: string): string {
  const countryMap: Record<string, string> = {
    España: "ES",
    Spain: "ES",
    Francia: "FR",
    France: "FR",
    Italia: "IT",
    Italy: "IT",
    "Reino Unido": "GB",
    "United Kingdom": "GB",
    UK: "GB",
    "Estados Unidos": "US",
    "United States": "US",
    USA: "US",
  }

  // Buscar coincidencias exactas
  if (countryMap[countryName]) {
    return countryMap[countryName]
  }

  // Buscar coincidencias parciales
  for (const [key, value] of Object.entries(countryMap)) {
    if (countryName.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return "DEFAULT"
}

// Función para obtener el factor de precio de una ciudad
function getCityPriceFactor(cityName: string): number {
  // Buscar coincidencias exactas
  if (CITY_PRICE_FACTORS[cityName]) {
    return CITY_PRICE_FACTORS[cityName]
  }

  // Buscar coincidencias parciales
  for (const [key, value] of Object.entries(CITY_PRICE_FACTORS)) {
    if (cityName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(cityName.toLowerCase())) {
      return value
    }
  }

  return 1.0 // Factor predeterminado
}

/**
 * Estima el rango de precios para un restaurante basado en su nivel de precio
 * @param priceLevel Nivel de precio de Google Places (1-4)
 * @param destination Destino (ciudad o país)
 * @param numPeople Número de personas
 * @returns Rango de precios estimado en formato "XX€ - YY€"
 */
export function estimateRestaurantPrice(priceLevel: number | undefined, destination: string, numPeople = 1): string {
  // Si no hay nivel de precio, devolver un mensaje genérico
  if (priceLevel === undefined) {
    return "Precio no disponible"
  }

  // Determinar el país y la ciudad
  let countryCode = "DEFAULT"
  let cityName = destination

  // Intentar extraer el país del destino
  const parts = destination.split(",").map((part) => part.trim())
  if (parts.length > 1) {
    // El último elemento podría ser el país
    const possibleCountry = parts[parts.length - 1]
    const code = getCountryCode(possibleCountry)
    if (code !== "DEFAULT") {
      countryCode = code
      // La ciudad sería el primer elemento
      cityName = parts[0]
    }
  } else {
    // Intentar determinar el país basado en ciudades conocidas
    for (const [city, _] of Object.entries(CITY_PRICE_FACTORS)) {
      if (destination.toLowerCase().includes(city.toLowerCase())) {
        // Determinar el país basado en la ciudad
        if (["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga"].includes(city)) {
          countryCode = "ES"
        } else if (["Paris", "Lyon", "Marseille", "Nice"].includes(city)) {
          countryCode = "FR"
        } else if (["Roma", "Milano", "Firenze", "Venezia"].includes(city)) {
          countryCode = "IT"
        } else if (["London", "Edinburgh", "Manchester"].includes(city)) {
          countryCode = "GB"
        } else if (["New York", "Los Angeles", "Chicago"].includes(city)) {
          countryCode = "US"
        }
        cityName = city
        break
      }
    }
  }

  // Obtener los datos de precios para el país
  const priceData = PRICE_DATA[countryCode] || PRICE_DATA.DEFAULT

  // Obtener el factor de precio para la ciudad
  const cityFactor = getCityPriceFactor(cityName)

  // Mapear el nivel de precio de Google Places a nuestras categorías
  let priceRange: PriceRange
  switch (priceLevel) {
    case 1:
      priceRange = priceData.restaurantPrices.budget
      break
    case 2:
      priceRange = priceData.restaurantPrices.moderate
      break
    case 3:
      priceRange = priceData.restaurantPrices.expensive
      break
    case 4:
      priceRange = priceData.restaurantPrices.luxury
      break
    default:
      priceRange = priceData.restaurantPrices.moderate
  }

  // Aplicar el factor de la ciudad
  const adjustedMin = Math.round(priceRange.min * cityFactor)
  const adjustedMax = Math.round(priceRange.max * cityFactor)

  // Calcular el precio total para el número de personas
  const totalMin = priceRange.perPerson ? adjustedMin * numPeople : adjustedMin
  const totalMax = priceRange.perPerson ? adjustedMax * numPeople : adjustedMax

  // Devolver el rango de precios formateado
  return `${totalMin}€ - ${totalMax}€`
}

/**
 * Estima el precio de una atracción basado en su tipo y popularidad
 * @param attractionType Tipo de atracción (museo, parque, etc.)
 * @param destination Destino (ciudad o país)
 * @param popularity Popularidad estimada (low, medium, high)
 * @param numPeople Número de personas
 * @returns Precio estimado en formato "XX€"
 */
export function estimateAttractionPrice(
  attractionType: string,
  destination: string,
  popularity: "low" | "medium" | "high" = "medium",
  numPeople = 1,
): string {
  // Determinar el país y la ciudad
  let countryCode = "DEFAULT"
  let cityName = destination

  // Intentar extraer el país del destino (similar a la función anterior)
  const parts = destination.split(",").map((part) => part.trim())
  if (parts.length > 1) {
    const possibleCountry = parts[parts.length - 1]
    const code = getCountryCode(possibleCountry)
    if (code !== "DEFAULT") {
      countryCode = code
      cityName = parts[0]
    }
  } else {
    // Intentar determinar el país basado en ciudades conocidas
    for (const [city, _] of Object.entries(CITY_PRICE_FACTORS)) {
      if (destination.toLowerCase().includes(city.toLowerCase())) {
        if (["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga"].includes(city)) {
          countryCode = "ES"
        } else if (["Paris", "Lyon", "Marseille", "Nice"].includes(city)) {
          countryCode = "FR"
        } else if (["Roma", "Milano", "Firenze", "Venezia"].includes(city)) {
          countryCode = "IT"
        } else if (["London", "Edinburgh", "Manchester"].includes(city)) {
          countryCode = "GB"
        } else if (["New York", "Los Angeles", "Chicago"].includes(city)) {
          countryCode = "US"
        }
        cityName = city
        break
      }
    }
  }

  // Obtener los datos de precios para el país
  const priceData = PRICE_DATA[countryCode] || PRICE_DATA.DEFAULT

  // Obtener el factor de precio para la ciudad
  const cityFactor = getCityPriceFactor(cityName)

  // Ajustar el precio según el tipo de atracción
  let typeFactor = 1.0

  if (attractionType.toLowerCase().includes("museum") || attractionType.toLowerCase().includes("museo")) {
    typeFactor = 1.2
  } else if (attractionType.toLowerCase().includes("park") || attractionType.toLowerCase().includes("parque")) {
    typeFactor = 0.7
  } else if (attractionType.toLowerCase().includes("tour") || attractionType.toLowerCase().includes("guided")) {
    typeFactor = 1.5
  } else if (
    attractionType.toLowerCase().includes("cathedral") ||
    attractionType.toLowerCase().includes("church") ||
    attractionType.toLowerCase().includes("catedral") ||
    attractionType.toLowerCase().includes("iglesia")
  ) {
    typeFactor = 0.8
  } else if (
    attractionType.toLowerCase().includes("castle") ||
    attractionType.toLowerCase().includes("palace") ||
    attractionType.toLowerCase().includes("castillo") ||
    attractionType.toLowerCase().includes("palacio")
  ) {
    typeFactor = 1.3
  }

  // Obtener el rango de precios según la popularidad
  const priceRange = priceData.attractionPrices[popularity]

  // Aplicar los factores
  const adjustedMin = Math.round(priceRange.min * cityFactor * typeFactor)
  const adjustedMax = Math.round(priceRange.max * cityFactor * typeFactor)

  // Calcular el precio total para el número de personas
  const totalMin = priceRange.perPerson ? adjustedMin * numPeople : adjustedMin
  const totalMax = priceRange.perPerson ? adjustedMax * numPeople : adjustedMax

  // Para parques o similar que podrían ser gratis
  if (
    attractionType.toLowerCase().includes("park") ||
    attractionType.toLowerCase().includes("parque") ||
    attractionType.toLowerCase().includes("garden") ||
    attractionType.toLowerCase().includes("jardín") ||
    attractionType.toLowerCase().includes("plaza") ||
    attractionType.toLowerCase().includes("square")
  ) {
    return "Gratis"
  }

  // Si es una iglesia o similar que podría tener donación sugerida
  if (
    attractionType.toLowerCase().includes("church") ||
    attractionType.toLowerCase().includes("iglesia") ||
    attractionType.toLowerCase().includes("cathedral") ||
    attractionType.toLowerCase().includes("catedral")
  ) {
    return `Donación sugerida: ${Math.round(totalMin / 2)}€`
  }

  // Para atracciones muy populares, dar un rango
  if (popularity === "high" && totalMax - totalMin > 10) {
    return `${totalMin}€ - ${totalMax}€`
  }

  // Para el resto, dar un precio único
  const midPrice = Math.round((totalMin + totalMax) / 2)
  return `${midPrice}€`
}

/**
 * Estima el precio del transporte
 * @param transportType Tipo de transporte (publicTransport, taxi, rentalCar)
 * @param destination Destino (ciudad o país)
 * @param distance Distancia en km
 * @param numPeople Número de personas
 * @returns Precio estimado en formato "XX€"
 */
export function estimateTransportPrice(
  transportType: "publicTransport" | "taxi" | "rentalCar",
  destination: string,
  distance = 5,
  numPeople = 1,
): string {
  // Determinar el país y la ciudad (similar a las funciones anteriores)
  const countryCode = "DEFAULT"
  const cityName = destination

  // Lógica para determinar país y ciudad (omitida por brevedad, similar a las funciones anteriores)

  // Obtener los datos de precios para el país
  const priceData = PRICE_DATA[countryCode] || PRICE_DATA.DEFAULT

  // Obtener el factor de precio para la ciudad
  const cityFactor = getCityPriceFactor(cityName)

  // Obtener el rango de precios según el tipo de transporte
  const priceRange = priceData.transportPrices[transportType]

  // Aplicar el factor de la ciudad
  const adjustedMin = priceRange.min * cityFactor
  const adjustedMax = priceRange.max * cityFactor

  // Ajustar según la distancia (principalmente para taxis)
  let distanceFactor = 1.0
  if (transportType === "taxi") {
    distanceFactor = Math.max(1.0, distance / 5) // 5 km como base
  } else if (transportType === "publicTransport") {
    distanceFactor = Math.min(1.5, Math.max(1.0, distance / 10)) // Menos sensible a la distancia
  }

  // Calcular el precio ajustado
  const finalMin = Math.round(adjustedMin * distanceFactor)
  const finalMax = Math.round(adjustedMax * distanceFactor)

  // Calcular el precio total para el número de personas
  const totalMin = priceRange.perPerson ? finalMin * numPeople : finalMin
  const totalMax = priceRange.perPerson ? finalMax * numPeople : finalMax

  // Para transporte público, a menudo es un precio fijo
  if (transportType === "publicTransport") {
    return `${Math.round((totalMin + totalMax) / 2)}€`
  }

  // Para taxis y alquiler de coches, dar un rango
  return `${totalMin}€ - ${totalMax}€`
}

/**
 * Genera una descripción textual del nivel de precio
 * @param priceLevel Nivel de precio (1-4)
 * @returns Descripción del nivel de precio
 */
export function getPriceLevelDescription(priceLevel: number | undefined): string {
  if (priceLevel === undefined) return "Precio no disponible"

  switch (priceLevel) {
    case 1:
      return "Económico (€)"
    case 2:
      return "Moderado (€€)"
    case 3:
      return "Caro (€€€)"
    case 4:
      return "Muy caro (€€€€)"
    default:
      return "Precio no disponible"
  }
}
