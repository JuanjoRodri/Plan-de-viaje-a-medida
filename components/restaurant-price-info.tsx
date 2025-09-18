"use client"

import { useState, useEffect } from "react"
import { getRestaurantPriceDetails } from "@/app/services/restaurant-price-service"

interface RestaurantPriceInfoProps {
  restaurantName: string
  placeId?: string
  destination: string
  numPeople?: number
}

export default function RestaurantPriceInfo({
  restaurantName,
  placeId,
  destination,
  numPeople = 1,
}: RestaurantPriceInfoProps) {
  const [priceInfo, setPriceInfo] = useState<{
    priceRange?: string
    averagePrice?: number
    source: string
    isLoading: boolean
    error?: string
  }>({
    isLoading: true,
    source: "estimation",
  })

  useEffect(() => {
    const fetchPriceInfo = async () => {
      try {
        setPriceInfo((prev) => ({ ...prev, isLoading: true }))

        const priceDetails = await getRestaurantPriceDetails(placeId, restaurantName, destination, numPeople)

        setPriceInfo({
          priceRange: priceDetails.priceRange,
          averagePrice: priceDetails.averagePrice,
          source: priceDetails.source,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error fetching price info:", error)
        setPriceInfo({
          source: "estimation",
          isLoading: false,
          error: "No se pudo obtener información de precios",
        })
      }
    }

    fetchPriceInfo()
  }, [restaurantName, placeId, destination, numPeople])

  // Iconos para las diferentes fuentes
  const sourceIcons = {
    google: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-500"
      >
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
        <path d="m12 8 4 4-4 4" />
        <path d="m8 12h8" />
      </svg>
    ),
    tripadvisor: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-500"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
    estimation: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-500"
      >
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  }

  if (priceInfo.isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 animate-pulse">
        <span>Cargando precios...</span>
      </div>
    )
  }

  if (priceInfo.error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-500">
        <span>{priceInfo.error}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="font-medium">Precio:</span>
      <span>{priceInfo.priceRange}</span>
      {priceInfo.averagePrice && (
        <span className="text-green-600 font-medium">(Media: {priceInfo.averagePrice}€ p.p.)</span>
      )}
      <span className="inline-flex items-center" title={`Fuente: ${priceInfo.source}`}>
        {sourceIcons[priceInfo.source as keyof typeof sourceIcons]}
      </span>
    </div>
  )
}
