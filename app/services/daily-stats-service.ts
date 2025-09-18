import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Tipos para mayor claridad
type DailyStat = { date: string; count: number }

export class DailyStatsService {
  private static supabase: SupabaseClient | null = null

  private static async getSupabaseClient(): Promise<SupabaseClient | null> {
    if (this.supabase) return this.supabase

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Faltan credenciales de Supabase para DailyStatsService")
      return null
    }
    this.supabase = createClient(supabaseUrl, supabaseKey)
    return this.supabase
  }

  /**
   * Obtiene los datos para la gráfica del dashboard.
   * Combina datos históricos de 'daily_itinerary_stats' con los datos de hoy de 'users.itineraries_created_today'.
   */
  static async getDailyChartData(startDate: Date, endDate: Date): Promise<DailyStat[]> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return []

    const startDateString = startDate.toISOString().split("T")[0]
    const endDateString = endDate.toISOString().split("T")[0]
    const todayString = new Date().toISOString().split("T")[0]

    console.log(`📊 [ChartData] Solicitando datos de ${startDateString} a ${endDateString}. Hoy es ${todayString}.`)

    let historicalStats: DailyStat[] = []
    let todayStat: DailyStat | null = null

    // 1. Obtener datos históricos (todos los días excepto hoy)
    const { data: historicalData, error: historicalError } = await supabase
      .from("daily_itinerary_stats")
      .select("date, total_itineraries")
      .gte("date", startDateString)
      .lte("date", endDateString)
      .neq("date", todayString) // Excluir hoy de los datos históricos
      .order("date", { ascending: true })

    if (historicalError) {
      console.error("❌ [ChartData] Error obteniendo datos históricos:", historicalError.message)
    } else if (historicalData) {
      historicalStats = historicalData.map((row: any) => ({
        date: row.date,
        count: row.total_itineraries || 0,
      }))
      console.log(`📊 [ChartData] ${historicalStats.length} registros históricos obtenidos.`)
    }

    // 2. Obtener datos de HOY si está dentro del rango solicitado
    if (todayString >= startDateString && todayString <= endDateString) {
      const { data: usersTodayData, error: usersTodayError } = await supabase
        .from("users")
        .select("itineraries_created_today")

      if (usersTodayError) {
        console.error("❌ [ChartData] Error obteniendo itineraries_created_today de users:", usersTodayError.message)
      } else if (usersTodayData) {
        const countToday = usersTodayData.reduce((sum, user) => sum + (user.itineraries_created_today || 0), 0)
        todayStat = { date: todayString, count: countToday }
        console.log(`📊 [ChartData] Itinerarios de HOY (${todayString}): ${countToday}`)
      }
    }

    // 3. Combinar y ordenar los datos
    let combinedStats = [...historicalStats]
    if (todayStat) {
      // Reemplazar si hoy ya existía (no debería por el .neq) o añadir
      const todayIndex = combinedStats.findIndex((stat) => stat.date === todayString)
      if (todayIndex !== -1) {
        combinedStats[todayIndex] = todayStat
      } else {
        combinedStats.push(todayStat)
      }
    }

    // Asegurar que solo devolvemos datos dentro del rango y ordenados
    combinedStats = combinedStats
      .filter((stat) => stat.date >= startDateString && stat.date <= endDateString)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log(`📊 [ChartData] Total ${combinedStats.length} puntos de datos para la gráfica.`)
    return combinedStats
  }

  /**
   * Realiza la agregación diaria:
   * - Calcula el total de itinerarios de AYER sumando 'itineraries_created_today' de la tabla 'users'.
   * - Guarda este total en 'daily_itinerary_stats' para AYER.
   * - Resetea 'itineraries_created_today' a 0 y actualiza 'last_reset_date' para HOY en 'users'.
   */
  static async performDailyAggregation(): Promise<{ success: boolean; message: string }> {
    const supabase = await this.getSupabaseClient()
    if (!supabase) return { success: false, message: "Supabase client no disponible." }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const yesterdayString = yesterday.toISOString().split("T")[0]
    const todayString = today.toISOString().split("T")[0]

    console.log(
      `⚙️ [Aggregation] Iniciando agregación para AYER (${yesterdayString}) y reseteo para HOY (${todayString}).`,
    )

    // Paso 1: Verificar estructura de la tabla users y obtener datos actuales
    console.log(`🔍 [Aggregation] Verificando estructura de tabla users...`)
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, itineraries_created_today, last_reset_date")
      .limit(5) // Solo algunos para verificar

    if (usersError) {
      console.error("❌ [Aggregation] Error verificando tabla users:", usersError.message)
      return { success: false, message: `Error verificando tabla users: ${usersError.message}` }
    }

    console.log(`🔍 [Aggregation] Muestra de usuarios:`, usersData?.slice(0, 3))

    // Paso 2: Obtener TODOS los usuarios para calcular el total de ayer
    const { data: allUsersData, error: allUsersError } = await supabase
      .from("users")
      .select("itineraries_created_today")

    if (allUsersError) {
      console.error("❌ [Aggregation] Error obteniendo todos los usuarios:", allUsersError.message)
      return { success: false, message: `Error obteniendo usuarios: ${allUsersError.message}` }
    }

    const totalItinerariesYesterday =
      allUsersData?.reduce((sum, user) => sum + (user.itineraries_created_today || 0), 0) || 0
    console.log(
      `⚙️ [Aggregation] Total itinerarios AYER (${yesterdayString}) desde ${allUsersData?.length || 0} usuarios: ${totalItinerariesYesterday}`,
    )

    // Paso 3: Guardar en daily_itinerary_stats para AYER
    const { error: upsertError } = await supabase.from("daily_itinerary_stats").upsert(
      {
        date: yesterdayString,
        total_itineraries: totalItinerariesYesterday,
      },
      { onConflict: "date" },
    )

    if (upsertError) {
      console.error("❌ [Aggregation] Error guardando en daily_itinerary_stats:", upsertError.message)
      return { success: false, message: `Error guardando en daily_itinerary_stats: ${upsertError.message}` }
    }
    console.log(
      `⚙️ [Aggregation] Guardado en daily_itinerary_stats para ${yesterdayString}: ${totalItinerariesYesterday} itinerarios.`,
    )

    // Paso 4: Resetear contadores en 'users' - MEJORADO con más logs
    console.log(`🔄 [Aggregation] Iniciando reseteo de contadores...`)

    // Primero, verificar cuántos usuarios tienen contadores > 0
    const { data: usersWithCounters, error: checkError } = await supabase
      .from("users")
      .select("id, itineraries_created_today, last_reset_date")
      .gt("itineraries_created_today", 0)

    if (checkError) {
      console.error("❌ [Aggregation] Error verificando usuarios con contadores:", checkError.message)
    } else {
      console.log(`🔍 [Aggregation] Usuarios con itineraries_created_today > 0: ${usersWithCounters?.length || 0}`)
      if (usersWithCounters && usersWithCounters.length > 0) {
        console.log(`🔍 [Aggregation] Primeros 3 usuarios con contadores:`, usersWithCounters.slice(0, 3))
      }
    }

    // Resetear TODOS los usuarios que tengan itineraries_created_today > 0
    // Removemos la condición de last_reset_date para ser más inclusivos
    const {
      data: updateResult,
      error: resetError,
      count,
    } = await supabase
      .from("users")
      .update({
        itineraries_created_today: 0,
        last_reset_date: todayString,
      })
      .gt("itineraries_created_today", 0) // Solo resetear usuarios que tengan contadores > 0

    if (resetError) {
      console.error("❌ [Aggregation] Error reseteando contadores en users:", resetError.message)
      // No retornamos error aquí, ya que la agregación principal tuvo éxito
    } else {
      console.log(`⚙️ [Aggregation] Reseteados contadores para ${count || 0} usuarios para HOY (${todayString}).`)
      if (count && count > 0) {
        console.log(`✅ [Aggregation] Reseteo exitoso: ${count} usuarios actualizados.`)
      } else {
        console.log(`⚠️ [Aggregation] No se encontraron usuarios para resetear (todos ya tenían contador en 0).`)
      }
    }

    return {
      success: true,
      message: `Agregación para ${yesterdayString} completada. ${count || 0} usuarios reseteados para ${todayString}.`,
    }
  }
}
