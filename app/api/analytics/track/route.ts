import { NextResponse } from "next/server"
import { AnalyticsService } from "@/app/services/analytics-service"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validar datos mínimos
    if (!data.event_type) {
      return NextResponse.json({ error: "Tipo de evento requerido" }, { status: 400 })
    }

    // Registrar evento
    await AnalyticsService.trackEvent(data.event_type, data.user_id, data.event_data || {}, data.session_id, request)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking analytics event:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
