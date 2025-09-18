"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Info } from "lucide-react"
import { tripAdvisorService } from "@/app/services/tripadvisor-enhanced-service"
import { estimateRestaurantPrice } from "@/app/services/price-estimation-service"

interface EnhancedPriceInfoProps {
  placeName: string
  destination: string
  placeId?: string
  tripAdvisorId?: string
  priceLevel?: number
  numPeople?: number
  className?: string
}

export default function EnhancedPriceInfo({
  placeName,
  destination,
  placeId,
  tripAdvisorId,
  priceLevel,
  numPeople = 1,
  className = "",
}: EnhancedPriceInfoProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceInfo, setPriceInfo] = useState<{
    priceRange?: string
    averagePrice?: number
    priceLevel?: number
    source: "google" | "tripadvisor" | "estimation"
    isEstimated: boolean
  }>({
    source: "estimation",
    isEstimated: true,
  })

  useEffect(() => {
    async function fetchPriceInfo() {
      setLoading(true)
      setError(null)

      try {
        // Si tenemos un ID de TripAdvisor, usamos eso primero
        if (tripAdvisorId) {
          const details = await tripAdvisorService.getLocationDetails(tripAdvisorId)
          if (details) {
            const taPrice = tripAdvisorService.extractPriceInfo(details)
            setPriceInfo({
              priceRange: tripAdvisorService.formatPriceRange(taPrice),
              averagePrice: taPrice.averagePrice,
              priceLevel: tripAdvisorService.convertPriceLevelToNumber(details.price_level),
              source: "tripadvisor",
              isEstimated: false,
            })
            setLoading(false)
            return
          }
        }

        // Si no tenemos ID de TripAdvisor o falló, intentamos buscar por nombre
        const restaurant = await tripAdvisorService.searchRestaurant(placeName, destination)
        if (restaurant) {
          const details = await tripAdvisorService.getLocationDetails(restaurant.location_id)
          if (details) {
            const taPrice = tripAdvisorService.extractPriceInfo(details)
            setPriceInfo({
              priceRange: tripAdvisorService.formatPriceRange(taPrice),
              averagePrice: taPrice.averagePrice,
              priceLevel: tripAdvisorService.convertPriceLevelToNumber(details.price_level),
              source: "tripadvisor",
              isEstimated: false,
            })
            setLoading(false)
            return
          }
        }

        // Si todo lo anterior falló, usamos el nivel de precio de Google o una estimación
        const estimatedPrice = estimateRestaurantPrice(priceLevel, destination, numPeople)
        setPriceInfo({
          priceRange: estimatedPrice,
          priceLevel,
          source: priceLevel !== undefined ? "google" : "estimation",
          isEstimated: true,
        })
      } catch (err) {
        console.error("Error fetching price info:", err)
        setError("No se pudo obtener información de precios")

        // Usar estimación como fallback
        const estimatedPrice = estimateRestaurantPrice(priceLevel, destination, numPeople)
        setPriceInfo({
          priceRange: estimatedPrice,
          priceLevel,
          source: "estimation",
          isEstimated: true,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPriceInfo()
  }, [placeName, destination, placeId, tripAdvisorId, priceLevel, numPeople])

  // Renderizar nivel de precio con iconos
  const renderPriceLevel = (level?: number) => {
    if (!level) return "No disponible"

    const symbols = []
    for (let i = 0; i < 4; i++) {
      symbols.push(
        <DollarSign key={i} className={`h-4 w-4 ${i < level ? "text-green-600 fill-green-600" : "text-gray-300"}`} />,
      )
    }

    return <div className="flex">{symbols}</div>
  }

  // Determinar el color del badge según la fuente
  const getSourceBadgeColor = () => {
    switch (priceInfo.source) {
      case "tripadvisor":
        return "bg-blue-100 text-blue-800"
      case "google":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Obtener texto de la fuente
  const getSourceText = () => {
    switch (priceInfo.source) {
      case "tripadvisor":
        return "TripAdvisor"
      case "google":
        return "Google"
      default:
        return "Estimación"
    }
  }

  if (loading) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Información de precios</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Información de precios</CardTitle>
          <Badge variant="outline" className={getSourceBadgeColor()}>
            {getSourceText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500 mb-1">Rango de precios:</p>
            <p className="font-medium">{priceInfo.priceRange || "No disponible"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Nivel de precio:</p>
            {renderPriceLevel(priceInfo.priceLevel)}
          </div>

          {priceInfo.averagePrice && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Precio medio por persona:</p>
              <p className="font-medium">{priceInfo.averagePrice}€</p>
            </div>
          )}

          {priceInfo.isEstimated && (
            <div className="flex items-start mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <Info className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
              <p>Esta información es una estimación basada en datos disponibles. Los precios reales pueden variar.</p>
            </div>
          )}

          {numPeople > 1 && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p className="text-sm text-gray-500 mb-1">Precio estimado para {numPeople} personas:</p>
              <p className="font-medium">
                {priceInfo.averagePrice
                  ? `${priceInfo.averagePrice * numPeople}€ aprox.`
                  : `${priceInfo.priceRange} (total grupo)`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
