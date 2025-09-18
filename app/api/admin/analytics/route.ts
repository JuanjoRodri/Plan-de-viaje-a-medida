import { NextResponse } from "next/server"
import { AnalyticsService } from "@/app/services/analytics-service"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Verificar que el usuario sea admin
    const user = await getAuthUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener parámetros de la URL
    const url = new URL(request.url)
    const range = (url.searchParams.get("range") as "week" | "month" | "year") || "month"

    // Obtener métricas
    const metrics = await AnalyticsService.getDashboardMetrics(range)

    if (!metrics) {
      return NextResponse.json({ error: "Error obteniendo métricas" }, { status: 500 })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error en API de analytics:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
