// TIPOS ACTUALIZADOS PARA LA NUEVA ESTRUCTURA

export interface EnhancedItinerary {
  // Campos existentes
  id: string
  user_id: string
  title: string
  destination: string
  days: number
  travelers: number
  budget_type: string
  html_content: string
  created_at: string
  updated_at: string

  // Nuevos campos para compatibilidad con localStorage
  nights?: number
  hotel?: string
  arrival_time?: string
  departure_time?: string
  weather_data?: WeatherData
  budget_details?: BudgetDetails
  transport_info?: TransportInfo
  board_type?: string
  start_date?: string
  end_date?: string

  // Campos para gestión de historial y estado
  is_history?: boolean
  is_current?: boolean
  is_favorite?: boolean
  last_viewed_at?: string
  auto_saved?: boolean
  generation_params?: GenerationParams

  // Campos adicionales
  tags?: string[]
  notes?: string
  shared_with?: string[]
  view_count?: number
  last_modified_by?: string
}

export interface WeatherData {
  current?: {
    temperature: number
    description: string
    icon: string
  }
  forecast?: Array<{
    date: string
    temperature: { min: number; max: number }
    description: string
    icon: string
  }>
}

export interface BudgetDetails {
  total_estimated?: number
  breakdown?: {
    accommodation?: number
    food?: number
    transport?: number
    activities?: number
    other?: number
  }
  currency?: string
}

export interface TransportInfo {
  arrival?: {
    type: string
    details: string
    time?: string
  }
  departure?: {
    type: string
    details: string
    time?: string
  }
  local_transport?: string[]
}

export interface GenerationParams {
  destination: string
  days: number
  travelers: number
  budget_type: string
  board_type?: string
  hotel?: string
  arrival_time?: string
  departure_time?: string
  weather_included?: boolean
  timestamp: string
}

export interface UserPreferences {
  id: string
  user_id: string
  max_history_items: number
  auto_save_enabled: boolean
  sync_enabled: boolean
  default_budget_type: string
  default_board_type: string
  preferred_destinations: string[]
  created_at: string
  updated_at: string
}

