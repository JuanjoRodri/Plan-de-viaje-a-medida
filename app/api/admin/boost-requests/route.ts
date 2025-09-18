import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSession } from "@/lib/auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const session = getSession()
    if (!session?.id || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todas las solicitudes con datos del usuario
    const { data: requests, error } = await supabase
      .from("boost_requests")
      .select(`
        id,
        user_id,
        status,
        itineraries_requested,
        total_price,
        current_used,
        current_limit,
        admin_notes,
        created_at,
        processed_at,
        user:users!boost_requests_user_id_fkey(id,name,email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error obteniendo solicitudes:", error)
      return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error en GET /api/admin/boost-requests:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
