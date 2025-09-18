import { NextResponse } from "next/server"
import { DailyStatsService } from "@/app/services/daily-stats-service"
import { getUser } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // Verificar que el usuario sea admin
    const user = await getUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🔄 Iniciando agregación diaria manual...")

    // Ejecutar agregación diaria
    const success = await DailyStatsService.aggregateDailyStats()

    if (!success) {
      return NextResponse.json({ error: "Error en agregación diaria" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Agregación diaria ejecutada correctamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en API de agregación diaria:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // Verificar que el usuario sea admin
    const user = await getUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener información de diagnóstico
    const diagnosticInfo = await DailyStatsService.getDiagnosticInfo()
    const recentStats = await DailyStatsService.getRecentStats(7)
    const currentDayTotal = await DailyStatsService.getCurrentDayTotal()

    return NextResponse.json({
      diagnostic: diagnosticInfo,
      recentStats,
      currentDayTotal,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
