import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * 🎯 SERVICIO DE LÍMITES DE USUARIO
 * Maneja el cálculo dinámico de límites base + boosts activos
 */
export class UserLimitsService {
  /**
   * 📊 OBTENER LÍMITE REAL DEL USUARIO (base + boosts activos)
   */
  static async getUserRealLimit(userId: string): Promise<{
    baseLimit: number
    boostAmount: number
    realLimit: number
    activeBoosts: any[]
  }> {
    try {
      // Obtener datos base del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, monthly_itinerary_limit")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("❌ Error obteniendo datos del usuario:", userError)
        throw userError
      }

      // Calcular límite base según el rol (siempre usar el límite por defecto, no el campo monthly_itinerary_limit que puede estar contaminado)
      const baseLimit = this.getDefaultLimit(userData.role || "basic")

      // Obtener boosts activos (aprobados y NO expirados)
      const { data: activeBoosts, error: boostError } = await supabase
        .from("boost_requests")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "approved")
        .eq("expired", false) // Solo boosts NO expirados

      if (boostError) {
        console.error("❌ Error obteniendo boosts activos:", boostError)
        throw boostError
      }

      // Calcular boost total
      const boostAmount = activeBoosts?.reduce((sum, boost) => sum + (boost.itineraries_requested || 0), 0) || 0
      const realLimit = baseLimit + boostAmount

      console.log(`🔍 [UserLimitsService] Usuario ${userId}:`)
      console.log(`  - Límite base: ${baseLimit}`)
      console.log(`  - Boosts activos: ${activeBoosts?.length || 0}`)
      console.log(`  - Boost amount: ${boostAmount}`)
      console.log(`  - Límite real: ${realLimit}`)

      return {
        baseLimit,
        boostAmount,
        realLimit,
        activeBoosts: activeBoosts || [],
      }
    } catch (error) {
      console.error("❌ Error en getUserRealLimit:", error)
      // Fallback seguro
      return {
        baseLimit: 50,
        boostAmount: 0,
        realLimit: 50,
        activeBoosts: [],
      }
    }
  }

  /**
   * 📊 OBTENER LÍMITES PARA MÚLTIPLES USUARIOS (para reportes)
   */
  static async getUsersWithLimits(): Promise<any[]> {
    try {
      // Obtener todos los usuarios
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select(`
          id, email, name, role, 
          itineraries_created_this_month,
          monthly_itinerary_limit,
          created_at,
          last_month_reset
        `)
        .order("itineraries_created_this_month", { ascending: false })

      if (usersError) {
        console.error("❌ Error obteniendo usuarios:", usersError)
        throw usersError
      }

      // Obtener todos los boosts activos (aprobados y NO expirados)
      const { data: activeBoosts, error: activeBoostsError } = await supabase
        .from("boost_requests")
        .select("user_id, itineraries_requested, total_price, created_at")
        .eq("status", "approved")
        .eq("expired", false) // Solo boosts activos

      if (activeBoostsError) {
        console.error("❌ Error obteniendo boosts activos:", activeBoostsError)
        throw activeBoostsError
      }

      // Obtener todos los boosts expirados para el reporte
      const { data: expiredBoosts, error: expiredBoostsError } = await supabase
        .from("boost_requests")
        .select("user_id, itineraries_requested, total_price, created_at, expired_at")
        .eq("status", "approved")
        .eq("expired", true) // Solo boosts expirados

      if (expiredBoostsError) {
        console.error("❌ Error obteniendo boosts expirados:", expiredBoostsError)
        throw expiredBoostsError
      }

      // Agrupar boosts por usuario
      const activeBoostsByUser = (activeBoosts || []).reduce((acc, boost) => {
        if (!acc[boost.user_id]) {
          acc[boost.user_id] = []
        }
        acc[boost.user_id].push(boost)
        return acc
      }, {})

      const expiredBoostsByUser = (expiredBoosts || []).reduce((acc, boost) => {
        if (!acc[boost.user_id]) {
          acc[boost.user_id] = []
        }
        acc[boost.user_id].push(boost)
        return acc
      }, {})

      // Combinar datos de usuarios con sus boosts
      const usersWithLimits = users.map((user) => {
        const baseLimit = user.monthly_itinerary_limit || this.getDefaultLimit(user.role || "basic")
        const userActiveBoosts = activeBoostsByUser[user.id] || []
        const userExpiredBoosts = expiredBoostsByUser[user.id] || []
        const boostAmount = userActiveBoosts.reduce((sum, boost) => sum + (boost.itineraries_requested || 0), 0)
        const realLimit = baseLimit + boostAmount

        return {
          ...user,
          baseLimit,
          boostAmount,
          realLimit,
          activeBoosts: userActiveBoosts,
          expiredBoosts: userExpiredBoosts,
          hasActiveBoost: boostAmount > 0,
          hasExpiredBoosts: userExpiredBoosts.length > 0,
          used: user.itineraries_created_this_month || 0,
          percentage: realLimit > 0 ? Math.round(((user.itineraries_created_this_month || 0) / realLimit) * 100) : 0,
        }
      })

      console.log(`📊 [UserLimitsService] Procesados ${usersWithLimits.length} usuarios:`)
      console.log(`  - Con boosts activos: ${usersWithLimits.filter((u) => u.hasActiveBoost).length}`)
      console.log(`  - Con boosts expirados: ${usersWithLimits.filter((u) => u.hasExpiredBoosts).length}`)

      return usersWithLimits
    } catch (error) {
      console.error("❌ Error en getUsersWithLimits:", error)
      return []
    }
  }

  /**
   * 🏷️ OBTENER LÍMITE BASE SEGÚN ROL
   */
  static getDefaultLimit(role: string): number {
    switch (role) {
      case "micro":
        return 10
      case "basic":
        return 50
      case "pro":
        return 125
      case "enterprise":
        return 300
      case "admin":
        return 1000
      default:
        return 50
    }
  }

  /**
   * 📅 OBTENER MES SIGUIENTE
   */
  private static getNextMonth(currentMonth: string): string {
    const [year, month] = currentMonth.split("-").map(Number)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    return `${nextYear}-${nextMonth.toString().padStart(2, "0")}`
  }
}
