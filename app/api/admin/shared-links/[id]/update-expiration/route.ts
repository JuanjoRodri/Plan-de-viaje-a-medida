import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const id = params.id
    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del enlace compartido" }, { status: 400 })
    }

    const { expires_at } = await request.json()
    if (!expires_at || typeof expires_at !== "string") {
      return NextResponse.json({ error: "Se requiere una fecha de expiración válida" }, { status: 400 })
    }

    // Validar formato de fecha (ISO string)
    if (isNaN(new Date(expires_at).getTime())) {
      return NextResponse.json({ error: "Formato de fecha de expiración inválido" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("shared_itineraries")
      .update({ expires_at: expires_at, is_active: true }) // Activar el enlace al renovar
      .eq("id", id)
      .select()
      .single() // Esperamos un solo resultado

    if (error) {
      console.error("Error al actualizar la expiración (admin):", error)
      return NextResponse.json({ error: "Error al actualizar la expiración", details: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Enlace compartido no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ sharedLink: data })
  } catch (error) {
    console.error("Error inesperado en API admin/shared-links/update-expiration:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