export interface ItineraryActivity {
  id: string
  itinerary_id: string
  user_id: string
  action_type: "created" | "viewed" | "edited" | "shared" | "deleted"
  action_details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

// --- NUEVOS TIPOS PARA FOTOS ---

/**
 * Representa una foto de un lugar desde Google Places
 */
export interface PlacePhoto {
  id: string
  place_id: string
  google_place_id?: string
  photo_reference: string
  photo_url: string
  width: number
  height: number
  created_at: string
  updated_at: string
}

/**
 * Respuesta de la API de fotos
 */
export interface PlacePhotosResponse {
  success: boolean
  photos: PlacePhoto[]
  cached: boolean
  error?: string
}

// --- INICIO: NUEVOS TIPOS PARA ITINERARIO BASADO EN JSON ---

/**
 * Representa las coordenadas geográficas.
 */
export interface JsonCoordinates {
  lat: number
  lng: number
}

/**
 * Información detallada sobre un destino.
 */
export interface JsonDestinationInfo {
  name: string // Ej: "Roma, Italia"
  googlePlaceId?: string // ID de Google Places para el destino principal
  coordinates?: JsonCoordinates
  country?: string
  description?: string // Breve descripción del destino
}

/**
 * Detalles del presupuesto del viaje.
 */
export interface JsonBudgetInfo {
  type: "low" | "medium" | "high" | "custom"
  estimatedTotal?: number // Estimación total del presupuesto
  currency: string // Ej: "EUR", "USD"
  breakdown?: {
    // Desglose opcional
    accommodation?: number
    food?: number
    transport?: number
    activities?: number
    other?: number
  }
}

/**
 * Preferencias específicas del hotel.
 */
export interface JsonHotelPreference {
  name?: string // Nombre específico del hotel si el usuario lo indica
  googlePlaceId?: string // ID de Google Places del hotel
  stars?: number // Ej: 3, 4, 5
  verified?: boolean // Si el hotel ha sido verificado
  notes?: string // Notas adicionales sobre la preferencia de hotel
}

/**
 * Preferencias de viaje del usuario.
 */
export interface JsonTravelPreferences {
  hotel?: JsonHotelPreference
  boardType?: "room_only" | "breakfast" | "half_board" | "full_board" | "all_inclusive"
  activityTypes?: string[] // Ej: ["culture", "nature", "foodie", "relax"]
  pace?: "relaxed" | "moderate" | "packed" // Ritmo del viaje
  transportation?: ("public" | "private_car" | "taxi" | "walk" | "bike")[] // Preferencias de transporte local
}

/**
 * Información de una ubicación para una actividad o alojamiento.
 */
export interface JsonActivityLocation {
  name: string // Nombre del lugar
  address?: string // Dirección
  googlePlaceId?: string // ID de Google Places (crucial para verificación y mapas)
  coordinates?: JsonCoordinates
  mapsUrl?: string // URL de Google Maps
  verified: boolean // Estado de verificación del lugar
  verificationSource?: "google_places" | "user_confirmed" | "ai_suggestion" | "not_verified"
  openingHours?: string // Ej: "9:00 AM - 5:00 PM"
  website?: string
  phoneNumber?: string
  userRating?: number // Calificación promedio (e.g., 1-5)
  userRatingsTotal?: number // Número total de reseñas
  photoReference?: string // Referencia para foto de Google Places
  // NUEVO: Array de fotos cargadas bajo demanda
  photos?: PlacePhoto[]
  photosLoaded?: boolean // Si ya se cargaron las fotos
  photosLoadedAt?: string // Cuándo se cargaron las fotos
}

/**
 * Estimación de precio para una actividad.
 */
export interface JsonPriceEstimate {
  amount: number
  currency: string
  perPerson: boolean // Si el precio es por persona
  notes?: string // Ej: "incluye guía", "solo entrada"
}

/**
 * Información de reserva para una actividad o alojamiento.
 */
export interface JsonBookingInfo {
  confirmationNumber?: string
  provider?: string // Ej: "Booking.com", "Restaurante Web"
  bookedThrough?: string
  status: "not_booked" | "booked" | "pending_confirmation" | "requires_action"
  bookingUrl?: string // Enlace directo a la reserva
  cancellationPolicy?: string
}

/**
 * Resultado del análisis de sentimiento para un lugar o actividad.
 */
export interface JsonSentimentAnalysisResult {
  score: number // Ej: -1 a 1 (negativo a positivo), o 1 a 5 (malo a excelente)
  label?: "positive" | "neutral" | "negative" // Etiqueta derivada del score
  summary?: string // Breve resumen del sentimiento
  keywords?: string[] // Palabras clave asociadas
  source?: "google_reviews" | "tripadvisor" | "internal_model" | "user_input"
  reviewCount?: number
}

/**
 * Representa una actividad dentro de un día del itinerario.
 */
export interface JsonActivity {
  id: string // UUID único para la actividad
  title: string
  startTime: string // Hora de inicio, ej: "10:00" (formato HH:mm)
  endTime?: string // Hora de fin, ej: "12:00" (formato HH:mm)
  durationMinutes?: number // Duración en minutos
  description?: string
  type: "sightseeing" | "meal" | "transport" | "accommodation" | "free_time" | "event" | "custom"
  location?: JsonActivityLocation // Opcional, no todas las actividades tienen una ubicación específica
  priceEstimate?: JsonPriceEstimate
  bookingInfo?: JsonBookingInfo
  notes?: string // Notas específicas de la actividad
  sentiment?: JsonSentimentAnalysisResult // Análisis de sentimiento del lugar/actividad
  isOptional?: boolean // Si la actividad es opcional
  transportToNext?: {
    // Detalles del transporte a la siguiente actividad
    mode?: string // Ej: "walk", "taxi", "metro"
    durationMinutes?: number
    notes?: string
  }
}

/**
 * Representa el plan para un día específico del itinerario.
 */
export interface JsonDailyPlan {
  dayNumber: number // 1, 2, 3...
  date: string // Fecha en formato ISO, ej: "2025-07-10"
  title?: string // Título opcional para el día, ej: "Llegada y exploración del centro"
  summary?: string // Breve resumen de lo que se hará en el día
  activities: JsonActivity[]
  accommodation?: JsonActivityLocation // Dónde se aloja esa noche (si cambia o para referencia)
  dailyNotes?: string // Notas específicas para el día
}

/**
 * Estructura principal del itinerario basado en JSON.
 * Esta será la "fuente de la verdad" para los itinerarios.
 */
export interface JsonItinerary {
  id: string // UUID del itinerario
  userId: string // UUID del usuario propietario
  title: string // Título del itinerario, ej: "Aventura en los Alpes Suizos"
  destination: JsonDestinationInfo // Información del destino principal
  startDate: string // Fecha de inicio en formato ISO, ej: "2025-08-15"
  endDate: string // Fecha de fin en formato ISO, ej: "2025-08-20"
  daysCount: number // Número total de días (calculado o almacenado)
  travelers: number // Número de viajeros
  budget?: JsonBudgetInfo // Información del presupuesto
  preferences?: JsonTravelPreferences // Preferencias de viaje
  dailyPlans: JsonDailyPlan[] // Array de planes diarios
  generalNotes?: string // Notas generales para todo el viaje
  createdAt: string // Fecha de creación en formato ISO datetime
  updatedAt: string // Fecha de última actualización en formato ISO datetime
  isFavorite?: boolean
  isHistory?: boolean // Si es una versión de historial
  isCurrent?: boolean // Si es el itinerario activo/actual
  lastViewedAt?: string // Fecha de última visualización
  generationParams?: GenerationParams // Parámetros usados para generar este itinerario (reutiliza tipo existente)
  version: number // Versión del esquema JSON, ej: 1, 2
  tags?: string[] // Etiquetas para organizar/filtrar itinerarios
  coverImageUrl?: string // URL para una imagen de portada del itinerario
  sharedWith?: string[] // IDs de usuarios con los que se comparte
  viewCount?: number
  lastModifiedBy?: string // ID del último usuario que modificó
  weatherData?: WeatherData // Datos del clima (reutiliza tipo existente)
}

// --- FIN: NUEVOS TIPOS PARA ITINERARIO BASADO EN JSON ---

// Tipos para migración
export interface LocalStorageItinerary {
  id: string
  html: string
  destination: string
  days: string
  nights: string
  travelers: string
  hotel: string
  arrival_time: string
  departure_time: string
  budget_type: string
  board_type: string
  weather_data?: WeatherData
  timestamp: string
}

export interface MigrationResult {
  success: boolean
  migrated_count: number
  errors: string[]
  backup_created: boolean
}
