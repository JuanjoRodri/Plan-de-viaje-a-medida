export class NotificationEmailService {
  static async sendExpirationNotification(
    userEmail: string,
    itineraryTitle: string,
    shareUrl: string,
    hoursRemaining: number,
  ) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET}`, // Autenticación interna
        },
        body: JSON.stringify({
          to: userEmail,
          subject: `⏰ Tu enlace "${itineraryTitle}" expira en ${hoursRemaining} horas`,
          title: itineraryTitle,
          shareUrl: shareUrl,
          hoursRemaining: hoursRemaining,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Notificación enviada a ${userEmail} - Email ID: ${result.emailId}`)
        return { success: true, emailId: result.emailId }
      } else {
        const errorData = await response.json()
        console.error(`❌ Error enviando notificación a ${userEmail}:`, errorData)
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error("❌ Error en sendExpirationNotification:", error)
      return { success: false, error: error.message }
    }
  }
}
