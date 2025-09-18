export interface Coordinates {
  lat: number
  lng: number
}

export interface ActivityLocation {
  name: string
  address?: string
  coordinates?: Coordinates // Coordenadas son cruciales para el mapa
  placeId?: string // Google Place ID
  url?: string // URL de Google Maps u otra

  // Campos adicionales de Google Places
  googlePlaceId?: string
  mapsUrl?: string // URL específica con CID
  website?: string
  phoneNumber?: string
  rating?: number
  userRating?: number // Alias para compatibilidad
  userRatingsTotal?: number
  openingHours?: string
  priceLevel?: number
  businessStatus?: string

  // Campos de verificación
  verified?: boolean
  verificationSource?:
    | "google_places"
    | "database_cache"
    | "ai_suggestion"
    | "not_verified"
    | "verification_failed"
    | "verification_error"
}

// Interfaz para el análisis de sentimiento
export interface JsonSentimentAnalysisResult {
  score: number // 0-5
  summary: string
  keywords: string[]
  label: "positive" | "negative" | "neutral"
  source?: string
  reviewCount?: number
}

export interface JsonActivity {
  id: string
  title: string
  type: "activity" | "meal" | "accommodation" | "transport" | string // Tipos comunes + string para flexibilidad
  startTime: string // e.g., "09:00"
  endTime: string // e.g., "10:30"
  description?: string
  location?: ActivityLocation
  price?: string | number // Puede ser un estimado o un número
  notes?: string
  sentiment?: JsonSentimentAnalysisResult // Objeto completo de análisis
}

export interface JsonDailyPlan {
  id: string
  dayNumber: number
  title?: string // e.g., "Día 1: Llegada y exploración inicial"
  date?: string // e.g., "2024-07-15"
  activities: JsonActivity[]
  accommodation?: ActivityLocation // Dónde se duerme ese día/noche
  summary?: string // Resumen del día
}

export interface JsonHotelPreference {
  name?: string
  address?: string
  coordinates?: Coordinates
  type?: string // e.g., "Hotel", "Apartamento"
  budget?: string // e.g., "moderado", "lujo"
  amenities?: string[] // e.g., ["wifi", "piscina"]
}

export interface JsonTravelerInfo {
  count: number
  type?: "adults" | "children" | "infants" | string // o 'solo', 'pareja', 'familia'
  ages?: number[]
}

export interface JsonPreferences {
  travelStyle?: string[] // e.g., ["aventura", "cultural", "relax"]
  pace?: "relajado" | "moderado" | "intenso"
  interests?: string[] // e.g., ["historia", "gastronomía", "naturaleza"]
  budget?: {
    total?: number | string
    currency?: string // e.g., "EUR", "USD"
    accommodationPerNight?: number | string
    mealsPerDay?: number | string
  }
  transportation?: string[] // e.g., ["coche_alquiler", "transporte_publico", "taxi"]
  hotel?: JsonHotelPreference
  // Otras preferencias específicas
  dietaryRestrictions?: string[]
  accessibilityNeeds?: string[]
}

export interface JsonItinerary {
  id: string // UUID
  title: string // e.g., "Viaje de Aventura por los Alpes Suizos"
  destination: {
    name: string // e.g., "Interlaken, Suiza"
    coordinates?: Coordinates // Coordenadas del destino principal
    country?: string
    region?: string
  }
  dates: {
    startDate?: string // e.g., "2024-07-15"
    endDate?: string // e.g., "2024-07-22"
    durationDays?: number
  }
  travelers?: JsonTravelerInfo[]
  preferences?: JsonPreferences
  dailyPlans: JsonDailyPlan[]
  summary?: string // Resumen general del viaje
  totalEstimatedCost?: {
    amount?: number
    currency?: string
  }
  version: string // Para versionado del schema JSON, e.g., "1.0"
  createdAt: string // ISO 8601 timestamp
  updatedAt: string // ISO 8601 timestamp
  // Podríamos añadir un campo para notas generales del itinerario
  generalNotes?: string
  // Para el mapa, podríamos tener una lista consolidada de todos los puntos de interés
  // o derivarla de los dailyPlans y hotel.
}
