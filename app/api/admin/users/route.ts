import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { EmailService } from "@/app/services/email-service"
import { getDefaultItineraryLimit } from "@/lib/role-utils"

export async function GET(request: Request) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    // Obtener todos los usuarios con todos sus campos
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    const body = await request.json()
    const { name, email, password, role, monthly_itinerary_limit } = body

    // Validar datos
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 })
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario (password_changed = false para forzar cambio)
    const { data, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
        monthly_itinerary_limit: monthly_itinerary_limit || getDefaultItineraryLimit(role),
        monthly_itineraries_used: 0,
        itineraries_created_this_month: 0,
        last_itinerary_month: new Date().toISOString().split("T")[0], // YYYY-MM-DD
        password_changed: false, // Forzar cambio de contraseña en primer login
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Enviar email de bienvenida
    try {
      await EmailService.sendWelcomeEmail(email, password, name)
      console.log(`✅ Email de bienvenida enviado a ${email}`)
    } catch (emailError) {
      console.error("❌ Error enviando email de bienvenida:", emailError)
      // No fallar la creación del usuario si el email falla
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 })
  }
}
