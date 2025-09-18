import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { DailyStatsService } from "./daily-stats-service"

// Tipos para los eventos de analytics
export type AnalyticsEventType =
  | "page_view"
  | "itinerary_generated"
  | "itinerary_saved"
  | "itinerary_favorited"
  | "itinerary_unfavorited"
  | "user_login"
  | "user_logout"
  | "search_performed"
  | "filter_applied"
  | "error_occurred"
  | "form_submitted"
  | "button_clicked"
  | "modal_opened"

interface AnalyticsEventData {
  [key: string]: any
}

export class AnalyticsService {
  /**
   * Registra un evento de analytics
   */
  static async trackEvent(
    eventType: AnalyticsEventType,
    userId?: string | null,
    eventData: AnalyticsEventData = {},
    sessionId?: string,
    request?: Request,
  ): Promise<void> {
    try {
      const supabase = await this.getSupabaseClient()
      if (!supabase) {
        console.error("No se pudo obtener el cliente de Supabase para analytics")
        return
      }

      const session = sessionId || uuidv4()

      let ipAddress: string | null = null
      let userAgent: string | null = null
      let pageUrl: string | null = null
      let referrer: string | null = null

      if (request) {
        const forwardedFor = request.headers.get("x-forwarded-for")
        if (forwardedFor) {
          ipAddress = forwardedFor.split(",")[0].trim()
        }
        userAgent = request.headers.get("user-agent")
        try {
          const url = new URL(request.url)
          pageUrl = url.pathname
          referrer = request.headers.get("referer")
        } catch (e) {
          console.error("Error parsing URL from request:", e)
        }
      }

      const { error } = await supabase.from("analytics_events").insert({
        event_type: eventType,
        user_id: userId || null,
        event_data: eventData,
        session_id: session,
        ip_address: ipAddress,
        user_agent: userAgent,
        page_url: pageUrl,
        referrer: referrer,
      })

      if (error) {
        console.error("Error registrando evento de analytics:", error)
      } else {
        console.log(`Analytics: ${eventType} event tracked successfully`)
      }
    } catch (error) {
      console.error("Error en trackEvent:", error)
    }
  }

