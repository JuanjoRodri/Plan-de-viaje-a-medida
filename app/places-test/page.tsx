"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Phone, Globe, Clock, DollarSign } from "lucide-react"

export default function PlacesTestPage() {
  const [placeName, setPlaceName] = useState("Restaurante El Botín Madrid")
  const [location, setLocation] = useState("Madrid, España")
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [placeDetails, setPlaceDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const verifyPlace = async () => {
    if (!placeName) return

    setLoading(true)
    setVerificationResult(null)
    setPlaceDetails(null)

    try {
      const response = await fetch(
        `/api/places/verify?place=${encodeURIComponent(placeName)}&location=${encodeURIComponent(location || "")}`,
      )
      const data = await response.json()
      setVerificationResult(data)

      // Si el lugar existe, obtener detalles
      if (data.exists && data.placeId) {
        getPlaceDetails(data.placeId)
      }
    } catch (error) {
      console.error("Error verifying place:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPlaceDetails = async (placeId: string) => {
    setDetailsLoading(true)

    try {
      const response = await fetch(`/api/places/details?id=${placeId}`)
      const data = await response.json()
      setPlaceDetails(data)
    } catch (error) {
      console.error("Error getting place details:", error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const formatPriceLevel = (priceLevel?: number) => {
    if (priceLevel === undefined) return "No disponible"
    const symbols = ["€", "€€", "€€€", "€€€€", "€€€€€"]
    const labels = ["Económico", "Moderado", "Caro", "Muy caro", "Lujo"]
    return `${symbols[priceLevel - 1] || "?"} (${labels[priceLevel - 1] || "?"})`
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Prueba de Google Places API</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Verificar lugar</CardTitle>
          <CardDescription>Comprueba si un lugar existe y obtén información detallada sobre él.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="place">Nombre del lugar</Label>
              <Input
                id="place"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Ej: Restaurante El Botín Madrid"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Ubicación (opcional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Madrid, España"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={verifyPlace} disabled={loading}>
            {loading ? "Verificando..." : "Verificar lugar"}
          </Button>
        </CardFooter>
      </Card>

      {verificationResult && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resultado de la verificación</CardTitle>
            <CardDescription>
              Resultado de la verificación del lugar &quot;{verificationResult.originalName}&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={verificationResult.exists ? "default" : "destructive"}>
                  {verificationResult.exists ? "Existe" : "No existe"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Similitud: {Math.round(verificationResult.similarity * 100)}%
                </span>
              </div>

              {verificationResult.exists && (
                <>
                  <div className="grid gap-1">
                    <Label>Nombre corregido</Label>
                    <p className="text-sm">{verificationResult.correctedName}</p>
                  </div>
                  <div className="grid gap-1">
                    <Label>Dirección</Label>
                    <p className="text-sm">{verificationResult.address}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          {verificationResult.exists && (
            <CardFooter>
              <Button
                variant="outline"
                onClick={() => getPlaceDetails(verificationResult.placeId)}
                disabled={detailsLoading}
              >
                {detailsLoading ? "Cargando detalles..." : "Ver detalles completos"}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {placeDetails && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{placeDetails.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {placeDetails.formatted_address}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {placeDetails.photos && placeDetails.photos.length > 0 && (
                <div className="aspect-video overflow-hidden rounded-md">
                  <img
                    src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${placeDetails.photos[0].photo_reference}&key=AIzaSyCWA5qNsEewRUkXnCuN8TlyLnVKEHmLp9I`}
                    alt={placeDetails.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {placeDetails.types?.map((type: string) => (
                  <Badge key={type} variant="outline">
                    {type.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>

              <div className="grid gap-4">
                {placeDetails.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">
                      {placeDetails.rating.toFixed(1)}/5 ({placeDetails.user_ratings_total} reseñas)
                    </span>
                  </div>
                )}

                {placeDetails.price_level !== undefined && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>{formatPriceLevel(placeDetails.price_level)}</span>
                  </div>
                )}

                {placeDetails.formatted_phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <span>{placeDetails.formatted_phone_number}</span>
                  </div>
                )}

                {placeDetails.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <a
                      href={placeDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {new URL(placeDetails.website).hostname}
                    </a>
                  </div>
                )}

                {placeDetails.opening_hours?.weekday_text && (
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Horario</span>
                    </div>
                    <ul className="grid gap-1 text-sm">
                      {placeDetails.opening_hours.weekday_text.map((day: string) => (
                        <li key={day}>{day}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {placeDetails.reviews && placeDetails.reviews.length > 0 && (
                <div className="grid gap-4">
                  <h3 className="text-lg font-medium">Reseñas</h3>
                  <div className="grid gap-4">
                    {placeDetails.reviews.slice(0, 3).map((review: any) => (
                      <div key={review.time} className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.author_name}</span>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="ml-1">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm">{review.text}</p>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {placeDetails.url && (
                <div className="mt-4">
                  <a
                    href={placeDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Ver en Google Maps
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
