export interface Itinerary {
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
    minTemp: number
    maxTemp: number
    condition: string
    chanceOfRain: number
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
