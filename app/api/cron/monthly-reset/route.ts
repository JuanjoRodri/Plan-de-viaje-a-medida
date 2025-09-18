import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { EmailService } from "@/app/services/email-service"
import { UserLimitsService } from "@/app/services/user-limits-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  // Verificar autorización
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}` && request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("🔄 [MONTHLY RESET] Iniciando reinicio mensual...")

  try {
    const startTime = new Date()
    const currentMonth = startTime.toISOString().substring(0, 7) // "2024-01"

    // Obtener zona horaria española
    const spanishTime = new Date().toLocaleString("es-ES", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    console.log(`📅 [MONTHLY RESET] Fecha española: ${spanishTime}`)
    console.log(`📅 [MONTHLY RESET] Mes actual: ${currentMonth}`)

    // 1. GENERAR REPORTE PRE-REINICIO (con sistema mejorado de boosts)
    console.log("📊 [MONTHLY RESET] Generando reporte pre-reinicio...")
    const reportData = await generatePreResetReport()

    console.log(`📊 [MONTHLY RESET] Reporte generado:`)
    console.log(`  Total usuarios: ${reportData.summary.totalUsers}`)
    console.log(`  Usuarios activos: ${reportData.summary.activeUsers}`)
    console.log(`  Usuarios con boost activo: ${reportData.summary.usersWithActiveBoost}`)
    console.log(`  Usuarios con boost expirado: ${reportData.summary.usersWithExpiredBoosts}`)
    console.log(`  Total itinerarios: ${reportData.summary.totalItinerarios}`)

    // 2. EJECUTAR RESET MENSUAL CON GUARDADO DE BOOSTS
    console.log("🔄 [MONTHLY RESET] Ejecutando reset con guardado de boosts...")
    const resetResult = await executeUserResetWithBoostSaving(currentMonth)

    console.log(`✅ [MONTHLY RESET] Reset completado:`)
    console.log(`  Usuarios procesados: ${resetResult.usersProcessed}`)
    console.log(`  Usuarios actualizados: ${resetResult.usersUpdated}`)
    console.log(`  Boosts expirados: ${resetResult.boostsExpired}`)
    console.log(`  Itinerarios de boost guardados: ${resetResult.boostItinerariesSaved}`)

    // 3. ENVIAR EMAIL CON REPORTE
    console.log("📧 [MONTHLY RESET] Enviando reporte por email...")
    let emailResult = { success: false, error: "No implementado" }

    try {
      emailResult = await EmailService.sendMonthlyResetReport(reportData, spanishTime)
      console.log(`📧 [MONTHLY RESET] Resultado email: ${emailResult.success ? "✅ Enviado" : "❌ Error"}`)
      if (!emailResult.success) {
        console.error("❌ [MONTHLY RESET] Error enviando reporte:", emailResult.error)
      }
    } catch (emailError) {
      console.error("❌ [MONTHLY RESET] Error en servicio de email:", emailError)
      emailResult = { success: false, error: emailError.message }
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()

    const finalResult = {
      success: true,
      message: "Reinicio mensual completado con guardado de boosts",
      usersProcessed: resetResult.usersProcessed,
      usersUpdated: resetResult.usersUpdated,
      boostsExpired: resetResult.boostsExpired,
      boostItinerariesSaved: resetResult.boostItinerariesSaved,
      emailSent: emailResult.success,
      duration: `${duration}ms`,
      timestamp: spanishTime,
      currentMonth: currentMonth,
      detailed_results: {
        pre_reset_report: reportData.summary,
        email_result: emailResult,
        reset_result: resetResult,
      },
    }

    console.log(`📊 [MONTHLY RESET] Resumen final:`)
    console.log(`  Usuarios procesados: ${resetResult.usersProcessed}`)
    console.log(`  Usuarios actualizados: ${resetResult.usersUpdated}`)
    console.log(`  Boosts expirados: ${resetResult.boostsExpired}`)
    console.log(`  Itinerarios guardados: ${resetResult.boostItinerariesSaved}`)
    console.log(`  Email enviado: ${emailResult.success}`)
    console.log(`  Duración: ${duration}ms`)

    return NextResponse.json(finalResult)
  } catch (error) {
    console.error("❌ [MONTHLY RESET] Error catastrófico:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

/**
 * 📊 GENERAR REPORTE PRE-REINICIO - VERSIÓN MEJORADA CON BOOSTS DINÁMICOS
 */
async function generatePreResetReport() {
  try {
    console.log("🔍 [MONTHLY RESET] Obteniendo datos de usuarios con límites dinámicos...")

    // Usar el nuevo servicio para obtener usuarios con límites reales
    const usersWithLimits = await UserLimitsService.getUsersWithLimits()

    console.log(`📋 [MONTHLY RESET] Usuarios encontrados: ${usersWithLimits.length}`)

    // Calcular estadísticas generales
    const totalUsers = usersWithLimits.length
    const activeUsers = usersWithLimits.filter((u) => u.used > 0).length
    const usersWithActiveBoost = usersWithLimits.filter((u) => u.hasActiveBoost).length
    const usersWithExpiredBoosts = usersWithLimits.filter((u) => u.hasExpiredBoosts).length
    const totalItinerarios = usersWithLimits.reduce((sum, u) => sum + u.used, 0)
    const totalActiveBoostItinerarios = usersWithLimits.reduce((sum, u) => sum + u.boostAmount, 0)
    const averagePerUser = totalUsers > 0 ? (totalItinerarios / totalUsers).toFixed(2) : "0"

    // Usuarios por rol
    const usersByRole = usersWithLimits.reduce((acc, user) => {
      const role = user.role || "basic"
      if (!acc[role]) acc[role] = { count: 0, itineraries: 0, withActiveBoost: 0, withExpiredBoosts: 0 }
      acc[role].count++
      acc[role].itineraries += user.used
      if (user.hasActiveBoost) acc[role].withActiveBoost++
      if (user.hasExpiredBoosts) acc[role].withExpiredBoosts++
      return acc
    }, {})

    // Top usuarios más activos
    const topUsers = usersWithLimits
      .filter((u) => u.used > 0)
      .slice(0, 10)
      .map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        used: u.used,
        baseLimit: u.baseLimit,
        boostAmount: u.boostAmount,
        realLimit: u.realLimit,
        percentage: u.percentage,
        hasActiveBoost: u.hasActiveBoost,
        hasExpiredBoosts: u.hasExpiredBoosts,
      }))

    // Usuarios que alcanzaron el límite
    const limitReachedUsers = usersWithLimits.filter((u) => u.used >= u.realLimit)

    // Usuarios con boosts activos (que se van a expirar)
    const usersWithActiveBoosts = usersWithLimits
      .filter((u) => u.hasActiveBoost)
      .map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        baseLimit: u.baseLimit,
        boostAmount: u.boostAmount,
        realLimit: u.realLimit,
        used: u.used,
        percentage: u.percentage,
        activeBoosts: u.activeBoosts,
        totalBoostPrice: u.activeBoosts.reduce((sum, boost) => sum + (boost.total_price || 0), 0),
      }))

    // Usuarios con boosts expirados (histórico)
    const expiredBoostUsers = usersWithLimits
      .filter((u) => u.hasExpiredBoosts)
      .map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        expiredBoosts: u.expiredBoosts,
        totalExpiredBoostPrice: u.expiredBoosts.reduce((sum, boost) => sum + (boost.total_price || 0), 0),
        expiredBoostAmount: u.expiredBoosts.reduce((sum, boost) => sum + (boost.itineraries_requested || 0), 0),
      }))

    const reportData = {
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        usersWithActiveBoost,
        usersWithExpiredBoosts,
        totalItinerarios,
        totalActiveBoostItinerarios,
        averagePerUser,
      },
      usersByRole,
      topUsers,
      limitReachedUsers: limitReachedUsers.map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        used: u.used,
        baseLimit: u.baseLimit,
        boostAmount: u.boostAmount,
        realLimit: u.realLimit,
        hasActiveBoost: u.hasActiveBoost,
        hasExpiredBoosts: u.hasExpiredBoosts,
      })),
      usersWithActiveBoosts,
      expiredBoostUsers,
      allUsers: usersWithLimits.map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        used: u.used,
        baseLimit: u.baseLimit,
        boostAmount: u.boostAmount,
        realLimit: u.realLimit,
        hasActiveBoost: u.hasActiveBoost,
        hasExpiredBoosts: u.hasExpiredBoosts,
        percentage: u.percentage,
        lastReset: u.last_month_reset,
        memberSince: u.created_at,
      })),
    }

    console.log("✅ [MONTHLY RESET] Reporte generado correctamente")
    return reportData
  } catch (error) {
    console.error("❌ [MONTHLY RESET] Error generando reporte:", error)
    throw error
  }
}

/**
 * 🔄 EJECUTAR RESET MENSUAL CON GUARDADO DE BOOSTS - VERSIÓN CORREGIDA Y SIMPLIFICADA
 */
async function executeUserResetWithBoostSaving(currentMonth: string) {
  try {
    console.log("🔍 [MONTHLY RESET] Obteniendo datos para reset...")

    // 1. Obtener todos los usuarios
    const { data: users, error: fetchError } = await supabase.from("users").select(`
      id, email, role, 
      itineraries_created_this_month, 
      boost_itineraries_saved
    `)
    if (fetchError) throw fetchError

    // 2. Obtener TODOS los boosts activos de UNA SOLA VEZ (más eficiente)
    const { data: allActiveBoosts, error: boostError } = await supabase
      .from("boost_requests")
      .select("id, user_id, itineraries_requested")
      .eq("status", "approved")
      .eq("expired", false)
    if (boostError) throw boostError

    // Agrupar boosts por usuario para fácil acceso
    const boostsByUser = allActiveBoosts.reduce((acc, boost) => {
      if (!acc[boost.user_id]) acc[boost.user_id] = []
      acc[boost.user_id].push(boost)
      return acc
    }, {})

    console.log(`🔄 [MONTHLY RESET] Procesando ${users.length} usuarios y ${allActiveBoosts.length} boosts activos...`)

    let successCount = 0
    let errorCount = 0
    let totalBoostItinerariesSavedThisMonth = 0
    const boostsToExpire = []

    // 3. Procesar cada usuario
    for (const user of users) {
      try {
        const baseLimit = UserLimitsService.getDefaultLimit(user.role)
        const monthlyUsed = user.itineraries_created_this_month || 0
        const previouslySavedBoosts = user.boost_itineraries_saved || 0

        const userActiveBoosts = boostsByUser[user.id] || []
        let newBoostsToSave = 0
        let remainingSavedBoosts = previouslySavedBoosts

        if (userActiveBoosts.length > 0) {
          boostsToExpire.push(...userActiveBoosts.map((b) => b.id))
          const totalBoostAvailable = userActiveBoosts.reduce((sum, b) => sum + (b.itineraries_requested || 0), 0)

          // Lógica de consumo: Base -> Guardados -> Activos
          const consumedBeyondBase = Math.max(0, monthlyUsed - baseLimit)

          const consumedFromSaved = Math.min(consumedBeyondBase, previouslySavedBoosts)
          remainingSavedBoosts = previouslySavedBoosts - consumedFromSaved

          const consumedFromActive = Math.max(0, consumedBeyondBase - consumedFromSaved)
          newBoostsToSave = Math.max(0, totalBoostAvailable - consumedFromActive)
        }

        const newTotalSaved = remainingSavedBoosts + newBoostsToSave

        const { error: updateError } = await supabase
          .from("users")
          .update({
            itineraries_created_this_month: 0,
            itineraries_created_today: 0,
            last_month_reset: currentMonth,
            limit_warning_sent_this_month: false,
            boost_itineraries_saved: newTotalSaved,
          })
          .eq("id", user.id)

        if (updateError) {
          console.error(`❌ Error actualizando usuario ${user.email}:`, updateError)
          errorCount++
        } else {
          successCount++
          totalBoostItinerariesSavedThisMonth += newBoostsToSave
          if (newBoostsToSave > 0) {
            console.log(
              `💾 Usuario ${user.email}: ${newBoostsToSave} itinerarios de boost guardados. Total ahora: ${newTotalSaved}`,
            )
          }
        }
      } catch (userError) {
        console.error(`❌ Error procesando usuario ${user.id}:`, userError)
        errorCount++
      }
    }

    // 4. Expirar todos los boosts procesados de UNA SOLA VEZ
    if (boostsToExpire.length > 0) {
      console.log(` expiring ${boostsToExpire.length} boosts...`)
      await supabase
        .from("boost_requests")
        .update({ expired: true, expired_at: new Date().toISOString() })
        .in("id", boostsToExpire)
    }

    return {
      usersProcessed: users.length,
      usersUpdated: successCount,
      usersWithErrors: errorCount,
      boostsExpired: boostsToExpire.length,
      boostItinerariesSaved: totalBoostItinerariesSavedThisMonth,
      success: successCount > 0,
    }
  } catch (error) {
    console.error("❌ [MONTHLY RESET] Error ejecutando reset con guardado:", error)
    throw error
  }
}
