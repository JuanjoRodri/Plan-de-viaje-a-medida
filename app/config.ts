// Archivo de configuración centralizado para la aplicación

// Actualizar la configuración para manejar mejor las variables de entorno

// API Keys - Frontend (expuesta al navegador)
export const GOOGLE_MAPS_FRONTEND_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

// API Keys - Backend (solo servidor)
// Fallback temporal a la clave frontend si la del servidor no está configurada
export const GOOGLE_MAPS_SERVER_API_KEY =
  process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
export const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ""
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ""

// Añadir las exportaciones que faltan:

export const GOOGLE_PLACES_API_KEY = GOOGLE_MAPS_SERVER_API_KEY

// Configuración de verificación de ubicaciones
export const LOCATION_VERIFICATION = {
  // Distancia máxima (en km) para considerar que un lugar está "cerca" del destino
  MAX_DISTANCE_KM: 50, // Aumentado de 25 a 50 km para ser menos restrictivo
  // Radio de búsqueda predeterminado (en metros) para buscar lugares cerca del destino
  DEFAULT_SEARCH_RADIUS: 50000, // Aumentado de 20km a 50km
  // Umbral de similitud para considerar que un lugar es el mismo.
  // Reducido significativamente para ser mucho menos estricto
  SIMILARITY_THRESHOLD: 0.3, // Reducido de 0.55 a 0.3
  // Umbral de confianza para destinos
  CONFIDENCE_THRESHOLD: 50, // Reducido para ser menos estricto
}

// Función para verificar si las API keys están configuradas
export function checkApiKeys() {
  const keys = {
    googleMapsFrontendApiKey: !!GOOGLE_MAPS_FRONTEND_API_KEY,
    googleMapsServerApiKey: !!process.env.GOOGLE_MAPS_SERVER_API_KEY,
    googleMapsServerApiFallback: !!GOOGLE_MAPS_SERVER_API_KEY,
    openWeatherApiKey: !!process.env.OPENWEATHER_API_KEY,
    openAiApiKey: !!process.env.OPENAI_API_KEY,
  }

  console.log("🔑 Estado de las API keys:", keys)

  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) {
    console.warn("⚠️ GOOGLE_MAPS_SERVER_API_KEY no configurada, usando fallback a NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
  }

  return keys
}
