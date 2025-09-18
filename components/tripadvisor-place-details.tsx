"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, MapPin, Calendar, User, ExternalLink } from "lucide-react"
import { tripAdvisorService } from "@/app/services/tripadvisor-enhanced-service"

interface TripAdvisorPlaceDetailsProps {
  locationId: string
  placeName: string
  className?: string
}

export default function TripAdvisorPlaceDetails({
  locationId,
  placeName,
  className = "",
}: TripAdvisorPlaceDetailsProps) {
  const [activeTab, setActiveTab] = useState("photos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<any>(null)
  const [photos, setPhotos] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // Obtener detalles del lugar
        const placeDetails = await tripAdvisorService.getLocationDetails(locationId)
        if (placeDetails) {
          setDetails(placeDetails)
        }

        // Obtener fotos
        const placePhotos = await tripAdvisorService.getLocationPhotos(locationId)
        if (placePhotos && placePhotos.length > 0) {
          setPhotos(placePhotos)
        }

        // Obtener reseñas
        const placeReviews = await tripAdvisorService.getLocationReviews(locationId)
        if (placeReviews && placeReviews.length > 0) {
          setReviews(placeReviews)
        }
      } catch (err) {
        console.error("Error fetching TripAdvisor data:", err)
        setError("No se pudieron cargar los datos de TripAdvisor")
      } finally {
        setLoading(false)
      }
    }

    if (locationId) {
      fetchData()
    }
  }, [locationId])

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  }

  // Renderizar estrellas de calificación
  const renderRatingStars = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-md" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle>{placeName}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!details && photos.length === 0 && reviews.length === 0) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader>
          <CardTitle>{placeName}</CardTitle>
          <CardDescription>No hay información disponible en TripAdvisor</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{details?.name || placeName}</CardTitle>
            {details?.address_obj && (
              <CardDescription className="flex items-center mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                {`${details.address_obj.street1 || ""} ${details.address_obj.city || ""}, ${details.address_obj.country || ""}`}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1">
            {details?.rating && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1 fill-current" />
                {details.rating.toFixed(1)}
              </Badge>
            )}
            {details?.price_level && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {details.price_level}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mx-4">
          <TabsTrigger value="photos" disabled={photos.length === 0}>
            Fotos
          </TabsTrigger>
          <TabsTrigger value="reviews" disabled={reviews.length === 0}>
            Reseñas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="m-0">
          <CardContent className="pt-4 pb-2">
            {photos.length > 0 ? (
              <div className="space-y-3">
                <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={photos[activePhotoIndex]?.images?.large?.url || photos[activePhotoIndex]?.images?.medium?.url}
                    alt={photos[activePhotoIndex]?.caption || `Foto de ${details?.name || placeName}`}
                    className="w-full h-full object-cover"
                  />
                  {photos[activePhotoIndex]?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                      {photos[activePhotoIndex].caption}
                    </div>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => setActivePhotoIndex(index)}
                        className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                          index === activePhotoIndex ? "border-blue-500" : "border-transparent"
                        }`}
                      >
                        <img
                          src={photo.images?.small?.url || photo.images?.thumbnail?.url}
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                <p>No hay fotos disponibles</p>
              </div>
            )}
          </CardContent>
        </TabsContent>

        <TabsContent value="reviews" className="m-0">
          <CardContent className="pt-4 pb-2">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{review.title || "Reseña"}</h4>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <User className="h-3 w-3 mr-1" />
                          <span>{review.user?.username || "Usuario anónimo"}</span>
                          <span className="mx-1">•</span>
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(review.published_date)}</span>
                        </div>
                      </div>
                      {renderRatingStars(review.rating)}
                    </div>
                    <p className="text-sm text-gray-700">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                <p>No hay reseñas disponibles</p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>

      <CardFooter className="pt-2 pb-4">
        {details?.web_url && (
          <Button asChild variant="outline" className="w-full">
            <a
              href={details.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              Ver en TripAdvisor
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
