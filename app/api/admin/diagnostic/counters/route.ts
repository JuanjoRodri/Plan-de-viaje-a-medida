import { NextResponse } from "next/server"
import { DailyStatsService } from "@/app/services/daily-stats-service"

export async function GET() {
  try {
    const diagnosticInfo = await DailyStatsService.getDiagnosticInfo()

    if (!diagnosticInfo) {
      return NextResponse.json({ error: "Error obteniendo información de diagnóstico" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: diagnosticInfo,
      message: "Información de diagnóstico obtenida correctamente",
    })
  } catch (error) {
    console.error("Error en endpoint de diagnóstico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("🚨 Ejecutando reseteo forzado de contadores...")

    const success = await DailyStatsService.forceResetAllCounters()

    if (!success) {
      return NextResponse.json({ error: "Error ejecutando reseteo forzado" }, { status: 500 })
    }

    const diagnosticInfo = await DailyStatsService.getDiagnosticInfo()

    return NextResponse.json({
      success: true,
      message: "Reseteo forzado ejecutado correctamente",
      data: diagnosticInfo,
    })
  } catch (error) {
    console.error("Error en reseteo forzado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
