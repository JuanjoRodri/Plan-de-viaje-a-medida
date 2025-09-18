"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bug, ChevronDown, ChevronUp, MapPin } from "lucide-react"
import type { JsonItinerary, JsonCoordinates } from "@/types/itinerary-json" // Asegúrate que JsonCoordinates está bien importado
import { useUser } from "@/hooks/use-user"

interface MapDebugPanelProps {
  itinerary: JsonItinerary | null
  selectedDayIndex: number
}

const isValidCoords = (coords?: JsonCoordinates | any): coords is JsonCoordinates => {
  if (!coords || typeof coords !== "object") return false

  // Priorizar lat/lng, luego latitude/longitude, luego lon
  const lat = coords.lat ?? coords.latitude
  const lng = coords.lng ?? coords.longitude ?? coords.lon

  // Convertir a número si son strings
  const numLat = typeof lat === "string" ? Number.parseFloat(lat) : lat
  const numLng = typeof lng === "string" ? Number.parseFloat(lng) : lng

  const isValid = typeof numLat === "number" && !isNaN(numLat) && typeof numLng === "number" && !isNaN(numLng)

  // Para depuración:
  // if (!isValid && coords) {
  //   console.log("isValidCoords check failed for:", coords, "Parsed as:", {numLat, numLng});
  // }
  return isValid
}

export default function MapDebugPanel({ itinerary, selectedDayIndex }: MapDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useUser()
  const isAdmin = user?.role === "admin"

  if (!itinerary || !isAdmin) {
    return null
  }

  const currentDay = itinerary.dailyPlans[selectedDayIndex]
  const activitiesWithLocation = currentDay?.activities.filter(
    (activity) => activity.location && isValidCoords(activity.location.coordinates),
  )

  const hasValidDestinationCoords = isValidCoords(itinerary.destination?.coordinates)
  const hasValidHotelCoords = isValidCoords(itinerary.preferences?.hotel?.coordinates)

  return (
    <Card className="mb-4 border-dashed border-yellow-500">
      <CardHeader className="py-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Bug className="h-4 w-4 mr-2 text-yellow-500" />
            Depuración del Mapa
          </CardTitle>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 text-xs">
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">Información del Destino:</h3>
              <div className="pl-2">
                <p>Nombre: {itinerary.destination?.name || "No especificado"}</p>
                <p>
                  Coordenadas:{" "}
                  {hasValidDestinationCoords ? (
                    <Badge variant="outline" className="ml-1">
                      {itinerary.destination.coordinates!.lat.toFixed(6)},{" "}
                      {itinerary.destination.coordinates!.lng.toFixed(6)}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-1">
                      No válidas
                    </Badge>
                  )}
                </p>
                {/* Log para depurar el objeto de coordenadas del destino */}
                {/* <pre className="mt-1 text-[10px] bg-slate-100 p-1 rounded">Destino Coords Obj: {JSON.stringify(itinerary.destination?.coordinates)}</pre> */}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Información del Hotel:</h3>
              <div className="pl-2">
                <p>Nombre: {itinerary.preferences?.hotel?.name || "No especificado"}</p>
                <p>
                  Coordenadas:{" "}
                  {hasValidHotelCoords ? (
                    <Badge variant="outline" className="ml-1">
                      {itinerary.preferences!.hotel!.coordinates!.lat.toFixed(6)},{" "}
                      {itinerary.preferences!.hotel!.coordinates!.lng.toFixed(6)}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-1">
                      No válidas
                    </Badge>
                  )}
                </p>
                <p>Verificado: {itinerary.preferences?.hotel?.verified ? "Sí" : "No"}</p>
                <p>Google Place ID: {itinerary.preferences?.hotel?.googlePlaceId || "No disponible"}</p>
                <p>Check-in: {itinerary.preferences?.hotel?.checkInTime || "15:00"}</p>
                <p>Check-out: {itinerary.preferences?.hotel?.checkOutTime || "11:00"}</p>

                {/* Añadir un bloque de debugging raw del objeto hotel */}
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <strong>Raw hotel object:</strong>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(itinerary.preferences?.hotel, null, 2)}</pre>
                </div>
                {/* Log para depurar el objeto de coordenadas del hotel */}
                {/* <pre className="mt-1 text-[10px] bg-slate-100 p-1 rounded">Hotel Coords Obj: {JSON.stringify(itinerary.preferences?.hotel?.coordinates)}</pre> */}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-1">Día Actual (Día {currentDay?.dayNumber}):</h3>
              <div className="pl-2">
                <p>Total de actividades: {currentDay?.activities.length || 0}</p>
                <p>Actividades con ubicación: {activitiesWithLocation?.length || 0}</p>

                {activitiesWithLocation && activitiesWithLocation.length > 0 ? (
                  <div className="mt-2">
                    <h4 className="font-medium">Ubicaciones:</h4>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 mt-1">
                      {activitiesWithLocation.map((activity, idx) => (
                        <div key={idx} className="mb-2 pb-2 border-b last:border-0">
                          <div className="flex items-start">
                            <MapPin className="h-3 w-3 mt-1 mr-1 text-primary" />
                            <div>
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-muted-foreground">{activity.location?.name}</p>
                              <p>
                                Coords:{" "}
                                {activity.location?.coordinates ? (
                                  <span>
                                    {activity.location.coordinates.lat.toFixed(6)},{" "}
                                    {activity.location.coordinates.lng.toFixed(6)}
                                  </span>
                                ) : (
                                  <span className="text-red-500">No válidas</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert className="mt-2 py-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      No hay actividades con coordenadas válidas para este día.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-transparent"
                onClick={() => {
                  console.log("🔍 DEBUG PANEL: Itinerary data:", itinerary)
                  console.log("🔍 DEBUG PANEL: Current day:", currentDay)
                  console.log("🔍 DEBUG PANEL: Activities with location:", activitiesWithLocation)
                  console.log("🔍 DEBUG PANEL: Destination Coords Object:", itinerary.destination?.coordinates)
                  console.log("🔍 DEBUG PANEL: Hotel Coords Object:", itinerary.preferences?.hotel?.coordinates)
                }}
              >
                <Bug className="h-3 w-3 mr-1" />
                Log datos en consola
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
