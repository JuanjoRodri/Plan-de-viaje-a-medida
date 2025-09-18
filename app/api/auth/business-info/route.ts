import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  console.log("🔍 GET /api/auth/business-info - Iniciando...")

  try {
    const user = await getUser()
    console.log("👤 Usuario obtenido:", user ? { id: user.id, email: user.email } : "null")

    if (!user) {
      console.log("❌ Usuario no autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("📊 Consultando información empresarial para usuario ID:", user.id)

    const { data, error } = await supabase
      .from("users")
      .select("agency_name, agency_phone, agency_email, agency_address, agency_website, agency_logo_url")
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
      return NextResponse.json({ error: "Error al obtener información empresarial" }, { status: 500 })
    }

    console.log("✅ Datos obtenidos exitosamente (incluyendo logo):", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("💥 Error general en GET /api/auth/business-info:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  console.log("🔄 PUT /api/auth/business-info - Iniciando actualización...")

  try {
    const user = await getUser()
    console.log("👤 Usuario obtenido:", user ? { id: user.id, email: user.email } : "null")

    if (!user) {
      console.log("❌ Usuario no autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Datos recibidos:", body)

    const { agency_name, agency_phone, agency_email, agency_address, agency_website } = body

    // Validaciones básicas
    if (agency_website && !agency_website.match(/^https?:\/\/.+/)) {
      console.log("❌ Validación fallida: URL inválida")
      return NextResponse.json({ error: "El sitio web debe incluir http:// o https://" }, { status: 400 })
    }

    const updateData = {
      agency_name: agency_name || null,
      agency_phone: agency_phone || null,
      agency_email: agency_email || null,
      agency_address: agency_address || null,
      agency_website: agency_website || null,
      branding_updated_at: new Date().toISOString(),
    }

    console.log("📊 Datos a actualizar:", updateData)
    console.log("🎯 Actualizando para usuario ID:", user.id)

    const { data, error } = await supabase.from("users").update(updateData).eq("id", user.id).select() // Añadimos select para ver qué se actualizó

    if (error) {
      console.error("❌ Error en actualización Supabase:", error)
      console.error("❌ Detalles del error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: "Error al actualizar información empresarial" }, { status: 500 })
    }

    console.log("✅ Actualización exitosa. Datos actualizados:", data)
    return NextResponse.json({ message: "Información empresarial actualizada exitosamente" })
  } catch (error) {
    console.error("💥 Error general en PUT /api/auth/business-info:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
