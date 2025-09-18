"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, MapPin, Check, RefreshCw } from "lucide-react"
import { ensureValidCoordinates } from "@/app/services/geocoding-service"
import type { JsonItinerary } from "@/types/itinerary-json"

interface ItineraryCoordinatesFixerProps {
  itinerary: JsonItinerary
  onFixComplete: (fixedItinerary: JsonItinerary) => void
}

export default function ItineraryCoordinatesFixer({ itinerary, onFixComplete }: ItineraryCoordinatesFixerProps) {
  const [isFixing, setIsFixing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [fixedItinerary, setFixedItinerary] = useState<JsonItinerary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startFixingCoordinates = async () => {
    setIsFixing(true)
    setProgress(0)
    setStatus("Iniciando verificación de coordenadas...")
    setError(null)

    try {
      // Clonar el itinerario para no modificar el original
      const itineraryCopy = JSON.parse(JSON.stringify(itinerary)) as JsonItinerary

      // Verificar coordenadas del destino principal
      setStatus("Verificando coordenadas del destino principal...")
      if (!itineraryCopy.destination.coordinates) {
        const destinationCoords = await ensureValidCoordinates({ name: itineraryCopy.destination.name })
        if (destinationCoords) {
          itineraryCopy.destination.coordinates = destinationCoords
        }
      }

      setProgress(10)

      // Verificar coordenadas del hotel si existe
      if (itineraryCopy.preferences?.hotel?.name) {
        setStatus("Verificando coordenadas del hotel...")
        const hotelCoords = await ensureValidCoordinates(
          {
            name: itineraryCopy.preferences.hotel.name,
            address: itineraryCopy.preferences.hotel.address,
            coordinates: itineraryCopy.preferences.hotel.coordinates,
          },
          itineraryCopy.destination.name,
        )

        if (hotelCoords && itineraryCopy.preferences?.hotel) {
          itineraryCopy.preferences.hotel.coordinates = hotelCoords
        }
      }

      setProgress(20)

      // Calcular el total de actividades para el progreso
      const totalActivities = itineraryCopy.dailyPlans.reduce((sum, day) => sum + day.activities.length, 0)
      let processedActivities = 0

      // Procesar cada día y sus actividades
      for (const day of itineraryCopy.dailyPlans) {
        setStatus(`Verificando actividades del día ${day.dayNumber}...`)

        for (const activity of day.activities) {
          if (activity.location?.name) {
            const activityCoords = await ensureValidCoordinates(
              {
                name: activity.location.name,
                address: activity.location.address,
                coordinates: activity.location.coordinates,
              },
              itineraryCopy.destination.name,
            )

            if (activityCoords && activity.location) {
              activity.location.coordinates = activityCoords
            }
          }

          processedActivities++
          const activityProgress = Math.floor(20 + (processedActivities / totalActivities) * 80)
          setProgress(activityProgress)
        }
      }

      setProgress(100)
      setStatus("¡Verificación completada!")
      setFixedItinerary(itineraryCopy)

      // Notificar al componente padre
      onFixComplete(itineraryCopy)
    } catch (err: any) {
      console.error("Error al verificar coordenadas:", err)
      setError(`Error al verificar coordenadas: ${err.message}`)
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          Verificador de Coordenadas
        </CardTitle>
        <CardDescription>
          Esta herramienta verifica y corrige las coordenadas de los lugares en tu itinerario
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isFixing ? (
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="text-sm text-center">{status}</div>
            <div className="flex justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        ) : fixedItinerary ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                ¡Coordenadas verificadas y corregidas con éxito!
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={startFixingCoordinates}>
              Verificar nuevamente
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={startFixingCoordinates}>
            Verificar y corregir coordenadas
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
