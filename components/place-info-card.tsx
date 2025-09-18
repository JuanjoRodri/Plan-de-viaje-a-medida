"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Star, Clock, Globe, Phone, DollarSign, ExternalLink, ImageIcon } from "lucide-react"
import type { EnhancedPlaceDetails } from "@/app/services/places-utils"

interface PlaceInfoCardProps {
  place: EnhancedPlaceDetails
  className?: string
}

export default function PlaceInfoCard({ place, className = "" }: PlaceInfoCardProps) {
  const [activeTab, setActiveTab] = useState("info")
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)

  // Determinar el color del badge según el nivel de precio
  const getPriceLevelColor = (priceLevel?: number) => {
    if (priceLevel === undefined) return "bg-gray-200 text-gray-700"
    const colors = [
      "bg-green-100 text-green-800", // Gratis
      "bg-blue-100 text-blue-800", // Económico
      "bg-yellow-100 text-yellow-800", // Moderado
      "bg-orange-100 text-orange-800", // Caro
      "bg-red-100 text-red-800", // Muy caro
    ]
    return colors[priceLevel] || "bg-gray-200 text-gray-700"
  }

  // Determinar el color del badge según la calificación
  const getRatingColor = (rating?: number) => {
    if (!rating) return "bg-gray-200 text-gray-700"
    if (rating >= 4.5) return "bg-green-100 text-green-800"
    if (rating >= 4.0) return "bg-lime-100 text-lime-800"
    if (rating >= 3.5) return "bg-yellow-100 text-yellow-800"
    if (rating >= 3.0) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{place.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
              {place.formatted_address || "Dirección no disponible"}
            </CardDescription>
            {(place.formatted_phone_number || place.website) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {place.formatted_phone_number && (
                  <a
                    href={`tel:${place.formatted_phone_number}`}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                    {place.formatted_phone_number}
                  </a>
                )}
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm hover:bg-green-100 transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    Sitio web
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {place.price_level !== undefined && (
              <Badge variant="outline" className={getPriceLevelColor(place.price_level)}>
                <DollarSign className="h-3 w-3 mr-1" />
                {place.formattedPriceLevel}
              </Badge>
            )}
            {place.rating && (
              <Badge variant="outline" className={getRatingColor(place.rating)}>
                <Star className="h-3 w-3 mr-1 fill-current" />
                {place.rating.toFixed(1)}
              </Badge>
            )}
            {place.opening_hours?.open_now !== undefined && (
              <Badge
                variant="outline"
                className={
                  place.opening_hours.open_now
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-red-100 text-red-800 border-red-200"
                }
              >
                <Clock className="h-3 w-3 mr-1" />
                {place.opening_hours.open_now ? "Abierto" : "Cerrado"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mx-4">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="photos" disabled={!place.photoUrls || place.photoUrls.length === 0}>
            Fotos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="m-0">
          <CardContent className="pt-4 pb-2">
            <div className="space-y-3 text-sm">
              {place.opening_hours?.weekday_text && place.opening_hours.weekday_text.length > 0 && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Horario:</p>
                      {place.opening_hours.open_now !== undefined && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            place.opening_hours.open_now ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {place.opening_hours.open_now ? "Abierto ahora" : "Cerrado ahora"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {place.opening_hours.weekday_text.map((day, index) => {
                        const today = new Date().getDay()
                        const dayIndex = index === 6 ? 0 : index + 1 // Ajustar para que domingo sea 0
                        const isToday = dayIndex === today
                        return (
                          <div
                            key={index}
                            className={`text-sm p-2 rounded ${
                              isToday ? "bg-blue-50 text-blue-900 font-medium border border-blue-200" : "text-gray-600"
                            }`}
                          >
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              {place.types && place.types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {place.types.slice(0, 5).map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent value="photos" className="m-0">
          <CardContent className="pt-4 pb-2">
            {place.photoUrls && place.photoUrls.length > 0 ? (
              <div className="space-y-3">
                <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={place.photoUrls[activePhotoIndex] || "/placeholder.svg"}
                    alt={`Foto de ${place.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {place.photoUrls.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {place.photoUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setActivePhotoIndex(index)}
                        className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                          index === activePhotoIndex ? "border-blue-500" : "border-transparent"
                        }`}
                      >
                        <img
                          src={url || "/placeholder.svg"}
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
                <ImageIcon className="h-8 w-8 mb-2" />
                <p>No hay fotos disponibles</p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      <CardFooter className="pt-2 pb-4">
        <Button asChild variant="outline" className="w-full bg-transparent">
          <a href={place.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-2" />
            Ver en Google Maps
            <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
