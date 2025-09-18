import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Crear cliente de Supabase con la service role key (esto se ejecuta en el servidor)
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { id, expiresAt } = await request.json()

    if (!id || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Actualizar la fecha de expiración usando el cliente con service role key
    const { data, error } = await supabase
      .from("shared_itineraries")
      .update({ expires_at: expiresAt })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating expiration date:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in update-expiration route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
