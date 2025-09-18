"use client"

import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ItineraryEditor from "@/components/itinerary-editor/itinerary-editor"
import type { JsonItinerary } from "@/types/enhanced-database"

interface EditSharedItineraryClientProps {
  itineraryJson: JsonItinerary
  userId: string
  sharedItineraryId: string
}

export default function EditSharedItineraryClient({
  itineraryJson,
  userId,
  sharedItineraryId,
}: EditSharedItineraryClientProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSave = async (updatedItinerary: JsonItinerary) => {
    try {
      // Actualizar el itinerario compartido
      const { error: updateError } = await supabase
        .from("shared_itineraries")
        .update({
          title: updatedItinerary.title,
          json_content: updatedItinerary,
          // Eliminamos updated_at ya que no existe en la tabla
        })
        .eq("id", sharedItineraryId)
        .eq("user_id", userId) // Verificación de seguridad

      if (updateError) {
        throw new Error("Error al guardar: " + updateError.message)
      }

      // También actualizar el itinerario original si existe
      if (updatedItinerary.id) {
        const { error: originalUpdateError } = await supabase
          .from("itineraries")
          .update({
            title: updatedItinerary.title,
            json_content: updatedItinerary,
            updated_at: new Date().toISOString(), // Mantenemos updated_at para itineraries si existe
          })
          .eq("id", updatedItinerary.id)
          .eq("user_id", userId)

        // No lanzar error si el itinerario original no existe o no se puede actualizar
        if (originalUpdateError) {
          console.warn("No se pudo actualizar el itinerario original:", originalUpdateError)
        }
      }

      // Redirigir de vuelta a la lista
      router.push("/my-shared-itineraries")
    } catch (err: any) {
      console.error("Error saving itinerary:", err)
      throw err // Re-lanzar para que el editor lo maneje
    }
  }

  const handleCancel = () => {
    router.push("/my-shared-itineraries")
  }

  return (
    <ItineraryEditor initialJsonItinerary={itineraryJson} onSave={handleSave} onCancel={handleCancel} userId={userId} />
  )
}
