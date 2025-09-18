import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function DELETE() {
  try {
    // Verificar autenticación
    const sessionCookie = cookies().get("session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie)
    const supabase = createServerSupabaseClient()

    // Obtener la URL actual del logo
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("agency_logo_url")
      .eq("id", session.id)
      .single()

    if (fetchError) {
      console.error("Error fetching user data:", fetchError)
      return NextResponse.json({ message: "Error al obtener datos del usuario" }, { status: 500 })
    }

    // Si hay un logo, eliminarlo del storage
    if (userData.agency_logo_url) {
      // Extraer el nombre del archivo de la URL
      const fileName = `${session.id}/logo.jpg` // Asumimos jpg, pero podrías extraerlo de la URL

      const { error: deleteError } = await supabase.storage.from("agency-assets").remove([fileName])

      if (deleteError) {
        console.error("Error deleting from storage:", deleteError)
        // Continuar aunque falle el borrado del storage
      }
    }

    // Actualizar la base de datos para remover la URL
    const { error: updateError } = await supabase.from("users").update({ agency_logo_url: null }).eq("id", session.id)

    if (updateError) {
      console.error("Error updating database:", updateError)
      return NextResponse.json({ message: "Error al actualizar la base de datos" }, { status: 500 })
    }

    return NextResponse.json({ message: "Logo eliminado correctamente" })
  } catch (error) {
    console.error("Error in remove-logo:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
