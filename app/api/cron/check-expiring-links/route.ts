import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: Request) {
  // Verificar autorización
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}` && request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("🔍 Revisando enlaces próximos a expirar...")

  // VERIFICAR VARIABLES DE ENTORNO CRÍTICAS
  console.log("🔧 Verificando variables de entorno:")
  console.log(`  NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL ? "✅ Definida" : "❌ NO DEFINIDA"}`)
  console.log(`  CRON_SECRET: ${process.env.CRON_SECRET ? "✅ Definida" : "❌ NO DEFINIDA"}`)
  console.log(`  RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "✅ Definida" : "❌ NO DEFINIDA"}`)
  console.log(`  RESEND_DOMAIN: ${process.env.RESEND_DOMAIN ? "✅ Definida" : "❌ NO DEFINIDA"}`)

  try {
    const { data: links, error } = await supabase
      .from("shared_itineraries")
      .select(`
        id, title, expires_at, user_id, notifications_enabled, notification_sent_at,
        users!inner(email, notification_email, email_notifications_enabled, notification_hours_before)
      `)
      .eq("is_active", true)
      .eq("notifications_enabled", true)
      .not("expires_at", "is", null)

    if (error) {
      console.error("❌ Error obteniendo enlaces:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`📋 Enlaces encontrados: ${links?.length || 0}`)

    let notificationsSent = 0
    const detailedResults = []
    const now = new Date()

    for (const link of links || []) {
      const user = link.users
      const linkResult = {
        link_id: link.id,
        link_title: link.title,
        user_email: user.email,
        status: "processing",
        reason: "",
        error_details: null,
      }

      console.log(`\n🔄 Procesando enlace: ${link.id} - ${link.title}`)

      // Verificar notificaciones del usuario
      if (!user.email_notifications_enabled) {
        linkResult.status = "skipped"
        linkResult.reason = "Usuario tiene notificaciones deshabilitadas"
        console.log(`🚫 ${linkResult.reason}`)
        detailedResults.push(linkResult)
        continue
      }

      // Calcular tiempos
      const expiresAt = new Date(link.expires_at)
      const notificationHours = user.notification_hours_before || 12
      const targetNotificationTime = new Date(expiresAt.getTime() - notificationHours * 60 * 60 * 1000)
      const lastNotificationSentTime = link.notification_sent_at ? new Date(link.notification_sent_at).getTime() : 0

      console.log(`⏰ Tiempos calculados:`)
      console.log(`  Ahora: ${now.toISOString()}`)
      console.log(`  Expira: ${expiresAt.toISOString()}`)
      console.log(`  Target notificación: ${targetNotificationTime.toISOString()}`)
      console.log(`  Última notificación: ${link.notification_sent_at || "Nunca"}`)

      // Verificar condiciones de tiempo
      const condition1 = now.getTime() >= targetNotificationTime.getTime()
      const condition2 = lastNotificationSentTime < targetNotificationTime.getTime()

      console.log(`🔍 Condiciones:`)
      console.log(`  Condición 1 (now >= target): ${condition1}`)
      console.log(`  Condición 2 (lastSent < target): ${condition2}`)

      if (condition1 && condition2) {
        const currentHoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        console.log(`⏳ Horas restantes: ${currentHoursRemaining.toFixed(2)}`)

        if (currentHoursRemaining > 0) {
          const userEmail = user.notification_email || user.email
          const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${link.id}`

          console.log(`📧 Intentando enviar email a: ${userEmail}`)
          console.log(`🔗 URL del enlace: ${shareUrl}`)

          // LLAMADA DIRECTA AL ENDPOINT EN LUGAR DE USAR EL SERVICIO
          try {
            const emailPayload = {
              to: userEmail,
              subject: `⏰ Tu enlace "${link.title}" expira en ${Math.ceil(currentHoursRemaining)} horas`,
              title: link.title || "Itinerario compartido",
              shareUrl: shareUrl,
              hoursRemaining: Math.max(1, Math.ceil(currentHoursRemaining)),
            }

            console.log(`📤 Payload del email:`, JSON.stringify(emailPayload, null, 2))

            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.CRON_SECRET}`,
              },
              body: JSON.stringify(emailPayload),
            })

            console.log(`📬 Respuesta del endpoint de email: Status ${emailResponse.status}`)

            if (emailResponse.ok) {
              const emailResult = await emailResponse.json()
              console.log(`✅ Email enviado exitosamente:`, emailResult)

              // Actualizar base de datos
              const { error: updateError } = await supabase
                .from("shared_itineraries")
                .update({ notification_sent_at: new Date().toISOString() })
                .eq("id", link.id)

              if (updateError) {
                console.error(`❌ Error actualizando BD:`, updateError)
                linkResult.status = "email_sent_but_db_update_failed"
                linkResult.error_details = updateError
              } else {
                console.log(`✅ Base de datos actualizada correctamente`)
                linkResult.status = "success"
                notificationsSent++
              }
            } else {
              const errorText = await emailResponse.text()
              console.error(`❌ Error en endpoint de email:`, errorText)
              linkResult.status = "email_failed"
              linkResult.error_details = errorText
            }
          } catch (fetchError) {
            console.error(`❌ Error en fetch al endpoint de email:`, fetchError)
            linkResult.status = "fetch_failed"
            linkResult.error_details = fetchError.message
          }
        } else {
          linkResult.status = "expired"
          linkResult.reason = "El enlace ya expiró"
          console.log(`⏳ ${linkResult.reason}`)
        }
      } else {
        linkResult.status = "time_conditions_not_met"
        linkResult.reason = `Condiciones de tiempo no cumplidas (C1: ${condition1}, C2: ${condition2})`
        console.log(`🚦 ${linkResult.reason}`)
      }

      detailedResults.push(linkResult)
    }

    console.log(`\n📊 Resumen final:`)
    console.log(`  Total enlaces procesados: ${links?.length || 0}`)
    console.log(`  Notificaciones enviadas: ${notificationsSent}`)

    return NextResponse.json({
      success: true,
      message: `Revisión completada. ${notificationsSent} notificaciones enviadas.`,
      notificationsSent,
      totalLinksChecked: links?.length || 0,
      detailed_results: detailedResults,
      environment_check: {
        base_url: !!process.env.NEXT_PUBLIC_BASE_URL,
        cron_secret: !!process.env.CRON_SECRET,
        resend_api_key: !!process.env.RESEND_API_KEY,
        resend_domain: !!process.env.RESEND_DOMAIN,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error catastrófico en check-expiring-links:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
