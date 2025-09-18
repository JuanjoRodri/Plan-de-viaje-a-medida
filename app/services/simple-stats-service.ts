import { createClient, type SupabaseClient } from "@supabase/supabase-js"

interface DailyStatRow {
  date: string
  total_itineraries: number
}

export class SimpleStatsService {
  private static async getSupabaseClient(): Promise<SupabaseClient> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Faltan credenciales de Supabase")
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Obtiene estadísticas diarias de itinerarios DESDE daily_itinerary_stats
   * para la gráfica. INCLUYE los datos de hoy en tiempo real.
   */
  static async getDailyItineraryStats(startDate: Date, endDate: Date): Promise<{ date: string; count: number }[]> {
    try {
      const supabase = await this.getSupabaseClient()
      const startDateString = startDate.toISOString().split("T")[0]
      const endDateString = endDate.toISOString().split("T")[0]
      const todayString = new Date().toISOString().split("T")[0]

      console.log(
        `📊 [Graph] Obteniendo estadísticas diarias desde daily_itinerary_stats para el rango: ${startDateString} a ${endDateString}`,
      )
      console.log(`📊 [Graph] Fecha de HOY detectada: ${todayString}`)

      // 1. Obtener datos históricos de daily_itinerary_stats (excluyendo hoy)
      const { data: statsFromTable, error: tableError } = (await supabase
        .from("daily_itinerary_stats")
        .select("date, total_itineraries")
        .gte("date", startDateString)
        .lte("date", endDateString)
        .neq("date", todayString) // EXCLUIR hoy para evitar duplicados
        .order("date", { ascending: true })) as { data: DailyStatRow[] | null; error: any }

      if (tableError) {
        console.error("[Graph] Error obteniendo datos de daily_itinerary_stats:", tableError)
      }

      // 2. Crear mapa con todos los días del rango (inicializados en 0)
      const dailyCountsMap: Map<string, number> = new Map()
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0]
        dailyCountsMap.set(dateStr, 0)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // 3. Llenar con datos históricos
      if (statsFromTable) {
        statsFromTable.forEach((stat) => {
          const countValue = stat.total_itineraries
          if (stat.date && typeof countValue === "number") {
            const statDateStr = new Date(stat.date).toISOString().split("T")[0]
            if (dailyCountsMap.has(statDateStr)) {
              dailyCountsMap.set(statDateStr, countValue)
              console.log(`📊 [Graph] Dato histórico: ${statDateStr} = ${countValue}`)
            }
          }
        })
      }

      // 4. SIEMPRE obtener datos de HOY en tiempo real si está en el rango
      if (dailyCountsMap.has(todayString)) {
        console.log(`📊 [Graph] Obteniendo datos de HOY (${todayString}) en tiempo real...`)

        const { data: todayData, error: todayError } = await supabase
          .from("itineraries")
          .select("id, created_at")
          .gte("created_at", `${todayString}T00:00:00.000Z`)
          .lt("created_at", `${todayString}T23:59:59.999Z`)

        if (todayError) {
          console.error("[Graph] Error obteniendo itinerarios de hoy:", todayError)
        } else {
          const todayCount = todayData?.length || 0
          dailyCountsMap.set(todayString, todayCount)
          console.log(`✅ [Graph] Itinerarios de HOY (${todayString}): ${todayCount}`)

          // Debug: mostrar algunos ejemplos
          if (todayData && todayData.length > 0) {
            console.log(
              `📊 [Graph] Ejemplos de itinerarios de hoy:`,
              todayData.slice(0, 3).map((i) => i.created_at),
            )
          }
        }
      } else {
        console.log(`⚠️ [Graph] HOY (${todayString}) no está en el rango solicitado`)
      }

      const result = Array.from(dailyCountsMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      console.log(`✅ [Graph] Estadísticas diarias procesadas: ${result.length} días preparados.`)
      console.log(`📊 [Graph] Últimos 3 días:`, result.slice(-3))

      return result
    } catch (error) {
      console.error("[Graph] Error crítico en getDailyItineraryStats:", error)
      // Fallback robusto
      const fallbackResult: { date: string; count: number }[] = []
      const currentDateLoop = new Date(startDate)
      while (currentDateLoop <= endDate) {
        fallbackResult.push({ date: currentDateLoop.toISOString().split("T")[0], count: 0 })
        currentDateLoop.setDate(currentDateLoop.getDate() + 1)
      }
      console.warn("⚠️ [Graph] Devolviendo datos de fallback (ceros) para getDailyItineraryStats.")
      return fallbackResult
    }
  }

  /**
   * Obtiene estadísticas básicas de usuarios.
   */
  static async getUserStats(startDate: Date, endDate: Date) {
    try {
      const supabase = await this.getSupabaseClient()
      const { data: users, error } = await supabase.from("users").select("id, created_at")

      if (error) {
        console.error("[Users] Error obteniendo usuarios:", error)
        return { totalUsers: 0, activeUsers: 0 }
      }

      const totalUsers = users?.length || 0
      const activeUsers =
        users?.filter((user) => {
          const userDate = new Date(user.created_at)
          return userDate >= startDate && userDate <= endDate
        }).length || 0

      console.log(`✅ [Users] Total: ${totalUsers}, Activos en rango: ${activeUsers}`)
      return { totalUsers, activeUsers }
    } catch (error) {
      console.error("[Users] Error crítico en getUserStats:", error)
      return { totalUsers: 0, activeUsers: 0 }
    }
  }

