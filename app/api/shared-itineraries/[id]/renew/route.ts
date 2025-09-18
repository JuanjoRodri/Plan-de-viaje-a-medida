import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del itinerario compartido" }, { status: 400 })
    }

    const body = await request.json()
    const expiresInDays = body.expiresInDays || 30

    if (expiresInDays < 1 || expiresInDays > 365) {
      return NextResponse.json({ error: "Los días de expiración deben estar entre 1 y 365" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el itinerario pertenece al usuario
    const { data: itinerary, error: fetchError } = await supabase
      .from("shared_itineraries")
      .select("user_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Error al verificar el itinerario" }, { status: 500 })
    }

    if (!itinerary || (itinerary.user_id !== user.id && user.email !== "admin@example.com")) {
      return NextResponse.json({ error: "No autorizado para renovar este itinerario" }, { status: 403 })
    }

    // Calcular nueva fecha de expiración
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + expiresInDays)

    // Actualizar la fecha de expiración
    const { error: updateError } = await supabase
      .from("shared_itineraries")
      .update({
        expires_at: newExpiresAt.toISOString(),
        is_active: true,
      })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Error al renovar el itinerario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      newExpiresAt: newExpiresAt.toISOString(),
    })
  } catch (error) {
    console.error("Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
