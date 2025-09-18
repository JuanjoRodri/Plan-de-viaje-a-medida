import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

export async function POST(request: NextRequest) {
  console.log("=== INICIO DEL ENDPOINT ===")

  try {
    // Paso 1: Leer el body
    console.log("Paso 1: Leyendo body...")
    const body = await request.json()
    console.log("Body recibido:", JSON.stringify(body, null, 2))

    // Paso 2: Validación básica
    console.log("Paso 2: Validando campos requeridos...")
    const requiredFields = ["nombre", "apellidos", "email", "agencia", "mensaje"]
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`Campo faltante: ${field}`)
        return NextResponse.json({ message: `El campo ${field} es obligatorio` }, { status: 400 })
      }
    }
    console.log("Validación de campos requeridos: OK")

    // Paso 3: Validar email
    console.log("Paso 3: Validando email...")
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      console.log("Email inválido:", body.email)
      return NextResponse.json({ message: "El formato del email no es válido" }, { status: 400 })
    }
    console.log("Validación de email: OK")

    // Paso 4: Obtener headers
    console.log("Paso 4: Obteniendo headers...")
    let ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null
    const userAgent = request.headers.get("user-agent") || null

    // Limpiar IP
    if (ip === "unknown") {
      ip = null
    }

    console.log("IP:", ip)
    console.log("User Agent:", userAgent?.substring(0, 50) + "...")

    // Paso 5: Verificar variables de entorno
    console.log("Paso 5: Verificando variables de entorno...")
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("SUPABASE_URL existe:", !!supabaseUrl)
    console.log("SUPABASE_SERVICE_ROLE_KEY existe:", !!supabaseServiceKey)
    console.log("URL:", supabaseUrl?.substring(0, 30) + "...")
    console.log("Service Key:", supabaseServiceKey?.substring(0, 20) + "...")

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables de entorno faltantes")
      return NextResponse.json({ message: "Error de configuración del servidor" }, { status: 500 })
    }

    // Paso 6: Crear cliente Supabase
    console.log("Paso 6: Creando cliente Supabase...")
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("Cliente Supabase creado: OK")

    // Paso 7: Preparar datos
    console.log("Paso 7: Preparando datos para insertar...")
    const insertData: {
      nombre: string
      apellidos: string
      email: string
      telefono: string | null
      agencia: string
      empleados: string | null
      interes: string | null
      mensaje: string
      ip_address?: string | null
      user_agent?: string | null
    } = {
      nombre: body.nombre,
      apellidos: body.apellidos,
      email: body.email,
      telefono: body.telefono || null,
      agencia: body.agencia,
      empleados: body.empleados || null,
      interes: body.interes || null,
      mensaje: body.mensaje,
    }

    // Añadir IP y User Agent solo si están disponibles
    if (ip) {
      insertData.ip_address = ip
    }
    if (userAgent) {
      insertData.user_agent = userAgent
    }

    console.log("Datos preparados:", JSON.stringify(insertData, null, 2))

    // Paso 8: Insertar en base de datos
    console.log("Paso 8: Insertando en base de datos...")
    const { data, error } = await supabase.from("contact_messages").insert([insertData]).select()

    console.log("Resultado de la inserción:")
    console.log("Data:", data)
    console.log("Error:", error)

    if (error) {
      console.error("=== ERROR DE SUPABASE ===")
      console.error("Message:", error.message)
      console.error("Details:", error.details)
      console.error("Hint:", error.hint)
      console.error("Code:", error.code)
      console.error("========================")

      return NextResponse.json(
        {
          message: "Error al guardar el mensaje de contacto",
          error: error.message,
        },
        { status: 500 },
      )
    }

    // Paso 9: Enviar emails de notificación
    console.log("Paso 9: Enviando emails de notificación...")
    try {
      const resend = new Resend("re_8F3VeG1n_ojXDUaTy7XLDHryeCkCarCi7")

      // Email 1: Para ti con información del cliente
      const emailToYou = await resend.emails.send({
        from: "info@plandeviajeamedida.com",
        to: ["info@plandeviajeamedida.com"],
        subject: `Nuevo cliente potencial - ${insertData.agencia}`,
        html: `
      <h2>🎯 Nuevo cliente potencial</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>📋 Información del contacto:</h3>
        <p><strong>Nombre:</strong> ${insertData.nombre} ${insertData.apellidos}</p>
        <p><strong>Email:</strong> <a href="mailto:${insertData.email}">${insertData.email}</a></p>
        <p><strong>Teléfono:</strong> ${insertData.telefono || "No proporcionado"}</p>
        <p><strong>Agencia:</strong> ${insertData.agencia}</p>
        <p><strong>Empleados:</strong> ${insertData.empleados || "No especificado"}</p>
        <p><strong>Interés:</strong> ${insertData.interes || "No especificado"}</p>
      </div>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>💬 Mensaje:</h3>
        <p style="white-space: pre-wrap;">${insertData.mensaje}</p>
      </div>
      
      <hr style="margin: 30px 0;">
      <p style="color: #6c757d; font-size: 12px;">
        <strong>Detalles técnicos:</strong><br>
        IP: ${insertData.ip_address || "No disponible"}<br>
        Enviado el: ${new Date().toLocaleString("es-ES")}
      </p>
    `,
      })

      // Email 2: Confirmación para el cliente
      const emailToClient = await resend.emails.send({
        from: "info@plandeviajeamedida.com",
        to: [insertData.email],
        subject: "Hemos recibido tu consulta - Plan de Viaje a Medida",
        html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2563eb;">¡Gracias por contactarnos!</h2>
        
        <p>Hola <strong>${insertData.nombre}</strong>,</p>
        
        <p>Hemos recibido tu consulta sobre servicios de viajes para <strong>${insertData.agencia}</strong> y queremos agradecerte tu interés en nuestros servicios.</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">📋 Resumen de tu consulta:</h3>
          <p><strong>Agencia:</strong> ${insertData.agencia}</p>
          <p><strong>Empleados:</strong> ${insertData.empleados || "No especificado"}</p>
          <p><strong>Área de interés:</strong> ${insertData.interes || "No especificado"}</p>
        </div>
        
        <p><strong>¿Qué sigue ahora?</strong></p>
        <ul>
          <li>Revisaremos tu consulta en las próximas 24 horas</li>
          <li>Te contactaremos para programar una llamada</li>
          <li>Agendaremos una sesión para enseñarte la app y ver en persona cómo funciona</li>
        </ul>
        
        <p>Si tienes alguna pregunta urgente, no dudes en contactarnos directamente.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0;"><strong>Plan de Viaje a Medida</strong><br>
          📧 info@plandeviajeamedida.com<br>
          🌐 plandeviajeamedida.com</p>
        </div>
        
        <p style="color: #6c757d; font-size: 12px;">
          Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.
        </p>
      </div>
    `,
      })

      console.log("Email para ti enviado:", emailToYou.data ? "✅ Éxito" : "❌ Error")
      console.log("Email para cliente enviado:", emailToClient.data ? "✅ Éxito" : "❌ Error")

      if (emailToYou.error) console.log("Error email tuyo:", emailToYou.error)
      if (emailToClient.error) console.log("Error email cliente:", emailToClient.error)
    } catch (emailError) {
      console.error("Error al enviar emails (no crítico):", emailError)
      // No fallar la operación completa si los emails fallan
    }

    console.log("=== ÉXITO ===")
    console.log("Mensaje guardado con ID:", data?.[0]?.id)

    return NextResponse.json(
      {
        message: "Mensaje enviado correctamente",
        id: data?.[0]?.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("=== ERROR GENERAL ===")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack available")
    console.error("====================")

    return NextResponse.json(
      {
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
