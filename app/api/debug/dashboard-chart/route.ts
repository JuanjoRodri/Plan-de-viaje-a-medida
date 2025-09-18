import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DailyStatsService } from "@/app/services/daily-stats-service"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de base de datos incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Verificar datos en daily_itinerary_stats
    console.log("🔍 Verificando tabla daily_itinerary_stats...")
    const { data: dailyStats, error: dailyStatsError } = await supabase
      .from("daily_itinerary_stats")
      .select("*")
      .order("date", { ascending: false })
      .limit(10)

    // 2. Verificar datos en itineraries (últimos 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    console.log("🔍 Verificando tabla itineraries...")
    const { data: recentItineraries, error: itinerariesError } = await supabase
      .from("itineraries")
      .select("id, created_at, destination")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })

    // 3. Verificar función get_combined_daily_stats
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    console.log("🔍 Verificando función get_combined_daily_stats...")
    const { data: combinedStats, error: combinedError } = await supabase.rpc("get_combined_daily_stats", {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    })

    // 4. Contar itinerarios por día manualmente
    const manualDailyCounts: { [key: string]: number } = {}
    recentItineraries?.forEach((itinerary) => {
      const date = itinerary.created_at.split("T")[0]
      manualDailyCounts[date] = (manualDailyCounts[date] || 0) + 1
    })

    const manualDailyArray = Object.entries(manualDailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 5. Verificar si hay problemas con fechas/formatos
    const dateIssues = []
    if (combinedStats) {
      combinedStats.forEach((stat: any, index: number) => {
        if (!stat.date || isNaN(new Date(stat.date).getTime())) {
          dateIssues.push(`Índice ${index}: fecha inválida '${stat.date}'`)
        }
        if (typeof stat.count !== "number" || stat.count < 0) {
          dateIssues.push(`Índice ${index}: count inválido '${stat.count}'`)
        }
      })
    }

    // 6. Obtener información de diagnóstico de contadores
    const diagnosticInfo = await DailyStatsService.getDiagnosticInfo()

    const response = {
      timestamp: new Date().toISOString(),
      tables: {
        daily_itinerary_stats: {
          count: dailyStats?.length || 0,
          error: dailyStatsError?.message || null,
          sample: dailyStats?.slice(0, 5) || [],
        },
        itineraries_recent: {
          count: recentItineraries?.length || 0,
          error: itinerariesError?.message || null,
          dateRange: {
            from: thirtyDaysAgo.toISOString().split("T")[0],
            to: new Date().toISOString().split("T")[0],
          },
        },
      },
      functions: {
        get_combined_daily_stats: {
          count: combinedStats?.length || 0,
          error: combinedError?.message || null,
          sample: combinedStats?.slice(0, 5) || [],
        },
      },
      analysis: {
        manualDailyCounts: manualDailyArray.slice(-7), // Últimos 7 días
        dateIssues,
        totalManualCount: Object.values(manualDailyCounts).reduce((sum, count) => sum + count, 0),
        diagnosticInfo,
      },
      recommendations: [],
    }

    // Generar recomendaciones basadas en el análisis
    if (dailyStatsError) {
      response.recommendations.push("❌ Error en tabla daily_itinerary_stats - verificar estructura")
    }
    if (combinedError) {
      response.recommendations.push("❌ Error en función get_combined_daily_stats - verificar función SQL")
    }
    if (dateIssues.length > 0) {
      response.recommendations.push(`⚠️ ${dateIssues.length} problemas de formato de fecha detectados`)
    }
    if ((dailyStats?.length || 0) === 0) {
      response.recommendations.push("⚠️ No hay datos en daily_itinerary_stats - ejecutar agregación")
    }
    if ((combinedStats?.length || 0) === 0 && (recentItineraries?.length || 0) > 0) {
      response.recommendations.push("⚠️ Función combinada no devuelve datos pero hay itinerarios recientes")
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Error en diagnóstico de dashboard:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
