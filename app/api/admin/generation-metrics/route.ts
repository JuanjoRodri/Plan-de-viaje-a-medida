import { type NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth"
import { saveGenerationMetrics, getMetricsSummary } from "@/app/services/generation-metrics"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    // Solo permitir a usuarios autenticados (para logging interno)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const data = await request.json()

    const success = await saveGenerationMetrics(data)

    if (!success) {
      return NextResponse.json({ error: "Error guardando métricas" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in generation-metrics POST:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    // Solo admins pueden ver métricas
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "7")

    const metrics = await getMetricsSummary(days)

    if (!metrics) {
      return NextResponse.json({ error: "Error obteniendo métricas" }, { status: 500 })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error in generation-metrics GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
