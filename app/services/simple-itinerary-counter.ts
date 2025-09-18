import { createClient } from "@supabase/supabase-js"
import { UserLimitsService } from "./user-limits-service"
import { EmailService } from "./email-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * 🔢 CONTADOR SIMPLE DE ITINERARIOS
 * Maneja incrementos, límites y notificaciones de manera eficiente
 */
export class SimpleItineraryCounter {
  /**
   * [_calculateUserStatus description]
   * @param  userId [description]
   * @return [description]
   */
  private static async _calculateUserStatus(userId: string) {
    const { baseLimit, boostAmount } = await UserLimitsService.getUserRealLimit(userId)

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "itineraries_created_this_month, itineraries_created_today, boost_itineraries_saved, email, name, role, limit_warning_sent_this_month",
      )
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("❌ Error obteniendo datos del usuario para calcular estado:", userError)
      throw userError
    }

    const used = userData.itineraries_created_this_month || 0
    const remainingSaved = userData.boost_itineraries_saved || 0
    const monthlyLimit = baseLimit + boostAmount
    const consumedFromSaved = Math.max(0, used - monthlyLimit)
    const initialSaved = remainingSaved + consumedFromSaved
    const totalAvailable = monthlyLimit + initialSaved

    return {
      userData,
      used,
      baseLimit,
      boostAmount,
      monthlyLimit,
      totalAvailable,
      initialSaved,
      remainingSaved,
      consumedFromSaved,
    }
  }

  /**
   * ➕ INCREMENTAR CONTADOR DE ITINERARIOS
   */
  static async incrementItinerary(userId: string) {
    try {
      const { userData, used, baseLimit, monthlyLimit, totalAvailable, initialSaved, consumedFromSaved } =
        await this._calculateUserStatus(userId)

      const currentUsed = used

      // 3. VERIFICAR SI PUEDE CREAR MÁS ITINERARIOS
      if (currentUsed >= totalAvailable) {
        console.log(`🚫 [SimpleItineraryCounter] Límite alcanzado: ${currentUsed}/${totalAvailable}`)
        return {
          success: false,
          canCreate: false,
          used: currentUsed,
          limit: totalAvailable,
          percentage: 100,
          message: `Has alcanzado tu límite de ${totalAvailable} itinerarios este mes.`,
          limitReached: true,
        }
      }

      const newUsed = currentUsed + 1

      // 4. DETERMINAR QUÉ TIPO DE ITINERARIO CONSUMIR Y ACTUALIZAR
      const updateData: any = {
        itineraries_created_this_month: newUsed,
        itineraries_created_today: (userData.itineraries_created_today || 0) + 1,
      }

      // Lógica de consumo: Plan Mensual (base + boosts) -> Guardados
      if (currentUsed >= monthlyLimit) {
        // Está consumiendo del pool de guardados
        const newRemainingSaved = initialSaved - (consumedFromSaved + 1)
        updateData.boost_itineraries_saved = newRemainingSaved
        console.log(`💾 [SimpleItineraryCounter] Consumiendo itinerario guardado. Restantes: ${newRemainingSaved}`)
      } else {
        // Está consumiendo del plan mensual (base o boosts activos)
        console.log(`🏠 [SimpleItineraryCounter] Consumiendo del plan mensual (${newUsed}/${monthlyLimit})`)
      }

      const { error: updateError } = await supabase.from("users").update(updateData).eq("id", userId)

      if (updateError) {
        console.error("❌ Error actualizando contadores:", updateError)
        throw updateError
      }

      const newPercentage = Math.round((newUsed / totalAvailable) * 100)
      console.log(`✅ [SimpleItineraryCounter] Incrementado: ${newUsed}/${totalAvailable} (${newPercentage}%)`)

      // 5. VERIFICAR SI NECESITA ENVIAR WARNING EMAIL (80% o más)
      let warningEmailSent = false
      if (newPercentage >= 80 && !userData.limit_warning_sent_this_month) {
        console.log(`⚠️ [SimpleItineraryCounter] Enviando email de advertencia (${newPercentage}%)`)
        try {
          const planName = this.getPlanName(userData.role, baseLimit !== monthlyLimit)
          const emailResult = await EmailService.sendLimitWarningEmail(
            userData.email,
            userData.name,
            newUsed,
            totalAvailable,
            newPercentage,
            planName,
          )
          if (emailResult.success) {
            await supabase.from("users").update({ limit_warning_sent_this_month: true }).eq("id", userId)
            warningEmailSent = true
            console.log(`✅ [SimpleItineraryCounter] Email de advertencia enviado`)
          }
        } catch (emailError) {
          console.error("❌ Error enviando email de advertencia:", emailError)
        }
      }

      return {
        success: true,
        canCreate: newUsed < totalAvailable,
        used: newUsed,
        limit: totalAvailable,
        percentage: newPercentage,
        message: `Itinerario ${newUsed}/${totalAvailable} creado exitosamente.`,
        limitReached: newUsed >= totalAvailable,
        warningEmailSent,
      }
    } catch (error) {
      console.error("❌ Error en incrementItinerary:", error)
      return {
        success: false,
        canCreate: false,
        used: 0,
        limit: 50,
        percentage: 0,
        message: "Error interno del servidor al incrementar",
        limitReached: true,
      }
    }
  }

  /**
   * 📊 OBTENER ESTADO ACTUAL DEL USUARIO
   */
  static async getUserStatus(userId: string) {
    try {
      const {
        used,
        baseLimit,
        boostAmount,
        monthlyLimit,
        totalAvailable,
        initialSaved,
        remainingSaved,
        consumedFromSaved,
      } = await this._calculateUserStatus(userId)

      const percentage = totalAvailable > 0 ? Math.round((used / totalAvailable) * 100) : 0

      return {
        used,
        baseLimit,
        boostAmount,
        monthlyLimit,
        totalAvailable,
        percentage,
        canCreate: used < totalAvailable,
        hasActiveBoosts: boostAmount > 0,
        activeBoosts: [],
        initialSaved,
        remainingSaved,
        consumedFromSaved,
      }
    } catch (error) {
      console.error("❌ Error en getUserStatus:", error)
      return {
        used: 0,
        baseLimit: 50,
        boostAmount: 0,
        monthlyLimit: 50,
        totalAvailable: 50,
        percentage: 0,
        canCreate: true,
        hasActiveBoosts: false,
        activeBoosts: [],
        initialSaved: 0,
        remainingSaved: 0,
        consumedFromSaved: 0,
      }
    }
  }

  /**
   * 🏷️ OBTENER NOMBRE DEL PLAN
   */
  private static getPlanName(role: string, hasBoost: boolean): string {
    const basePlan = role?.charAt(0).toUpperCase() + role?.slice(1) || "Basic"
    return hasBoost ? `${basePlan} + Boost` : basePlan
  }

  /**
   * ✅ VERIFICAR LÍMITES (compatibilidad con actions.ts)
   */
  static async checkLimits(userId: string) {
    try {
      const status = await this.getUserStatus(userId)
      return {
        canGenerate: status.canCreate,
        used: status.used,
        limit: status.totalAvailable,
        message: status.canCreate
          ? undefined
          : `Has alcanzado tu límite total de ${status.totalAvailable} itinerarios este mes (incluyendo los guardados).`,
      }
    } catch (error) {
      console.error("❌ Error en checkLimits:", error)
      return {
        canGenerate: false,
        used: 0,
        limit: 50,
        message: "Error interno del servidor al verificar límites",
      }
    }
  }

  /**
   * ➕ INCREMENTAR CONTADORES (compatibilidad con actions.ts)
   */
  static async incrementCounters(userId: string) {
    try {
      const result = await this.incrementItinerary(userId)
      if (!result.success) {
        console.error(`❌ [SimpleItineraryCounter] Falló el incremento para ${userId}: ${result.message}`)
      }
      return result
    } catch (error: any) {
      console.error("❌ Error catastrófico en incrementCounters:", error)
      return {
        success: false,
        canCreate: false,
        used: 0,
        limit: 0,
        percentage: 0,
        message: `Error interno del servidor: ${error.message}`,
        limitReached: true,
      }
    }
  }
}
