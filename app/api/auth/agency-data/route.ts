import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 GET /api/auth/agency-data - Iniciando...")

    const user = await getUser()
    console.log("👤 Usuario obtenido:", user ? { id: user.id, email: user.email } : "null")

    if (!user) {
      console.log("❌ Usuario no autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("📊 Consultando información de agencia para usuario ID:", user.id)

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("users")
      .select(`
        agency_name, 
        agency_phone, 
        agency_email, 
        agent_name, 
        agency_address, 
        agency_website, 
        agency_logo_url
      `)
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("❌ Error en consulta Supabase:", error)
      console.error("❌ Detalles del error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: "Error al obtener información de agencia" }, { status: 500 })
    }

    console.log("✅ Datos de agencia obtenidos exitosamente:", {
      hasAgencyName: !!data?.agency_name,
      hasAgencyEmail: !!data?.agency_email,
      hasAgencyPhone: !!data?.agency_phone,
      hasAgencyAddress: !!data?.agency_address,
      hasAgencyWebsite: !!data?.agency_website,
      hasAgencyLogo: !!data?.agency_logo_url,
    })

    return NextResponse.json(data || {})
  } catch (error) {
    console.error("💥 Error general en GET /api/auth/agency-data:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
