import { createServerSupabaseClient } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import SharedItineraryView from "./shared-itinerary-view"
import type { JsonItinerary } from "@/types/enhanced-database"

type Props = {
  params: { id: string }
}

// Revalidate cada hora, o ajusta según necesidad
export const revalidate = 3600

export default async function SharedItineraryPage({ params }: Props) {
  const supabase = createServerSupabaseClient()
  const sharedId = params.id

  if (!sharedId) {
    notFound()
  }

  // 1. Obtener el itinerario compartido
  const { data: sharedItineraryData, error: fetchError } = await supabase
    .from("shared_itineraries")
    .select("id, json_content, expires_at, view_count, is_active, user_id")
    .eq("id", sharedId)
    .single()

  if (fetchError || !sharedItineraryData) {
    console.error(`Error fetching shared itinerary ${sharedId}:`, fetchError)
    notFound()
  }

  // 2. Verificar si el enlace está activo - redirigir a página específica
  if (!sharedItineraryData.is_active) {
    console.log(`Shared itinerary ${sharedId} is deactivated.`)
    redirect(`/share/${sharedId}/deactivated`)
  }

  // 3. Verificar si ha expirado
  if (sharedItineraryData.expires_at && new Date(sharedItineraryData.expires_at) < new Date()) {
    console.log(`Shared itinerary ${sharedId} has expired.`)
    notFound()
  }

  // 4. Obtener información de la agencia
  let agencyInfo = null
  if (sharedItineraryData.user_id) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("agency_name, agency_phone, agency_email, agent_name, agency_address, agency_website, agency_logo_url")
      .eq("id", sharedItineraryData.user_id)
      .single()

    if (!userError && userData) {
      agencyInfo = userData
    }
  }

  // 5. Incrementar el contador de vistas (sin bloquear la respuesta al usuario)
  supabase
    .rpc("increment_shared_itinerary_view_count", { row_id: sharedItineraryData.id })
    .then(({ error: rpcError }) => {
      if (rpcError) {
        console.error(`Error incrementing view count for ${sharedId}:`, rpcError)
      }
    })

  const itinerary = sharedItineraryData.json_content as JsonItinerary | null

  if (!itinerary) {
    console.error(`Shared itinerary ${sharedId} has null json_content.`)
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SharedItineraryView itinerary={itinerary} sharedId={sharedItineraryData.id} agencyInfo={agencyInfo} />
    </div>
  )
}
