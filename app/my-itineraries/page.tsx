import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase"
import type { Itinerary } from "@/types/database"
import ItinerariesList from "./itineraries-list"
import { Suspense } from "react"

export default async function MyItinerariesPage() {
  // Verificar si el usuario está autenticado
  const token = cookies().get("auth_token")?.value
  if (!token) {
    redirect("/login")
  }

  try {
    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Obtener el usuario actual de Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error de autenticación:", authError)
      cookies().delete("auth_token")
      redirect("/login")
    }

    // Obtener información adicional del usuario desde la tabla users
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("id, name, email, daily_itinerary_limit, itineraries_created_today")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error al obtener perfil del usuario:", userError)
      // Continuar sin el perfil completo, usar datos básicos del usuario
    }

    // Obtener los itinerarios del usuario
    const { data: itineraries, error: itinerariesError } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (itinerariesError) {
      console.error("Error al obtener itinerarios:", itinerariesError)
      return (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Mis itinerarios</h1>
          <p className="text-red-600">Error al cargar los itinerarios. Por favor, inténtalo de nuevo más tarde.</p>
        </div>
      )
    }

    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Mis itinerarios</h1>
        <Suspense fallback={<div>Cargando itinerarios...</div>}>
          <ItinerariesList
            initialItineraries={itineraries as Itinerary[]}
            user={
              userProfile
                ? {
                    id: userProfile.id,
                    name: userProfile.name,
                    email: userProfile.email,
                    remaining_itineraries:
                      userProfile.daily_itinerary_limit - (userProfile.itineraries_created_today || 0),
                  }
                : undefined
            }
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Error en MyItinerariesPage:", error)
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Mis itinerarios</h1>
        <p className="text-red-600">Error al cargar los itinerarios. Por favor, inténtalo de nuevo más tarde.</p>
      </div>
    )
  }
}
