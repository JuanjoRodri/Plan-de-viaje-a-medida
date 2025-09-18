import { NextResponse } from "next/server"
import { DailyStatsService } from "@/app/services/daily-stats-service"
import { getUser } from "@/lib/auth"

/**
 * 🔧 NUEVA: API para forzar la agregación diaria manualmente
 */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("🚀 Forzando agregación diaria manual...")

    // Obtener diagnóstico antes
    const diagnosticBefore = await DailyStatsService.getDiagnosticInfo()

    // Ejecutar agregación
    const success = await DailyStatsService.aggregateDailyStats()

    // Obtener diagnóstico después
    const diagnosticAfter = await DailyStatsService.getDiagnosticInfo()

    return NextResponse.json({
      success,
      message: success ? "Agregación forzada ejecutada correctamente" : "Error en agregación forzada",
      before: diagnosticBefore,
      after: diagnosticAfter,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en agregación forzada:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
