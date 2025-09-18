import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createClient } from "@supabase/supabase-js"
import type { JsonItinerary } from "@/types/enhanced-database"
import { cookies } from "next/headers"

// Crear un cliente de Supabase directo
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function POST(request: Request) {
  try {
    let userIdFromSession: string | null = null
    try {
      const cookieStore = cookies()
      const sessionCookie = cookieStore.get("session")?.value

      if (sessionCookie) {
        const session = JSON.parse(sessionCookie)
        if (session?.id) {
          userIdFromSession = session.id
          console.log(`ID de usuario obtenido de la cookie de sesión (public.users.id): ${userIdFromSession}`)
        } else {
          console.log("No se encontró 'id' en la cookie de sesión.")
        }
      } else {
        console.log("No se encontró la cookie 'session'. El enlace se creará de forma anónima.")
      }
    } catch (authError) {
      console.error("Error al procesar la cookie de sesión en /api/share:", authError)
    }

    const requestBody = await request.json()
    const {
      itineraryJson,
      title, // Título principal del itinerario (ej. "Viaje a París")
      reference_note, // Nueva nota de referencia o nombre del cliente
      expiresInDays = 30,
    }: {
      itineraryJson: JsonItinerary
      title?: string
      reference_note?: string // Añadido
      expiresInDays?: number
    } = requestBody

    if (!itineraryJson || typeof itineraryJson !== "object") {
      return NextResponse.json(
        { error: "Falta el contenido del itinerario (itineraryJson) o no es un objeto válido." },
        { status: 400 },
      )
    }

    const newSharedId = uuidv4()
    const createdAt = new Date()
    let expiresAt: Date | null = null

    if (expiresInDays > 0) {
      expiresAt = new Date(createdAt)
      expiresAt.setDate(createdAt.getDate() + expiresInDays)
    }

    // Usar el título proporcionado, o generar uno a partir del itinerarioJson
    const itineraryTitle =
      title || itineraryJson.title || `Itinerario en ${itineraryJson.destination?.name || "destino desconocido"}`

    console.log(
      `Intentando insertar en shared_itineraries con user_id: ${userIdFromSession}, title: ${itineraryTitle}, reference_note: ${reference_note}`,
    )

    const { data: sharedItinerary, error: insertError } = await supabase
      .from("shared_itineraries")
      .insert({
        id: newSharedId,
        user_id: userIdFromSession,
        itinerary_id: null, // Si tienes un ID de itinerario original, podrías pasarlo aquí
        json_content: itineraryJson,
        created_at: createdAt.toISOString(),
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        view_count: 0,
        title: itineraryTitle, // Título principal
        reference_note: reference_note, // Guardar la nueva nota de referencia
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Error al insertar itinerario compartido en la BD:", insertError)
      return NextResponse.json(
        {
          error: "No se pudo crear el enlace compartido. Inténtalo de nuevo.",
          details: insertError.message,
        },
        { status: 500 },
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const shareUrl = `${baseUrl}/share/${newSharedId}`

    console.log(`Enlace compartido creado exitosamente: ${shareUrl} para user_id: ${userIdFromSession}`)

    return NextResponse.json(
      {
        message: "Enlace compartido creado exitosamente.",
        shareUrl,
        sharedItineraryId: newSharedId,
        expiresAt: expiresAt ? expiresAt.toISOString() : "Nunca",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error inesperado al crear enlace compartido:", error)
    const errorMessage = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      {
        error: "Error interno del servidor. Inténtalo de nuevo más tarde.",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
