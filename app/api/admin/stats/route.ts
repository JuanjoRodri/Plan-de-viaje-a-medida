import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: Request) {
  // Verificar si el usuario es administrador
  const { props, redirect } = await requireAdmin()
  if (redirect) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()

  try {
    // Total de usuarios
    const { count: totalUsers, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })

    if (usersError) throw usersError

    // Total de itinerarios
    const { count: totalItineraries, error: itinerariesError } = await supabase
      .from("itineraries")
      .select("*", { count: "exact", head: true })

    if (itinerariesError) throw itinerariesError

    // Itinerarios creados en la última semana
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { count: itinerariesLastWeek, error: lastWeekError } = await supabase
      .from("itineraries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo.toISOString())

    if (lastWeekError) throw lastWeekError

    // Usuarios activos (que han creado itinerarios en la última semana)
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from("itineraries")
      .select("user_id")
      .gte("created_at", oneWeekAgo.toISOString())
      .order("user_id")

    if (activeUsersError) throw activeUsersError

    // Contar usuarios únicos
    const uniqueUserIds = new Set(activeUsersData.map((item) => item.user_id))
    const activeUsers = uniqueUserIds.size

    return NextResponse.json({
      totalUsers,
      totalItineraries,
      itinerariesLastWeek,
      activeUsers,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
