import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // LOG #1: PRIMERÍSIMA LÍNEA DE LA FUNCIÓN. ¿LLEGA LA PETICIÓN AQUÍ?
  console.log(`[API DELETE /api/shared-itineraries/] - FUNCIÓN DELETE INVOCADA. Timestamp: ${new Date().toISOString()}`)

  const sharedItineraryId = params.id
  // LOG #2: ¿SE OBTIENE EL ID CORRECTAMENTE?
  console.log(`[API DELETE /api/shared-itineraries/] - ID del itinerario a eliminar: ${sharedItineraryId}`)

  if (!sharedItineraryId || sharedItineraryId === "undefined") {
    console.error(
      `[API DELETE /api/shared-itineraries/] - ERROR: ID es undefined o inválido. ID recibido: "${sharedItineraryId}"`,
    )
    return NextResponse.json({ error: "ID de itinerario no válido" }, { status: 400 })
  }

  try {
    // LOG #3: ¿SE INICIA EL BLOQUE TRY?
    console.log(`[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Entrando al bloque try.`)

    const supabase = createServerClient()
    // LOG #4: ¿SE CREA EL CLIENTE SUPABASE?
    console.log(`[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Cliente Supabase supuestamente creado.`)

    // Autenticación del usuario
    console.log(`[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Intentando obtener usuario de Supabase...`)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Error de autenticación Supabase:`,
        JSON.stringify(authError),
      )
      return NextResponse.json({ error: "Error de autenticación: " + authError.message }, { status: 401 })
    }
    if (!user) {
      console.log(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Usuario no autenticado según Supabase (user es null).`,
      )
      return NextResponse.json({ error: "No autenticado, usuario no encontrado por Supabase" }, { status: 401 })
    }
    // LOG #5: ¿USUARIO AUTENTICADO?
    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Usuario autenticado por Supabase: ID=${user.id}, Email=${user.email}`,
    )

    // Verificación de rol de admin
    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Intentando obtener perfil de usuario (rol) desde tabla 'users' para ID: ${user.id}...`,
    )
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Error al obtener perfil de usuario (tabla 'users', ID: ${user.id}):`,
        JSON.stringify(profileError),
      )
      return NextResponse.json(
        { error: "Error al verificar el rol del usuario: " + profileError.message },
        { status: 500 },
      )
    }
    if (!userProfile) {
      console.log(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Perfil (tabla 'users') no encontrado para ID: ${user.id}. No se puede verificar rol.`,
      )
      return NextResponse.json(
        { error: "Perfil de usuario no encontrado. No se puede verificar el rol." },
        { status: 403 },
      )
    }
    // LOG #6: ¿PERFIL OBTENIDO? ¿ROL CORRECTO?
    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Perfil (tabla 'users') obtenido: role=${userProfile.role}`,
    )

    const isAdmin = userProfile.role === "admin"
    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Verificación de admin: ¿Es administrador? ${isAdmin}`,
    )

    if (!isAdmin) {
      console.log(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - ACCESO DENEGADO: Usuario ID ${user.id} con rol '${userProfile.role}' NO es admin. Denegando eliminación.`,
      )
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador." }, { status: 403 })
    }

    // Si es admin, procede a eliminar
    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Usuario es ADMIN. Intentando eliminar el enlace de la tabla 'shared_itineraries'...`,
    )
    const { error: deleteError, count } = await supabase.from("shared_itineraries").delete().eq("id", sharedItineraryId) // Asegúrate que sharedItineraryId es el UUID correcto del enlace

    if (deleteError) {
      console.error(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Error de Supabase al eliminar de 'shared_itineraries':`,
        JSON.stringify(deleteError),
      )
      // Código de error de RLS de Postgres es '42501' (permission denied)
      // Código de error 'PGRST200' (violación de RLS) de PostgREST
      if (deleteError.code === "42501" || deleteError.code === "PGRST200") {
        console.error(
          `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - ERROR DE RLS DETECTADO AL ELIMINAR: ${deleteError.message}`,
        )
        return NextResponse.json(
          { error: "Error de permisos al eliminar (RLS): " + deleteError.message },
          { status: 403 },
        )
      }
      return NextResponse.json(
        { error: "Error de Supabase al eliminar el enlace: " + deleteError.message },
        { status: 500 },
      )
    }
    // LOG #7: ¿RESULTADO DE LA OPERACIÓN DELETE?
    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Resultado de la operación delete en 'shared_itineraries': count=${count}`,
    )

    if (count === 0) {
      console.warn(
        `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - La operación de eliminación no afectó a ninguna fila. El enlace con ID ${sharedItineraryId} podría no existir, o la RLS lo impidió (incluso siendo admin, verifica que el ID exista y las políticas RLS sean correctas).`,
      )
      return NextResponse.json(
        {
          error:
            "El enlace no se eliminó. Puede que no exista o no tengas los permisos necesarios (revisar RLS y existencia del ID).",
        },
        { status: 404 },
      )
    }

    console.log(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Enlace eliminado correctamente de Supabase.`,
    )
    return NextResponse.json({ message: "Enlace compartido eliminado correctamente" }, { status: 200 })
  } catch (error: any) {
    // LOG #8: ¿ERROR INESPERADO EN EL BLOQUE TRY-CATCH GENERAL?
    console.error(
      `[API DELETE /api/shared-itineraries/${sharedItineraryId}] - Error inesperado en el manejador:`,
      error.message,
      error.stack,
    )
    return NextResponse.json({ error: "Error interno del servidor: " + error.message }, { status: 500 })
  }
}

// Asegúrate de que los handlers GET y POST también están presentes y son correctos.
// Los copio de tu código anterior para asegurar que el archivo está completo.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("shared_itineraries").select("*").eq("id", params.id).single()
    if (error) {
      console.error("Error fetching shared itinerary:", error)
      return NextResponse.json({ error: "Error fetching shared itinerary" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Shared itinerary not found" }, { status: 404 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in GET shared-itinerary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { data, error } = await supabase.from("shared_itineraries").update(body).eq("id", params.id).select().single()
    if (error) {
      console.error("Error updating shared itinerary:", error)
      return NextResponse.json({ error: "Error updating shared itinerary" }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: "Shared itinerary not found or no changes applied" }, { status: 404 })
    }
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in POST shared-itinerary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
