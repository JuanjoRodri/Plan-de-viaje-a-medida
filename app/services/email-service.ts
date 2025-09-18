export class EmailService {
  static async sendExpirationNotification(
    userEmail: string,
    itineraryTitle: string,
    shareUrl: string,
    hoursRemaining: number,
  ) {
    try {
      // Aquí puedes usar el servicio de email que prefieras
      // Por ejemplo, usando fetch para enviar a un webhook o API externa

      const emailData = {
        to: userEmail,
        subject: `⚠️ Tu enlace "${itineraryTitle}" expira en ${hoursRemaining} horas`,
        html: `
          <h2>Tu enlace compartido está próximo a expirar</h2>
          <p>Hola,</p>
          <p>Te informamos que tu enlace compartido <strong>"${itineraryTitle}"</strong> expirará en aproximadamente <strong>${hoursRemaining} horas</strong>.</p>
          <p><a href="${shareUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver enlace</a></p>
          <p>Si deseas extender la fecha de expiración, puedes hacerlo desde tu panel de enlaces compartidos.</p>
          <p>Saludos,<br>El equipo de Plan de Viaje a Medida</p>
        `,
      }

      // Ejemplo usando un webhook o servicio externo
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@tudominio.com",
          to: [userEmail],
          subject: emailData.subject,
          html: emailData.html,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`)
      }

      console.log(`✅ Email enviado a ${userEmail} para "${itineraryTitle}"`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando email:", error)
      return { success: false, error: error.message }
    }
  }

  static async sendWelcomeEmail(userEmail: string, password: string, userName: string) {
    try {
      const emailData = {
        to: userEmail,
        subject: `🎉 Bienvenido a Plan de Viaje a Medida - Credenciales de acceso`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">¡Bienvenido a Plan de Viaje a Medida!</h2>
          <p>Hola <strong>${userName}</strong>,</p>
          <p>Te damos la bienvenida a nuestra plataforma de planificación de viajes personalizados. Tu cuenta ha sido creada exitosamente.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Tus credenciales de acceso:</h3>
            <p><strong>Usuario:</strong> ${userEmail}</p>
            <p><strong>Contraseña temporal:</strong> ${password}</p>
          </div>
          
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/login" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Iniciar Sesión</a></p>
          
          <p><strong>Recomendación:</strong> Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p>Si tienes alguna pregunta, problema o propuesta de mejora, no dudes en contactarnos:</p>
          <p>📧 <strong>Soporte:</strong> info@plandeviajeamedida.com</p>
          
          <p>¡Esperamos que disfrutes creando itinerarios increíbles!</p>
          
          <p>Saludos,<br>El equipo de Plan de Viaje a Medida</p>
        </div>
      `,
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Plan de Viaje a Medida <noreply@${process.env.RESEND_DOMAIN}>`,
          to: [userEmail],
          subject: emailData.subject,
          html: emailData.html,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`)
      }

      console.log(`✅ Email de bienvenida enviado a ${userEmail}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando email de bienvenida:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 📧 Enviar notificación de límite de itinerarios próximo (20% o menos restante)
   */
  static async sendLimitWarningEmail(
    userEmail: string,
    userName: string,
    used: number,
    limit: number,
    percentage: number,
    planName: string,
  ) {
    try {
      const remaining = limit - used
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

      const emailData = {
        to: userEmail,
        subject: `⚠️ Te quedan solo ${remaining} itinerarios de tu plan ${planName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Límite de Itinerarios</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hola <strong>${userName || "Usuario"}</strong>,</p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Has utilizado <strong>${used} de ${limit} itinerarios</strong> de tu plan <strong>${planName}</strong> este mes.
              Te quedan <strong>solo ${remaining} itinerarios</strong> disponibles.
            </p>
            
            <!-- Progress Bar -->
            <div style="background: #e9ecef; border-radius: 10px; margin: 25px 0; overflow: hidden;">
              <div style="background: ${percentage >= 95 ? "#dc3545" : "#ffc107"}; height: 20px; width: ${percentage}%; border-radius: 10px; position: relative;">
                <span style="position: absolute; right: 10px; top: 2px; color: white; font-size: 12px; font-weight: bold;">${percentage}%</span>
              </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
              <h3 style="margin-top: 0; color: #856404;">📊 Resumen de tu plan:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Plan actual:</strong> ${planName}</li>
                <li><strong>Utilizados:</strong> ${used} itinerarios</li>
                <li><strong>Restantes:</strong> ${remaining} itinerarios</li>
                <li><strong>Límite mensual:</strong> ${limit} itinerarios</li>
              </ul>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <h3 style="color: #495057; margin-bottom: 20px;">¿Necesitas más itinerarios?</h3>
              
              <!-- Paquete Boost destacado -->
              <div style="background: #e8f5e8; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #155724; margin-top: 0;">🚀 Paquete Boost - Itinerarios Extra</h4>
                <p style="font-size: 18px; color: #155724; margin: 10px 0;"><strong>Desde €3 por itinerario</strong> - Disponibles inmediatamente</p>
                <p style="color: #155724; margin-bottom: 15px;">Ve a tu perfil para solicitar itinerarios adicionales</p>
                <a href="${baseUrl}/profile" 
                   style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  👤 Ir a Mi Perfil
                </a>
              </div>
              
              <!-- Upgrade de plan -->
              <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 15px; margin: 15px 0;">
                <h4 style="color: #1565c0; margin-top: 0;">⬆️ O actualiza tu plan</h4>
                <p style="color: #1565c0; margin-bottom: 15px;">Más itinerarios mensuales y mejor precio por unidad</p>
                <a href="${baseUrl}/info/precios" 
                   style="background: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  📈 Ver Planes
                </a>
              </div>
            </div>
            
            <!-- Contact Info -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0;">
              <h4 style="margin-top: 0; color: #856404;">💬 ¿Necesitas ayuda personalizada?</h4>
              <p style="margin-bottom: 10px; color: #856404;">
                Nuestro equipo está aquí para ayudarte a elegir la mejor opción:
              </p>
              <p style="margin-bottom: 0; color: #856404;">
                📧 <strong>Email:</strong> info@plandeviajeamedida.com<br>
                📞 <strong>WhatsApp:</strong> Disponible en nuestra web<br>
                ⏰ <strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00
              </p>
            </div>
            
            <!-- Info Box -->
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 25px 0;">
              <h4 style="margin-top: 0; color: #0c5460;">💡 Información útil:</h4>
              <p style="margin-bottom: 0; color: #0c5460;">
                • Los <strong>Paquetes Boost</strong> se activan inmediatamente<br>
                • Puedes <strong>cambiar de plan</strong> en cualquier momento<br>
                • Los itinerarios se <strong>reinician cada mes</strong> automáticamente<br>
                • El cambio de plan se aplica desde el siguiente ciclo de facturación
              </p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
            
            <p style="font-size: 14px; color: #6c757d; text-align: center; margin-bottom: 0;">
              Gracias por confiar en Plan de Viaje a Medida para crear experiencias únicas.<br>
              <br>
              Saludos,<br>
              El equipo de Plan de Viaje a Medida
            </p>
          </div>
        </div>
      `,
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Plan de Viaje a Medida <noreply@${process.env.RESEND_DOMAIN}>`,
          to: [userEmail],
          subject: emailData.subject,
          html: emailData.html,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`)
      }

      console.log(`✅ Email de límite enviado a ${userEmail} (${used}/${limit} - ${percentage}%)`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando email de límite:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 📧 Enviar confirmación de solicitud de boost al usuario
   */
  static async sendBoostRequestConfirmation(userEmail: string, userName: string, quantity = 10, totalPrice = 50) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Plan de Viaje a Medida <noreply@${process.env.RESEND_DOMAIN}>`,
          to: [userEmail],
          subject: "✅ Solicitud de Boost Recibida",
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">✅ Solicitud Recibida</h2>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>Hemos recibido tu solicitud de <strong>${quantity} itinerarios adicionales</strong> por un total de <strong>€${totalPrice.toFixed(2)}</strong>.</p>
            <p>Procesaremos tu solicitud en las próximas 24-48 horas laborables.</p>
            <p>Te confirmaremos por email cuando esté lista.</p>
            <p>Saludos,<br>El equipo de Plan de Viaje a Medida</p>
          </div>
        `,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`)
      }

      console.log(`✅ Email de confirmación enviado a ${userEmail}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando email de confirmación:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 📧 Enviar notificación al admin de nueva solicitud de boost
   */
  static async sendBoostRequestNotificationToAdmin(
    userEmail: string,
    userName: string,
    used: number,
    limit: number,
    requestId: string,
    quantity = 10,
    totalPrice = 50,
  ) {
    try {
      const adminEmail = "info@plandeviajeamedida.com"

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Plan de Viaje a Medida <noreply@${process.env.RESEND_DOMAIN}>`,
          to: [adminEmail],
          subject: `🚀 Nueva Solicitud de Boost - ${userName}`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">🚀 Nueva Solicitud de Boost</h2>
            <p><strong>Usuario:</strong> ${userName} (${userEmail})</p>
            <p><strong>Uso actual:</strong> ${used}/${limit} itinerarios</p>
            <p><strong>Solicita:</strong> ${quantity} itinerarios adicionales</p>
            <p><strong>Precio total:</strong> €${totalPrice.toFixed(2)}</p>
            <p><strong>ID de solicitud:</strong> ${requestId}</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver en Dashboard</a></p>
          </div>
        `,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`)
      }

      console.log(`✅ Email de notificación enviado al admin para solicitud ${requestId}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando email al admin:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 📧 Enviar confirmación de boost aprobado al usuario
   */
  static async sendBoostApprovedEmail(
    userEmail: string,
    userName: string,
    quantity: number,
    totalPrice: number,
    adminNotes?: string,
  ) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Plan de Viaje a Medida <noreply@${process.env.RESEND_DOMAIN}>`,
          to: [userEmail],
          subject: `🎉 ¡Boost Aprobado! +${quantity} Itinerarios Añadidos`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">🎉 ¡Boost Aprobado!</h2>
            <p>Hola <strong>${userName}</strong>,</p>
            <p>¡Excelentes noticias! Tu solicitud de itinerarios adicionales ha sido aprobada.</p>
            <p><strong>Se han añadido ${quantity} itinerarios a tu cuenta por €${totalPrice.toFixed(2)}.</strong></p>
            <p>Ya puedes continuar creando itinerarios increíbles.</p>
            ${
              adminNotes
                ? `
<div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 15px; margin: 20px 0;">
  <h4 style="color: #1565c0; margin-top: 0;">💬 Nota del administrador:</h4>
  <p style="color: #1565c0; margin-bottom: 0;">${adminNotes}</p>
</div>
`
                : ""
            }
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Crear Itinerario</a></p>
            <p>Saludos,<br>El equipo de Plan de Viaje a Medida</p>
          </div>
        `,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando email: ${response.statusText}`)
      }

      console.log(`✅ Email de boost aprobado enviado a ${userEmail}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando email de boost aprobado:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 📊 ENVIAR REPORTE MENSUAL DE REINICIO - VERSIÓN MEJORADA CON BOOSTS DETALLADOS
   */
  static async sendMonthlyResetReport(reportData: any, spanishTime: string) {
    try {
      const adminEmail = "info@plandeviajeamedida.com"

      // Generar HTML del reporte
      const reportHtml = this.generateReportHtml(reportData, spanishTime)

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Plan de Viaje a Medida <noreply@${process.env.RESEND_DOMAIN}>`,
          to: [adminEmail],
          subject: `📊 Reporte Mensual de Itinerarios - ${spanishTime}`,
          html: reportHtml,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error enviando reporte: ${response.statusText}`)
      }

      console.log(`✅ Reporte mensual enviado a ${adminEmail}`)
      return { success: true }
    } catch (error) {
      console.error("❌ Error enviando reporte mensual:", error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 🎨 GENERAR HTML DEL REPORTE - VERSIÓN MEJORADA CON BOOSTS DETALLADOS
   */
  private static generateReportHtml(reportData: any, spanishTime: string): string {
    const {
      summary,
      usersByRole,
      topUsers,
      limitReachedUsers,
      usersWithActiveBoosts,
      usersWithExpiredBoosts,
      allUsers,
    } = reportData

    return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📊 Reporte Mensual de Itinerarios</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Reinicio ejecutado el ${spanishTime}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background: #f8f9fa;">
        
        <!-- Resumen General -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #007bff;">
          <h2 style="color: #007bff; margin-top: 0;">📈 Resumen General</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div>
              <p style="margin: 5px 0;"><strong>👥 Total Usuarios:</strong> ${summary.totalUsers}</p>
              <p style="margin: 5px 0;"><strong>✅ Usuarios Activos:</strong> ${summary.activeUsers}</p>
              <p style="margin: 5px 0;"><strong>😴 Usuarios Inactivos:</strong> ${summary.inactiveUsers}</p>
              <p style="margin: 5px 0;"><strong>🚀 Con Boost Activo:</strong> ${summary.usersWithActiveBoost}</p>
              <p style="margin: 5px 0;"><strong>📜 Con Boost Expirado:</strong> ${summary.usersWithExpiredBoosts}</p>
            </div>
            <div>
              <p style="margin: 5px 0;"><strong>📋 Total Itinerarios:</strong> ${summary.totalItinerarios}</p>
              <p style="margin: 5px 0;"><strong>🚀 Itinerarios de Boost:</strong> ${summary.totalActiveBoostItinerarios}</p>
              <p style="margin: 5px 0;"><strong>📊 Promedio por Usuario:</strong> ${summary.averagePerUser}</p>
            </div>
          </div>
        </div>

        <!-- Usuarios por Rol -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745;">
          <h2 style="color: #28a745; margin-top: 0;">🏷️ Distribución por Roles</h2>
          ${Object.entries(usersByRole)
            .map(
              ([role, data]: [string, any]) => `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0;">
              <p style="margin: 0;">
                <strong>${role.toUpperCase()}:</strong> ${data.count} usuarios - ${data.itineraries} itinerarios
                ${data.withActiveBoost > 0 ? ` - <span style="color: #28a745; font-weight: bold;">${data.withActiveBoost} con boost activo 🚀</span>` : ""}
                ${data.withExpiredBoosts > 0 ? ` - <span style="color: #6c757d;">${data.withExpiredBoosts} con boost expirado 📜</span>` : ""}
              </p>
            </div>
          `,
            )
            .join("")}
        </div>

        <!-- Top Usuarios Activos -->
        ${
          topUsers.length > 0
            ? `
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
          <h2 style="color: #856404; margin-top: 0;">🏆 Top Usuarios Más Activos</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Usuario</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Rol</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Usado</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Base</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Boost</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Total</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">%</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${topUsers
                  .map(
                    (user: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.name || user.email}</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.role}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.used}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.baseLimit}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; color: ${user.hasActiveBoost ? "#28a745; font-weight: bold;" : "#6c757d;"}">${user.boostAmount || "-"}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.realLimit}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.percentage}%</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">
                    ${user.hasActiveBoost ? '<span style="color: #28a745;">🚀 Activo</span>' : ""}
                    ${user.hasExpiredBoosts ? '<span style="color: #6c757d;">📜 Expirado</span>' : ""}
                    ${!user.hasActiveBoost && !user.hasExpiredBoosts ? '<span style="color: #6c757d;">-</span>' : ""}
                  </td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
        `
            : ""
        }

        <!-- Usuarios que Alcanzaron el Límite -->
        ${
          limitReachedUsers.length > 0
            ? `
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #dc3545;">
          <h2 style="color: #dc3545; margin-top: 0;">🚨 Usuarios que Alcanzaron el Límite</h2>
          ${limitReachedUsers
            .map(
              (user: any) => `
            <div style="background: #f8d7da; padding: 15px; border-radius: 6px; margin: 10px 0; border: 1px solid #f5c6cb;">
              <p style="margin: 0;">
                <strong>${user.name || user.email}</strong> (${user.role}) - ${user.used}/${user.realLimit} itinerarios
                ${user.hasActiveBoost ? ` <span style="color: #28a745;">(Base: ${user.baseLimit} + Boost Activo: ${user.boostAmount})</span>` : ""}
                ${user.hasExpiredBoosts && !user.hasActiveBoost ? ` <span style="color: #6c757d;">(Tenía boost expirado)</span>` : ""}
              </p>
            </div>
          `,
            )
            .join("")}
        </div>
        `
            : ""
        }

        <!-- Usuarios con Boosts Activos (que se van a expirar en este reinicio) -->
        ${
          usersWithActiveBoosts && usersWithActiveBoosts.length > 0
            ? `
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #28a745;">
          <h2 style="color: #28a745; margin-top: 0;">🚀 Usuarios con Boosts Activos (EXPIRADOS en este reinicio)</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Usuario</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Rol</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Base</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Boost</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Total</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Usado</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${usersWithActiveBoosts
                  .map(
                    (user: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.name || user.email}</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.role}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.baseLimit}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6; color: #28a745; font-weight: bold;">+${user.boostAmount}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.realLimit}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.used}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">€${user.totalBoostPrice.toFixed(2)}</td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p style="margin: 0; color: #155724;">
              <strong>💰 Ingresos por Boosts Activos:</strong> €${usersWithActiveBoosts.reduce((sum, user) => sum + user.totalBoostPrice, 0).toFixed(2)}
            </p>
          </div>
        </div>
        `
            : ""
        }

        <!-- Usuarios con Boosts Expirados (histórico) -->
        ${
          usersWithExpiredBoosts && usersWithExpiredBoosts.length > 0
            ? `
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #6c757d;">
          <h2 style="color: #6c757d; margin-top: 0;">📜 Usuarios con Boosts Expirados (Histórico)</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Usuario</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">Rol</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Boosts Expirados</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Itinerarios</th>
                  <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">Precio Total</th>
                </tr>
              </thead>
              <tbody>
                ${usersWithExpiredBoosts
                  .map(
                    (user: any) => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.name || user.email}</td>
                  <td style="padding: 10px; border: 1px solid #dee2e6;">${user.role}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.expiredBoosts.length}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${user.expiredBoostAmount}</td>
                  <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">€${user.totalExpiredBoostPrice.toFixed(2)}</td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #6c757d; border-radius: 6px; padding: 15px; margin: 15px 0;">
            <p style="margin: 0; color: #495057;">
              <strong>📊 Total Ingresos Históricos por Boosts:</strong> €${usersWithExpiredBoosts.reduce((sum, user) => sum + user.totalExpiredBoostPrice, 0).toFixed(2)}
            </p>
          </div>
        </div>
        `
            : ""
        }

        <!-- Listado Completo de Usuarios -->
        <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #6c757d;">
          <h2 style="color: #6c757d; margin-top: 0;">📋 Listado Completo de Usuarios</h2>
          <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead style="position: sticky; top: 0; background: #f8f9fa;">
                <tr>
                  <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Usuario</th>
                  <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Rol</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Usado</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Base</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Boost</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Total</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Estado</th>
                  <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Miembro desde</th>
                </tr>
              </thead>
              <tbody>
                ${allUsers
                  .map(
                    (user: any) => `
                <tr style="${user.used === 0 ? "background: #f8f9fa;" : ""}">
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${user.name || user.email}</td>
                  <td style="padding: 8px; border: 1px solid #dee2e6;">${user.role}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${user.used}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${user.baseLimit}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6; color: ${user.hasActiveBoost ? "#28a745; font-weight: bold;" : "#6c757d;"}">${user.boostAmount || "-"}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${user.realLimit}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">
                    ${user.hasActiveBoost ? "🚀" : ""}${user.hasExpiredBoosts ? "📜" : ""}${!user.hasActiveBoost && !user.hasExpiredBoosts ? "-" : ""}
                  </td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${new Date(user.memberSince).toLocaleDateString("es-ES")}</td>
                </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6c757d;">
            <strong>🔄 Acciones Realizadas:</strong><br>
            ✅ Todos los contadores mensuales reseteados a 0<br>
            ✅ Todos los contadores diarios reseteados a 0<br>
            ✅ Todos los boosts activos marcados como expirados (expired = true)<br>
            ✅ Límites restaurados según rol base<br>
            ✅ Flags de notificación reseteados<br>
            ✅ Sistema de límites dinámicos con columna 'expired' implementado<br>
            ✅ Historial completo de boosts preservado para auditoría
          </p>
        </div>
      </div>
    </div>
    `
  }
}
