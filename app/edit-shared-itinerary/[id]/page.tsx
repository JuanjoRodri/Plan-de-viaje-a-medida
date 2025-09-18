import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getUser } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { JsonItinerary } from "@/types/enhanced-database"
import EditSharedItineraryClient from "./edit-shared-itinerary-client"

export default async function EditSharedItineraryPage({ params }: { params: { id: string } }) {
  // Verificar autenticación en el servidor
  const user = await getUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  try {
    // Cargar el itinerario compartido
    const { data: sharedItinerary, error: fetchError } = await supabase
      .from("shared_itineraries")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id) // Verificar que pertenece al usuario
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return (
          <div className="container py-8">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>Itinerario no encontrado o no tienes permisos para editarlo</AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/my-shared-itineraries">Volver a mis itinerarios compartidos</Link>
            </Button>
          </div>
        )
      } else {
        throw new Error("Error al cargar el itinerario: " + fetchError.message)
      }
    }

    // Parsear el JSON del itinerario
    let parsedJson: JsonItinerary
    if (typeof sharedItinerary.json_content === "string") {
      try {
        parsedJson = JSON.parse(sharedItinerary.json_content)
      } catch (parseError) {
        return (
          <div className="container py-8">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>Error al procesar los datos del itinerario</AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/my-shared-itineraries">Volver a mis itinerarios compartidos</Link>
            </Button>
          </div>
        )
      }
    } else {
      parsedJson = sharedItinerary.json_content as JsonItinerary
    }

    return (
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Editar Itinerario Compartido</h1>
          <p className="text-muted-foreground">
            Los cambios se aplicarán al itinerario compartido y se mantendrá el enlace actual.
          </p>
        </div>

        <EditSharedItineraryClient itineraryJson={parsedJson} userId={user.id} sharedItineraryId={params.id} />
      </div>
    )
  } catch (err: any) {
    console.error("Error loading shared itinerary:", err)
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{err.message || "Error inesperado al cargar el itinerario"}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/my-shared-itineraries">Volver a mis itinerarios compartidos</Link>
        </Button>
      </div>
    )
  }
}
