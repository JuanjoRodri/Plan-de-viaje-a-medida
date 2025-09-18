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

    const { is_active } = await request.json()
    if (typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Se requiere un estado de activación válido (true/false)" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("shared_itineraries")
      .update({ is_active: is_active })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error al cambiar estado de activación (admin):", error)
      return NextResponse.json(
        { error: "Error al cambiar estado de activación", details: error.message },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json({ error: "Enlace compartido no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ sharedLink: data })
  } catch (error) {
    console.error("Error inesperado en API admin/shared-links/toggle-active:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
