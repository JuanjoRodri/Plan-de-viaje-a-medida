"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Star, ExternalLink } from "lucide-react"
import { tripAdvisorService } from "@/app/services/tripadvisor-enhanced-service"

interface NearbyPlacesSearchProps {
  destination: string
  latitude?: number
  longitude?: number
  className?: string
}

export default function NearbyPlacesSearch({
  destination,
  latitude,
  longitude,
  className = "",
}: NearbyPlacesSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"restaurants" | "attractions" | "hotels">("restaurants")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Coordenadas formateadas para la API
  const latLong = latitude && longitude ? `${latitude},${longitude}` : undefined

  // Realizar búsqueda
  const handleSearch = async () => {
    if (!searchQuery.trim() && !latLong) return

    setLoading(true)
    setError(null)

    try {
      const searchResults = await tripAdvisorService.searchLocations(
        searchQuery.trim() || destination,
        activeTab,
        latLong,
      )

      setResults(searchResults)

      if (searchResults.length === 0) {
        setError(
          `No se encontraron ${
            activeTab === "restaurants" ? "restaurantes" : activeTab === "attractions" ? "atracciones" : "hoteles"
          } para "${searchQuery || destination}"`,
        )
      }
    } catch (err) {
      console.error("Error searching places:", err)
      setError("Error al buscar lugares. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Buscar lugares cercanos al cargar el componente
  useEffect(() => {
    if (destination || latLong) {
      handleSearch()
    }
  }, [activeTab, destination, latLong])

  // Renderizar nivel de precio
  const renderPriceLevel = (priceLevel?: string) => {
    if (!priceLevel) return null

    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        {priceLevel}
      </Badge>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Lugares cercanos en {destination}</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid grid-cols-3 mx-4">
          <TabsTrigger value="restaurants">Restaurantes</TabsTrigger>
          <TabsTrigger value="attractions">Atracciones</TabsTrigger>
          <TabsTrigger value="hotels">Hoteles</TabsTrigger>
        </TabsList>

        <CardContent className="pt-4">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={`Buscar ${
                activeTab === "restaurants" ? "restaurantes" : activeTab === "attractions" ? "atracciones" : "hoteles"
              } en ${destination}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 border-b border-gray-100 pb-4">
                  <Skeleton className="h-16 w-16 rounded-md flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-gray-500">
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((place) => (
                <div key={place.location_id} className="flex gap-3 border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium">{place.name}</h4>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{place.address_obj?.street1 || place.address_obj?.city || "Dirección no disponible"}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {place.rating && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {place.rating.toFixed(1)}
                        </Badge>
                      )}

                      {renderPriceLevel(place.price_level)}
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="flex-shrink-0 h-8" asChild>
                    <a
                      href={place.web_url || `https://www.tripadvisor.com/${place.location_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              ))}

              {results.length === 0 && !error && (
                <div className="text-center py-6 text-gray-500">
                  <p>No se encontraron resultados. Intenta con otra búsqueda.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Tabs>
    </Card>
  )
}
