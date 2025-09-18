import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getAuthUser } from "@/lib/auth"

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Solo eliminamos itinerarios que NO son favoritos (is_favorite = false)
    // Mantenemos los guardados explícitamente por el usuario
    const { error } = await supabase.from("itineraries").delete().eq("user_id", user.id).eq("is_favorite", false)

    if (error) {
      console.error("Error al limpiar historial:", error)
      return NextResponse.json({ error: "Error al limpiar el historial" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Historial limpiado correctamente",
      success: true,
    })
  } catch (error: any) {
    console.error("Error al limpiar historial:", error)
    return NextResponse.json({ error: `Error en el servidor: ${error.message}` }, { status: 500 })
  }
}
