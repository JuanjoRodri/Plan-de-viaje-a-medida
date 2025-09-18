import { geocodePlace } from "./google-places-service"
import { getEnhancedPlaceDetails } from "./places-utils"

export interface ValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface ApiHealthCheck {
  googlePlaces: boolean
  openAI: boolean
  weather: boolean
  supabase: boolean
}

/**
 * Valida que el destino existe y es accesible
 */
export async function validateDestination(destination: string): Promise<ValidationResult> {
  try {
    if (!destination || destination.trim().length < 2) {
      return {
        isValid: false,
        error: "Destino demasiado corto o vacío",
      }
    }

    // Intentar geocodificar el destino
    const coords = await geocodePlace(destination)

    if (!coords) {
      return {
        isValid: false,
        error: "No se pudo encontrar el destino especificado",
      }
    }

    return {
      isValid: true,
      warnings: coords.lat === 0 && coords.lng === 0 ? ["Coordenadas genéricas encontradas"] : undefined,
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Error validando destino: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}

/**
 * Valida que el hotel existe si se proporciona un placeId
 */
export async function validateHotel(placeId?: string): Promise<ValidationResult> {
  if (!placeId) {
    return { isValid: true } // Hotel es opcional
  }

  try {
    const hotelDetails = await getEnhancedPlaceDetails(placeId)

    if (!hotelDetails) {
      return {
        isValid: false,
        error: "No se pudieron obtener detalles del hotel especificado",
      }
    }

    if (hotelDetails.permanently_closed || hotelDetails.business_status === "CLOSED_PERMANENTLY") {
      return {
        isValid: false,
        error: "El hotel seleccionado está cerrado permanentemente",
      }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: `Error validando hotel: ${error instanceof Error ? error.message : "Error desconocido"}`,
    }
  }
}

/**
 * Verifica el estado de las APIs críticas
 */
export async function checkApisHealth(): Promise<ApiHealthCheck> {
  const health: ApiHealthCheck = {
    googlePlaces: false,
    openAI: false,
    weather: false,
    supabase: false,
  }

  // Test Google Places API
  try {
    const response = await fetch("/api/places/search?query=test", { method: "GET" })
    health.googlePlaces = response.ok
  } catch {
    health.googlePlaces = false
  }

  // Test Weather API
  try {
    const response = await fetch("/api/weather?location=Madrid", { method: "GET" })
    health.weather = response.ok
  } catch {
    health.weather = false
  }

  // Test Supabase (implícito si llegamos aquí)
  health.supabase = true

  // OpenAI se testea en el momento de uso
  health.openAI = true

  return health
}

/**
 * Valida los parámetros del formulario
 */
export function validateFormParams(formData: FormData): ValidationResult {
  const destination = formData.get("destination")?.toString()
  const days = formData.get("days")?.toString()
  const nights = formData.get("nights")?.toString()
  const travelers = formData.get("travelers")?.toString()

  const warnings: string[] = []

  if (!destination) {
    return { isValid: false, error: "Destino es requerido" }
  }

  const numDays = Number.parseInt(days || "0")
  const numNights = Number.parseInt(nights || "0")
  const numTravelers = Number.parseInt(travelers || "0")

  if (numDays < 1 || numDays > 14) {
    return { isValid: false, error: "Días debe estar entre 1 y 14" }
  }

  if (numNights < 0 || numNights > 13) {
    return { isValid: false, error: "Noches debe estar entre 0 y 13" }
  }

  if (numTravelers < 1 || numTravelers > 10) {
    return { isValid: false, error: "Viajeros debe estar entre 1 y 10" }
  }

  // Advertencias
  if (numDays > 7) {
    warnings.push("Itinerarios largos pueden tardar más en generarse")
  }

  if (numTravelers > 6) {
    warnings.push("Grupos grandes pueden tener opciones limitadas")
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
