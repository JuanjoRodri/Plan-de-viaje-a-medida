import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Verificar que la petición viene del sistema interno
    const authHeader = request.headers.get("authorization")
    const internalSecret = process.env.CRON_SECRET

    if (authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { to, subject, title, shareUrl, hoursRemaining } = await request.json()

    // Validar campos requeridos
    if (!to || !subject || !title || !shareUrl || hoursRemaining === undefined) {
      return NextResponse.json(
        {
          error: "Campos requeridos: to, subject, title, shareUrl, hoursRemaining",
        },
        { status: 400 },
      )
    }

    // Crear el HTML del email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Tu enlace está próximo a expirar</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            
            <div class="warning">
              <strong>⚠️ Aviso importante:</strong> Tu enlace compartido está próximo a expirar.
            </div>
            
            <p><strong>Itinerario:</strong> "${title}"</p>
            <p><strong>Tiempo restante:</strong> Aproximadamente ${hoursRemaining} horas</p>
            <p><strong>Fecha de expiración:</strong> ${new Date(Date.now() + hoursRemaining * 60 * 60 * 1000).toLocaleString("es-ES")}</p>
            
            <p>Puedes acceder a tu enlace compartido aquí:</p>
            <a href="${shareUrl}" class="button">Ver Itinerario Compartido</a>
            
            <p>Si necesitas más tiempo, puedes renovar el enlace desde tu panel de control:</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/my-shared-itineraries" class="button">Gestionar Enlaces</a>
            
            <p>Si no deseas recibir más notificaciones como esta, puedes desactivarlas en tu perfil.</p>
            
            <div class="footer">
              <p>Este es un email automático del sistema de notificaciones.</p>
              <p>© ${new Date().getFullYear()} Personalizador de Viajes</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Construir el campo 'from' de forma más robusta
    const resendDomain = process.env.RESEND_DOMAIN
    let fromEmail

    if (resendDomain && resendDomain.includes("@")) {
      // Si RESEND_DOMAIN ya incluye el @, usarlo directamente
      fromEmail = `Personalizador de Viajes <${resendDomain}>`
    } else if (resendDomain) {
      // Si es solo el dominio, construir el email
      fromEmail = `Personalizador de Viajes <noreply@${resendDomain}>`
    } else {
      // Fallback a un email simple sin dominio personalizado
      fromEmail = "noreply@plandeviajeamedida.com"
    }

    console.log(`📧 Enviando email desde: ${fromEmail} hacia: ${to}`)

    // Enviar email usando Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error("❌ Error enviando email con Resend:", errorData)
      return NextResponse.json(
        {
          error: "Error enviando email",
          details: errorData,
        },
        { status: 500 },
      )
    }

    const result = await resendResponse.json()
    console.log(`✅ Email enviado exitosamente a ${to} - ID: ${result.id}`)

    return NextResponse.json({
      success: true,
      message: "Email enviado exitosamente",
      emailId: result.id,
    })
  } catch (error) {
    console.error("❌ Error en /api/notifications/send:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
