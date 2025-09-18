import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const id = params.id
  const supabase = createServerSupabaseClient()

  try {
    // Obtener el usuario
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", id).single()

    if (userError) throw userError

    // Obtener los itinerarios del usuario
    const { data: itineraries, error: itinerariesError } = await supabase
      .from("itineraries")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })

    if (itinerariesError) throw itinerariesError

    return NextResponse.json({ user, itineraries })
  } catch (error) {
    console.error("Error fetching user details:", error)
    return NextResponse.json({ error: "Error al obtener detalles del usuario" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const id = params.id
  const supabase = createServerSupabaseClient()

  try {
    const body = await request.json()
    const { name, email, role, monthly_itinerary_limit, password } = body

    // Validar datos
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Preparar datos de actualización
    const updateData: any = {
      name,
      email,
      role,
      monthly_itinerary_limit,
      updated_at: new Date().toISOString(),
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim() !== "") {
      const bcrypt = require("bcryptjs")
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password = hashedPassword
    }

    // Actualizar usuario
    const { data, error } = await supabase.from("users").update(updateData).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const id = params.id
  const supabase = createServerSupabaseClient()

  try {
    // Eliminar usuario
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error al eliminar el usuario" }, { status: 500 })
  }
}
