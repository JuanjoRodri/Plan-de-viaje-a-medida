import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSession } from "@/lib/auth"
import { EmailService } from "@/app/services/email-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession()
    if (!session?.id || session.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { action, notes } = await request.json()
    const requestId = params.id

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    // Obtener la solicitud con datos del usuario
    const { data: boostRequest, error: requestError } = await supabase
      .from("boost_requests")
      .select(`
        *,
        user:users!boost_requests_user_id_fkey(name,email,monthly_itinerary_limit)
      `)
      .eq("id", requestId)
      .single()

    if (requestError || !boostRequest) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
    }

    if (boostRequest.status !== "pending") {
      return NextResponse.json({ error: "La solicitud ya fue procesada" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Actualizar la solicitud
    const { error: updateError } = await supabase
      .from("boost_requests")
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: session.id,
        admin_notes: notes,
      })
      .eq("id", requestId)

    if (updateError) {
      console.error("Error actualizando solicitud:", updateError)
      return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
    }

    // Si se aprueba, añadir itinerarios y resetear warning
    if (action === "approve") {
      const currentLimit = boostRequest.user.monthly_itinerary_limit || 50
      const newLimit = currentLimit + boostRequest.itineraries_requested

      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          monthly_itinerary_limit: newLimit,
          limit_warning_sent_this_month: false, // Reset warning flag
        })
        .eq("id", boostRequest.user_id)

      if (userUpdateError) {
        console.error("Error actualizando usuario:", userUpdateError)
        return NextResponse.json({ error: "Error al actualizar límites del usuario" }, { status: 500 })
      }

      // Enviar email de confirmación
      await EmailService.sendBoostApprovedEmail(
        boostRequest.user.email,
        boostRequest.user.name,
        boostRequest.itineraries_requested,
        boostRequest.total_price || boostRequest.itineraries_requested * 5, // Fallback price
        notes,
      )
    }

    return NextResponse.json({
      success: true,
      message: `Solicitud ${action === "approve" ? "aprobada" : "rechazada"} exitosamente`,
    })
  } catch (error) {
    console.error("Error en PUT /api/admin/boost-requests/[id]:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
