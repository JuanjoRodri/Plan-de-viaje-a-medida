"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ItineraryMapView from "@/components/itinerary-map-view" // Asegúrate que la ruta sea correcta
import type { Itinerary as DbItinerary } from "@/types/database" // Renombrado para evitar conflicto
import Link from "next/link"
import type { JsonItinerary } from "@/types/itinerary-json" // Asumiendo que tienes este tipo definido

// Definición del tipo Itinerary que incluye json_content
interface Itinerary extends DbItinerary {
  json_content?: JsonItinerary | string // Puede ser objeto o string JSON
}

export default function ItineraryDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parsedItineraryJson, setParsedItineraryJson] = useState<JsonItinerary | null>(null)

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const response = await fetch(`/api/itineraries/${params.id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Itinerario no encontrado")
          } else {
            throw new Error("Error al cargar el itinerario")
          }
        }

        const data = await response.json()
        const fetchedItinerary = data.itinerary as Itinerary
        setItinerary(fetchedItinerary)

        if (fetchedItinerary.json_content) {
          if (typeof fetchedItinerary.json_content === "string") {
            try {
              setParsedItineraryJson(JSON.parse(fetchedItinerary.json_content))
            } catch (e) {
              console.error("Error parsing itinerary.json_content:", e)
              setError("Error al procesar los datos del itinerario (JSON inválido).")
              setParsedItineraryJson(null)
            }
          } else {
            setParsedItineraryJson(fetchedItinerary.json_content)
          }
        } else {
          // Fallback o manejo si no hay json_content - podrías intentar parsear html_content aquí si es necesario
          // o simplemente no mostrar el mapa si json_content es mandatorio.
          console.warn("Itinerary does not have json_content. Map might not display detailed data.")
          setParsedItineraryJson(null)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchItinerary()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este itinerario?")) {
      return
    }

    try {
      const response = await fetch(`/api/itineraries/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el itinerario")
      }

      router.push("/my-itineraries")
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="container py-8">Cargando itinerario...</div>
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/my-itineraries">Volver a mis itinerarios</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertDescription>Itinerario no encontrado</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href="/my-itineraries">Volver a mis itinerarios</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{itinerary.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/my-itineraries">Volver</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="font-medium text-muted-foreground">Destino</h3>
            <p>{itinerary.destination}</p>
          </div>
          <div>
            <h3 className="font-medium text-muted-foreground">Duración</h3>
            <p>
              {itinerary.days} {itinerary.days === 1 ? "día" : "días"}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-muted-foreground">Viajeros</h3>
            <p>
              {itinerary.travelers} {itinerary.travelers === 1 ? "persona" : "personas"}
            </p>
          </div>
        </div>

        {itinerary.html_content && !parsedItineraryJson ? ( // Mostrar HTML si existe y no hay JSON parseado
          <div className="itinerary-content" dangerouslySetInnerHTML={{ __html: itinerary.html_content }} />
        ) : !parsedItineraryJson ? ( // Si no hay HTML ni JSON
          <p className="text-muted-foreground">Este itinerario no tiene contenido detallado.</p>
        ) : null}
      </div>

      {/* Componente del Mapa del Itinerario */}
      {parsedItineraryJson && (
        <div className="mb-6">
          <ItineraryMapView itineraryJson={parsedItineraryJson} />
        </div>
      )}
    </div>
  )
}
