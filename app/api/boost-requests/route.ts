import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSession } from "@/lib/auth"
import { EmailService } from "@/app/services/email-service"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Definir los paquetes fijos disponibles (mismo que en el frontend)
const BOOST_PACKAGES = [
  { quantity: 5, pricePerUnit: 3.0, total: 15.0 },
  { quantity: 10, pricePerUnit: 2.9, total: 29.0 },
  { quantity: 15, pricePerUnit: 2.75, total: 41.25 },
  { quantity: 20, pricePerUnit: 2.5, total: 50.0 },
]

export async function POST(request: NextRequest) {
  try {
    const session = getSession()
    if (!session?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.id

    // Verificar que el usuario esté al 80% o más de uso
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("itineraries_created_this_month, monthly_itinerary_limit, last_month_reset, email, name")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Error obteniendo datos del usuario:", userError)
      return NextResponse.json({ error: "Error al verificar usuario" }, { status: 500 })
    }

    // Usar los datos directamente sin verificar el mes
    const used = userData.itineraries_created_this_month || 0
    const limit = userData.monthly_itinerary_limit || 50
    const percentage = Math.round((used / limit) * 100)

    console.log("🔍 Backend Boost Check:", {
      userId,
      used,
      limit,
      percentage,
      canRequest: percentage >= 80,
    })

    // Verificar que esté al 80% o más
    if (percentage < 80) {
      return NextResponse.json(
        { error: "Solo puedes solicitar boost cuando hayas usado el 80% o más de tus itinerarios" },
        { status: 400 },
      )
    }

    // Verificar que no tenga una solicitud pendiente
    const { data: existingRequest, error: existingError } = await supabase
      .from("boost_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return NextResponse.json({ error: "Ya tienes una solicitud pendiente" }, { status: 400 })
    }

    // Obtener datos de la solicitud
    const { quantity, totalPrice } = await request.json()

    // Validar que la cantidad corresponda a un paquete válido
    const validPackage = BOOST_PACKAGES.find((pkg) => pkg.quantity === quantity)
    if (!validPackage) {
      return NextResponse.json(
        {
          error: "Cantidad inválida. Solo se permiten paquetes de 5, 10, 15 o 20 itinerarios",
        },
        { status: 400 },
      )
    }

    // Validar precio
    if (totalPrice && Math.abs(totalPrice - validPackage.total) > 0.01) {
      return NextResponse.json({ error: "Error en el cálculo del precio" }, { status: 400 })
    }

    // Crear la solicitud
    const { data: newRequest, error: createError } = await supabase
      .from("boost_requests")
      .insert({
        user_id: userId,
        current_used: used,
        current_limit: limit,
        itineraries_requested: validPackage.quantity,
        total_price: validPackage.total,
      })
      .select()
      .single()

    if (createError) {
      console.error("Error creando solicitud:", createError)
      return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 })
    }

    // Enviar emails
    await EmailService.sendBoostRequestConfirmation(
      userData.email,
      userData.name,
      validPackage.quantity,
      validPackage.total,
    )
    await EmailService.sendBoostRequestNotificationToAdmin(
      userData.email,
      userData.name,
      used,
      limit,
      newRequest.id,
      validPackage.quantity,
      validPackage.total,
    )

    return NextResponse.json({
      success: true,
      message: "Solicitud creada exitosamente",
      requestId: newRequest.id,
      package: validPackage,
    })
  } catch (error) {
    console.error("Error en POST /api/boost-requests:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = getSession()
    if (!session?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.id

    // Obtener solicitudes del usuario
    const { data: requests, error } = await supabase
      .from("boost_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error obteniendo solicitudes:", error)
      return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error en GET /api/boost-requests:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
