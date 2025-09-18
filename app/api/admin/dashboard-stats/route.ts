import { type NextRequest, NextResponse } from "next/server"
import { DailyStatsService } from "@/app/services/daily-stats-service" // Usaremos el nuevo servicio
import { createClient } from "@supabase/supabase-js" // Para otras métricas

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "month"

    console.log(`📊 [API Dashboard] Solicitado rango: ${range}`)

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999) // Asegurar que incluye todo el día de hoy
    const startDate = new Date(endDate)

    switch (range) {
      case "week":
        startDate.setDate(startDate.getDate() - 6) // Últimos 7 días incluyendo hoy
        break
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDate.setDate(startDate.getDate() + 1) // Para que sea un año exacto hasta hoy
        break
      default: // month (por defecto últimos 30 días)
        startDate.setDate(startDate.getDate() - 29) // Últimos 30 días incluyendo hoy
        break
    }
    startDate.setHours(0, 0, 0, 0)

    console.log(`📊 [API Dashboard] Rango calculado: ${startDate.toISOString()} a ${endDate.toISOString()}`)

    // Obtener datos para la gráfica
    const dailyChartData = await DailyStatsService.getDailyChartData(startDate, endDate)

    // --- Calcular otras métricas (simplificado para el ejemplo, puedes expandir) ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { count: totalUsers } = await supabase.from("users").select("id", { count: "exact" })
    // --- Calcular total real de itinerarios (histórico + actual) ---
    // 1. Suma de todos los totales históricos en daily_itinerary_stats
    const { data: historicalStats, error: historicalError } = await supabase
      .from("daily_itinerary_stats")
      .select("total_itineraries")

    let historicalTotal = 0
    if (historicalError) {
      console.error("[Dashboard] Error obteniendo datos históricos:", historicalError)
    } else if (historicalStats) {
      historicalTotal = historicalStats.reduce((acc, row) => acc + (row.total_itineraries || 0), 0)
    }

    // 2. Itinerarios de hoy (tiempo real)
    const today = new Date().toISOString().split("T")[0]
    const { data: todayItineraries, error: todayError } = await supabase
      .from("itineraries")
      .select("id")
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lt("created_at", `${today}T23:59:59.999Z`)

    const todayCount = todayItineraries?.length || 0

    // 3. Total real = histórico + hoy
    const totalItinerariesReal = historicalTotal + todayCount

    console.log(
      `📊 [Dashboard] Total histórico: ${historicalTotal}, Hoy: ${todayCount}, Total real: ${totalItinerariesReal}`,
    )

    const { data: usersTodayData } = await supabase.from("users").select("itineraries_created_today")
    const itinerariesToday = usersTodayData?.reduce((sum, user) => sum + (user.itineraries_created_today || 0), 0) || 0

    // Aquí puedes añadir más lógica para activeUsers, itinerariesInRange, etc.
    // Por ahora, nos centramos en la gráfica.

    const response = {
      totalUsers: totalUsers || 0,
      activeUsers: 0, // Placeholder
      totalItineraries: totalItinerariesReal,
      itinerariesInSelectedRange: dailyChartData.reduce((sum, day) => sum + day.count, 0), // Suma de la gráfica
      avgItinerariesPerUser: totalUsers && totalItinerariesReal ? (totalItinerariesReal / totalUsers).toFixed(1) : "0",
      itinerariesToday: itinerariesToday,
      mostPopularDestinations: [], // Placeholder
      dailyItineraries: dailyChartData, // Datos para la gráfica
    }

    console.log(
      `📊 [API Dashboard] Respuesta preparada. Puntos gráfica: ${dailyChartData.length}, Hoy (tarjeta): ${itinerariesToday}`,
    )
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("❌ [API Dashboard] Error:", error.message)
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 })
  }
}