  /**
   * Obtiene métricas del dashboard usando el nuevo sistema de estadísticas diarias
   */
  static async getDashboardMetrics(dateRange: "week" | "month" | "year" = "month") {
    try {
      const supabase = await this.getSupabaseClient()
      if (!supabase) {
        console.error("No se pudo obtener el cliente de Supabase para analytics")
        return null
      }

      // Calcular fechas para el rango
      const endDate = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          break
        case "month":
          startDate.setDate(startDate.getDate() - 30)
          break
        case "year":
          startDate.setDate(startDate.getDate() - 365)
          break
      }

      // Consultas en paralelo
      const [
        totalUsersResult,
        activeUsersResult,
        totalItinerariesResult,
        itinerariesThisMonthResult,
        itinerariesLastWeekResult,
        favoriteRateResult,
        dailyItinerariesStats,
        popularDestinationsResult,
      ] = await Promise.all([
        // Total de usuarios
        supabase
          .from("users")
          .select("id", { count: "exact" }),

        // Usuarios activos en el período
        supabase
          .from("analytics_events")
          .select("user_id")
          .gte("created_at", startDate.toISOString())
          .not("user_id", "is", null)
          .limit(10000),

        // Total de itinerarios
        supabase
          .from("itineraries")
          .select("id", { count: "exact" }),

        // Itinerarios este mes
        supabase
          .from("itineraries")
          .select("id", { count: "exact" })
          .gte("created_at", new Date(new Date().setDate(1)).toISOString()),

        // Itinerarios última semana
        supabase
          .from("itineraries")
          .select("id", { count: "exact" })
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

        // Tasa de favoritos
        supabase
          .from("itineraries")
          .select("id, is_favorite"),

        // ✅ NUEVA LÓGICA: Usar estadísticas diarias combinadas
        DailyStatsService.getCombinedDailyStats(startDate, endDate),

        // Destinos populares
        supabase
          .from("itineraries")
          .select("destination, id")
          .gte("created_at", startDate.toISOString()),
      ])

      // Procesar resultados
      const totalUsers = totalUsersResult.count || 0

      // Contar usuarios únicos activos
      const activeUserIds = new Set()
      activeUsersResult.data?.forEach((event) => {
        if (event.user_id) activeUserIds.add(event.user_id)
      })
      const activeUsers = activeUserIds.size

      const totalItineraries = totalItinerariesResult.count || 0
      const itinerariesThisMonth = itinerariesThisMonthResult.count || 0
      const itinerariesLastWeek = itinerariesLastWeekResult.count || 0

      // Calcular tasa de favoritos
      let favoriteCount = 0
      favoriteRateResult.data?.forEach((itinerary) => {
        if (itinerary.is_favorite) favoriteCount++
      })
      const favoriteRate = favoriteRateResult.data?.length
        ? Math.round((favoriteCount / favoriteRateResult.data.length) * 100)
        : 0

      // Calcular promedio de itinerarios por usuario
      const avgItinerariesPerUser = totalUsers ? Math.round((totalItineraries / totalUsers) * 10) / 10 : 0

      // ✅ PROCESAR ESTADÍSTICAS DIARIAS COMBINADAS
      const dailyItineraries = dailyItinerariesStats.map((stat: any) => ({
        date: stat.date,
        count: stat.count,
      }))

      // Procesar destinos populares
      const destinationCounts: { [key: string]: number } = {}
      popularDestinationsResult.data?.forEach((itinerary) => {
        if (itinerary.destination && itinerary.destination.trim() !== "") {
          const destination = itinerary.destination.trim()
          destinationCounts[destination] = (destinationCounts[destination] || 0) + 1
        }
      })

      const mostPopularDestinations = Object.entries(destinationCounts)
        .map(([destination, count]) => ({ destination, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Construir objeto de métricas
      const metrics = {
        totalUsers,
        activeUsers,
        totalItineraries,
        itinerariesThisMonth,
        itinerariesLastWeek,
        avgItinerariesPerUser,
        favoriteRate,
        dailyItineraries,
        mostPopularDestinations,
      }

      return metrics
    } catch (error) {
      console.error("Error obteniendo métricas del dashboard:", error)
      return null
    }
  }

  /**
   * Obtiene eventos de analytics para un rango de fechas
   */
  static async getEvents(options: {
    startDate?: Date
    endDate?: Date
    eventType?: AnalyticsEventType
    userId?: string
    limit?: number
    page?: number
  }) {
    try {
      const supabase = await this.getSupabaseClient()
      if (!supabase) return { data: [], count: 0 }

      const { startDate, endDate, eventType, userId, limit = 50, page = 1 } = options

      let query = supabase.from("analytics_events").select("*", { count: "exact" })

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("created_at", endDate.toISOString())
      }

      if (eventType) {
        query = query.eq("event_type", eventType)
      }

      if (userId) {
        query = query.eq("user_id", userId)
      }

      // Paginación
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order("created_at", { ascending: false })

      const { data, count, error } = await query

      if (error) {
        console.error("Error obteniendo eventos:", error)
        return { data: [], count: 0 }
      }

      return { data: data || [], count: count || 0 }
    } catch (error) {
      console.error("Error en getEvents:", error)
      return { data: [], count: 0 }
    }
  }

  /**
   * Obtiene un cliente de Supabase para analytics
   */
  private static async getSupabaseClient() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error("Faltan credenciales de Supabase para analytics")
        return null
      }

      return createClient(supabaseUrl, supabaseKey)
    } catch (error) {
      console.error("Error creando cliente de Supabase:", error)
      return null
    }
  }
}