  /**
   * Obtiene estadísticas agregadas de itinerarios.
   * - totalItineraries: Suma de TODOS los 'total_itineraries' en daily_itinerary_stats.
   * - itinerariesInRange: Suma de 'total_itineraries' en daily_itinerary_stats para el rango dado.
   * - favoriteRate: Calculado sobre la tabla 'itineraries' (esto podría necesitar revisión si 'itineraries' no es la fuente completa).
   * - mostPopularDestinations: Calculado sobre la tabla 'itineraries'.
   */
  static async getItineraryAggregatedStats(startDate: Date, endDate: Date) {
    try {
      const supabase = await this.getSupabaseClient()
      const startDateString = startDate.toISOString().split("T")[0]
      const endDateString = endDate.toISOString().split("T")[0]

      // 1. Total Global de Itinerarios (desde daily_itinerary_stats)
      const { data: sumTotal, error: sumError } = await supabase
        .from("daily_itinerary_stats")
        .select("total_itineraries")

      let grandTotalItineraries = 0
      if (sumError) {
        console.error("[ItineraryAgg] Error sumando total_itineraries global:", sumError)
      } else if (sumTotal) {
        grandTotalItineraries = sumTotal.reduce((acc, currentRow) => acc + (currentRow.total_itineraries || 0), 0)
      }
      console.log(`✅ [ItineraryAgg] Gran Total Itinerarios (histórico): ${grandTotalItineraries}`)

      // 2. Itinerarios en el Rango Seleccionado (desde daily_itinerary_stats)
      const { data: sumInRange, error: sumInRangeError } = await supabase
        .from("daily_itinerary_stats")
        .select("total_itineraries")
        .gte("date", startDateString)
        .lte("date", endDateString)

      let itinerariesInSelectedRange = 0
      if (sumInRangeError) {
        console.error("[ItineraryAgg] Error sumando total_itineraries en rango:", sumInRangeError)
      } else if (sumInRange) {
        itinerariesInSelectedRange = sumInRange.reduce(
          (acc, currentRow) => acc + (currentRow.total_itineraries || 0),
          0,
        )
      }
      console.log(
        `✅ [ItineraryAgg] Itinerarios en rango (${startDateString} - ${endDateString}): ${itinerariesInSelectedRange}`,
      )

      // --- Las siguientes métricas siguen usando la tabla 'itineraries' ---
      // Esto podría ser inconsistente si 'itineraries' no refleja el total histórico.
      // Por ahora, las mantenemos así, pero es un punto a discutir si los números no cuadran.
      const { data: rawItineraries, error: rawItinerariesError } = await supabase
        .from("itineraries")
        .select("id, is_favorite, destination, created_at") // No necesitamos created_at para estas métricas específicas

      if (rawItinerariesError) {
        console.error(
          "[ItineraryAgg] Error obteniendo datos de la tabla 'itineraries' para favoritos/destinos:",
          rawItinerariesError,
        )
        return {
          totalItineraries: grandTotalItineraries,
          itinerariesInRange: itinerariesInSelectedRange,
          favoriteRate: "0",
          mostPopularDestinations: [],
        }
      }

      const totalRawItinerariesCount = rawItineraries?.length || 0 // Conteo de la tabla 'itineraries'

      // Tasa de favoritos (basada en la tabla 'itineraries')
      const favoriteItineraries = rawItineraries?.filter((itinerary) => itinerary.is_favorite).length || 0
      const favoriteRate =
        totalRawItinerariesCount > 0 ? ((favoriteItineraries / totalRawItinerariesCount) * 100).toFixed(1) : "0"
      console.log(
        `✅ [ItineraryAgg] Tasa de Favoritos (sobre ${totalRawItinerariesCount} registros de tabla 'itineraries'): ${favoriteRate}%`,
      )

      // Itinerarios creados HOY (todos los usuarios)
      const today = new Date().toISOString().split("T")[0]
      const itinerariesToday =
        rawItineraries?.filter((itinerary) => {
          const itineraryDate = new Date(itinerary.created_at).toISOString().split("T")[0]
          return itineraryDate === today
        }).length || 0

      console.log(`✅ [ItineraryAgg] Itinerarios creados HOY: ${itinerariesToday}`)

      // Destinos populares (basada en la tabla 'itineraries')
      const destinationCounts: { [key: string]: number } = {}
      rawItineraries?.forEach((itinerary) => {
        if (itinerary.destination) {
          destinationCounts[itinerary.destination] = (destinationCounts[itinerary.destination] || 0) + 1
        }
      })
      const mostPopularDestinations = Object.entries(destinationCounts)
        .map(([destination, count]) => ({ destination, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      console.log(
        `✅ [ItineraryAgg] Destinos Populares (sobre tabla 'itineraries'): ${mostPopularDestinations.length} encontrados.`,
      )

      return {
        totalItineraries: grandTotalItineraries, // Este es el nuevo "Total Global"
        itinerariesInRange: itinerariesInSelectedRange, // Este es el nuevo "Itinerarios en Periodo"
        itinerariesToday, // En lugar de favoriteRate
        mostPopularDestinations,
      }
    } catch (error) {
      console.error("[ItineraryAgg] Error crítico en getItineraryAggregatedStats:", error)
      return {
        totalItineraries: 0,
        itinerariesInRange: 0,
        favoriteRate: "0",
        mostPopularDestinations: [],
      }
    }
  }
}
