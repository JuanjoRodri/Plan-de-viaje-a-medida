import { createClient } from "@supabase/supabase-js"

// Verificar que las variables de entorno estén disponibles
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Crear cliente con valores por defecto si no están disponibles (para evitar errores en desarrollo)
const defaultUrl = supabaseUrl || "https://placeholder.supabase.co"
const defaultAnonKey = supabaseAnonKey || "placeholder-anon-key"

// Solo mostrar warnings en lugar de lanzar errores
if (!supabaseUrl) {
  console.warn("⚠️ NEXT_PUBLIC_SUPABASE_URL no está configurada")
}

if (!supabaseAnonKey) {
  console.warn("⚠️ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada")
}

// Cliente para el lado del cliente (solo usa variables NEXT_PUBLIC_)
export const supabase = createClient(defaultUrl, defaultAnonKey)

// Cliente para el servidor (solo usar en archivos del servidor)
export function createServerSupabaseClient() {
  if (!supabaseServiceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not found, using anon key")
    return createClient(defaultUrl, defaultAnonKey)
  }
  return createClient(defaultUrl, supabaseServiceKey)
}

// Exportar también createClient para compatibilidad
export { createClient }

export function createServerClient() {
  return createServerSupabaseClient()
}

// Función para verificar si Supabase está correctamente configurado
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}
