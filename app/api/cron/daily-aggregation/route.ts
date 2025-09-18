import { NextResponse } from "next/server"
import { DailyStatsService } from "@/app/services/daily-stats-service"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  console.log("⚙️ [CRON] Iniciando agregación diaria programada...")

  // Opcional: Log de la fuente de la petición para debugging
  const userAgent = request.headers.get("user-agent")
  const forwardedFor = request.headers.get("x-forwarded-for")
  console.log(`🔍 [CRON] User-Agent: ${userAgent}`)
  console.log(`��� [CRON] X-Forwarded-For: ${forwardedFor}`)

  const result = await DailyStatsService.performDailyAggregation()

  if (result.success) {
    console.log("✅ [CRON] Agregación diaria completada exitosamente.")
    return NextResponse.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
    })
  } else {
    console.error("❌ [CRON] Error durante la agregación diaria:", result.message)
    return NextResponse.json(
      {
        success: false,
        message: result.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// También permitir POST por si acaso
export async function POST(request: NextRequest) {
  return GET(request)
}
