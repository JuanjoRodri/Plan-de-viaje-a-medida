"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Navigation, Clock, AlertTriangle, ExternalLink, ChevronRight, ChevronLeft } from "lucide-react"
import type { JsonItinerary, JsonActivity, Coordinates } from "@/types/itinerary-json"
import MapDebugPanel from "./debug/map-debug-panel"

// Declaración de tipos para window.google
declare global {
  interface Window {
    google: any
  }
}

interface ItineraryMapViewProps {
  itineraryJson: JsonItinerary | null
}

interface MapDisplayLocation {
  name: string
  address?: string
  coordinates: Coordinates
  time?: string // Hora de la actividad si aplica
  type: "activity" | "hotel"
  dayNumber?: number // Para actividades
  originalActivity?: JsonActivity // Referencia a la actividad original
}

export default function ItineraryMapView({ itineraryJson }: ItineraryMapViewProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [directions, setDirections] = useState<any | null>(null)
  const [totalDistance, setTotalDistance] = useState<string | null>(null)
  const [totalDuration, setTotalDuration] = useState<string | null>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const directionsRendererRef = useRef<any | null>(null)
  const activityMarkersRef = useRef<any[]>([])

  // Añadir esta función al inicio del componente
  const debugItineraryData = (itinerary: JsonItinerary | null) => {
    if (!itinerary) {
      console.log("🔍 DEBUG: No itinerary data available")
      return
    }

    console.log("🔍 DEBUG: Itinerary destination:", {
      name: itinerary.destination.name,
      coords: itinerary.destination.coordinates,
    })

    console.log("🔍 DEBUG: Hotel info:", {
      name: itinerary.preferences?.hotel?.name,
      coords: itinerary.preferences?.hotel?.coordinates,
      checkIn: itinerary.preferences?.hotel?.checkInTime,
      checkOut: itinerary.preferences?.hotel?.checkOutTime,
    })

    console.log("🔍 DEBUG: Days count:", itinerary.dailyPlans.length)

    itinerary.dailyPlans.forEach((day, idx) => {
      const activitiesWithCoords = day.activities.filter(
        (a) => a.location && isValidCoordinates(a.location.coordinates),
      ).length

      console.log(
        `🔍 DEBUG: Day ${day.dayNumber} - Activities: ${day.activities.length}, With coords: ${activitiesWithCoords}`,
      )
    })
  }

  // Cargar el script de Google Maps
  useEffect(() => {
    if (!window.google && !document.getElementById("google-maps-script")) {
      const script = document.createElement("script")
      script.id = "google-maps-script"
      // Asegúrate que la API Key está disponible y es correcta
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setError("API Key de Google Maps no configurada.")
        console.error("API Key de Google Maps no configurada.")
        return
      }
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=Function.prototype`
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log("🗺️ Google Maps script loaded via direct script tag.")
        setMapLoaded(true)
      }
      script.onerror = () => {
        setError("No se pudo cargar Google Maps. Por favor, verifica tu conexión a internet y la API Key.")
      }
      document.head.appendChild(script)
    } else if (window.google) {
      setMapLoaded(true)
    }
  }, [])

  // Inicializar el mapa
  useEffect(() => {
    if (mapLoaded && itineraryJson && mapRef.current && !mapInstanceRef.current) {
      try {
        const geocoder = new window.google.maps.Geocoder()
        const destinationName = itineraryJson.destination.name
        const destinationCoords = itineraryJson.destination.coordinates

        // Añadir log para depuración
        console.log("🔍 DEBUG: Destination info:", {
          name: destinationName,
          coords: destinationCoords,
          isValid: destinationCoords ? isValidCoordinates(destinationCoords) : false,
        })

        const initializeMapWithCoords = (coords: Coordinates) => {
          const normalizedCoords = normalizeCoordinates(coords) || coords

          const map = new window.google.maps.Map(mapRef.current!, {
            center: normalizedCoords,
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          })
          mapInstanceRef.current = map

          // Crear el DirectionsRenderer después de que el mapa esté listo
          setTimeout(() => {
            try {
              const directionsRenderer = new window.google.maps.DirectionsRenderer({
                map: map,
                suppressMarkers: true, // Suprimimos marcadores por defecto, los gestionaremos manualmente
                polylineOptions: {
                  strokeColor: "#0066cc",
                  strokeWeight: 5,
                  strokeOpacity: 0.7,
                },
              })
              directionsRendererRef.current = directionsRenderer
              console.log("🗺️ DirectionsRenderer initialized successfully")
            } catch (err) {
              console.error("Error initializing DirectionsRenderer:", err)
              setError(`Error al inicializar el renderizador de direcciones: ${err.message}`)
            }
          }, 500) // Pequeño retraso para asegurar que el mapa está completamente cargado

          console.log("🗺️ Map initialized.")
        }

        if (destinationCoords) {
          const normalizedDestCoords = normalizeCoordinates(destinationCoords)
          if (normalizedDestCoords) {
            console.log("🗺️ Using provided destination coordinates:", normalizedDestCoords)
            initializeMapWithCoords(normalizedDestCoords)
            return
          }
        }

        // Si no hay coordenadas válidas, geocodificar...
        if (destinationCoords && isValidCoordinates(destinationCoords)) {
          console.log("🗺️ Using provided destination coordinates:", destinationCoords)
          initializeMapWithCoords(destinationCoords)
        } else {
          console.log("🗺️ Geocoding destination:", destinationName)
          geocoder.geocode({ address: destinationName }, (results: any, status: string) => {
            if (status === "OK" && results && results[0]?.geometry?.location) {
              const loc = results[0].geometry.location
              initializeMapWithCoords({ lat: loc.lat(), lng: loc.lng() })
            } else {
              setError(`No se pudo geocodificar el destino: ${destinationName}. Estado: ${status}`)
              console.error(`Geocoding error for ${destinationName}: ${status}`)
            }
          })
        }
      } catch (err: any) {
        console.error("Error initializing map:", err)
        setError(`Error al inicializar el mapa: ${err.message}. Por favor, recarga la página.`)
      }
    }
  }, [mapLoaded, itineraryJson])

  // Llamar a esta función en el useEffect que maneja el itinerario
  useEffect(() => {
    if (itineraryJson) {
      debugItineraryData(itineraryJson)
    }
  }, [itineraryJson])

  // Efecto principal que maneja todo después de que el mapa esté listo
  useEffect(() => {
    // Esperar un poco más para asegurar que todo esté inicializado
    const timer = setTimeout(() => {
      if (mapLoaded && itineraryJson && mapInstanceRef.current) {
        console.log(`🗺️ Auto-calculating route and markers for day index: ${selectedDayIndex}`)
        calculateRouteAndMarkers(selectedDayIndex)
        // Eliminar showHotelMarker() ya que ahora el hotel se incluye en la ruta
      }
    }, 1000) // Aumentar el delay para asegurar que todo esté listo

    return () => clearTimeout(timer)
  }, [mapLoaded, itineraryJson, selectedDayIndex])

  const normalizeCoordinates = (coords: any): Coordinates | null => {
    if (!coords) return null

    let lat, lng

    if (typeof coords === "object") {
      lat = coords.lat || coords.latitude
      lng = coords.lng || coords.longitude || coords.lon
    } else if (typeof coords === "string") {
      const parts = coords.split(",").map((p) => p.trim())
      if (parts.length === 2) {
        lat = Number.parseFloat(parts[0])
        lng = Number.parseFloat(parts[1])
      }
    }

    if (typeof lat === "string") lat = Number.parseFloat(lat)
    if (typeof lng === "string") lng = Number.parseFloat(lng)

    if (typeof lat === "number" && !isNaN(lat) && typeof lng === "number" && !isNaN(lng)) {
      return { lat, lng }
    }

    return null
  }

  const isValidCoordinates = (coords?: any): coords is Coordinates => {
    if (!coords) return false

    // Intentar extraer lat y lng de diferentes formatos posibles
    let lat, lng

    if (typeof coords === "object") {
      // Formato objeto: { lat: number, lng: number }
      lat = coords.lat || coords.latitude
      lng = coords.lng || coords.longitude || coords.lon
    } else if (typeof coords === "string") {
      // Formato string: "lat,lng" o "lat, lng"
      const parts = coords.split(",").map((p) => p.trim())
      if (parts.length === 2) {
        lat = Number.parseFloat(parts[0])
        lng = Number.parseFloat(parts[1])
      }
    }

    // Convertir a número si es necesario
    if (typeof lat === "string") lat = Number.parseFloat(lat)
    if (typeof lng === "string") lng = Number.parseFloat(lng)

    // Validación muy básica - solo verificar que son números
    const isValidLat = typeof lat === "number" && !isNaN(lat)
    const isValidLng = typeof lng === "number" && !isNaN(lng)

    console.log(`🔍 DEBUG: Simplified coordinate validation:`, {
      input: coords,
      extracted: { lat, lng },
      isValid: isValidLat && isValidLng,
    })

    // Si son válidos, normalizar el objeto coords
    if (isValidLat && isValidLng && typeof coords === "object") {
      coords.lat = lat
      coords.lng = lng
    }

    return isValidLat && isValidLng
  }

  const clearActivityMarkers = () => {
    activityMarkersRef.current.forEach((marker) => {
      if (marker.infoWindow) {
        marker.infoWindow.close()
      }
      marker.setMap(null)
    })
    activityMarkersRef.current = []
  }

  const calculateRouteAndMarkers = async (dayIndex: number) => {
    if (!itineraryJson || !mapInstanceRef.current) {
      console.log("🔍 DEBUG: calculateRouteAndMarkers: Pre-conditions not met", {
        hasItinerary: !!itineraryJson,
        hasMap: !!mapInstanceRef.current,
      })
      return
    }

    // Limpiar estado previo
    clearActivityMarkers()

    // Limpiar direcciones previas de forma segura
    if (directionsRendererRef.current) {
      try {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#0066cc",
            strokeWeight: 5,
            strokeOpacity: 0.7,
          },
        })
      } catch (e) {
        console.error("Error reinitializing DirectionsRenderer:", e)
      }
    }

    setDirections(null)
    setTotalDistance(null)
    setTotalDuration(null)

    const currentDayPlan = itineraryJson.dailyPlans[dayIndex]
    if (!currentDayPlan) {
      console.log(`🔍 DEBUG: No day plan for index ${dayIndex}.`)
      return
    }

    // Obtener actividades válidas del día
    const activitiesForDay: MapDisplayLocation[] = currentDayPlan.activities
      .map((activity) => {
        if (!activity.location) return null

        const normalizedCoords = normalizeCoordinates(activity.location.coordinates)
        if (!normalizedCoords) return null

        return {
          name: activity.location.name,
          address: activity.location.address,
          coordinates: normalizedCoords,
          time: activity.startTime,
          type: "activity" as const,
          dayNumber: currentDayPlan.dayNumber,
          originalActivity: activity,
        }
      })
      .filter((loc): loc is MapDisplayLocation => loc !== null)

    console.log(`🗺️ Activities for day ${currentDayPlan.dayNumber}:`, activitiesForDay)

    // Obtener información del hotel y validar coordenadas
    const hotelInfo = itineraryJson.preferences?.hotel
    console.log("🏨 DEBUG: Hotel info raw:", hotelInfo)

    let hotelCoords: Coordinates | null = null
    if (hotelInfo?.coordinates) {
      hotelCoords = normalizeCoordinates(hotelInfo.coordinates)
      console.log("🏨 DEBUG: Hotel coordinates normalized:", hotelCoords)
    }

    const hasValidHotelCoords = hotelCoords && isValidCoordinates(hotelCoords)
    console.log("🏨 DEBUG: Has valid hotel coords:", hasValidHotelCoords)

    // Construir la lista final de ubicaciones
    const finalLocationsForDay: MapDisplayLocation[] = []

    // Lógica para determinar cuándo incluir el hotel
    let startFromHotel = false
    let endAtHotel = false

    if (hasValidHotelCoords && hotelInfo && activitiesForDay.length > 0) {
      const totalDays = itineraryJson.dailyPlans.length
      const isFirstDay = currentDayPlan.dayNumber === 1
      const isLastDay = currentDayPlan.dayNumber === totalDays

      // Obtener horarios de check-in/check-out (formato "HH:MM")
      const checkInTime = hotelInfo.checkInTime || "15:00"
      const checkOutTime = hotelInfo.checkOutTime || "11:00"

      // Función auxiliar para comparar horarios
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number)
        return hours * 60 + minutes
      }

      const firstActivityTime = activitiesForDay[0].time || "00:00"
      const lastActivityTime = activitiesForDay[activitiesForDay.length - 1].time || "23:59"

      // Decidir si empezar desde hotel
      if (!isFirstDay) {
        startFromHotel = true // Días intermedios siempre empiezan en hotel
      } else if (isFirstDay) {
        // Día 1: solo si la primera actividad es después del check-in
        startFromHotel = timeToMinutes(firstActivityTime) >= timeToMinutes(checkInTime)
      }

      // Decidir si terminar en hotel
      if (!isLastDay) {
        endAtHotel = true // Días intermedios siempre terminan en hotel
      } else if (isLastDay) {
        // Último día: solo si la última actividad es antes del check-out
        endAtHotel = timeToMinutes(lastActivityTime) <= timeToMinutes(checkOutTime)
      }

      console.log(`🏨 DEBUG: Day ${currentDayPlan.dayNumber} hotel logic:`, {
        isFirstDay,
        isLastDay,
        firstActivityTime,
        lastActivityTime,
        checkInTime,
        checkOutTime,
        startFromHotel,
        endAtHotel,
      })
    }

    // Añadir hotel al inicio si corresponde
    if (startFromHotel && hasValidHotelCoords && hotelInfo) {
      finalLocationsForDay.push({
        name: `🏨 ${hotelInfo.name}`,
        address: hotelInfo.address,
        coordinates: hotelCoords!,
        time: "Salida del hotel",
        type: "hotel" as const,
        dayNumber: currentDayPlan.dayNumber,
      })
      console.log("🏨 Added hotel at start")
    }

    // Añadir todas las actividades del día
    finalLocationsForDay.push(...activitiesForDay)

    // Añadir hotel al final si corresponde
    if (endAtHotel && hasValidHotelCoords && hotelInfo) {
      finalLocationsForDay.push({
        name: `🏨 ${hotelInfo.name}`,
        address: hotelInfo.address,
        coordinates: hotelCoords!,
        time: "Regreso al hotel",
        type: "hotel" as const,
        dayNumber: currentDayPlan.dayNumber,
      })
      console.log("🏨 Added hotel at end")
    }

    console.log(`🗺️ Final locations for day ${currentDayPlan.dayNumber}:`, finalLocationsForDay)

    if (finalLocationsForDay.length === 0) {
      console.log(`🗺️ No valid locations with coordinates for day ${currentDayPlan.dayNumber}.`)
      if (itineraryJson.destination.coordinates && isValidCoordinates(itineraryJson.destination.coordinates)) {
        mapInstanceRef.current.setCenter(itineraryJson.destination.coordinates)
        mapInstanceRef.current.setZoom(13)
      }
      return
    }

    const bounds = new window.google.maps.LatLngBounds()

    // Crear marcadores inmediatamente, sin esperar a las direcciones
    console.log("🗺️ Creating markers immediately...")
    finalLocationsForDay.forEach((loc, index) => {
      console.log(`🗺️ Creating marker ${index + 1} for:`, loc.name, loc.coordinates)

      const isHotel = loc.type === "hotel"
      const marker = new window.google.maps.Marker({
        position: { lat: loc.coordinates.lat, lng: loc.coordinates.lng },
        map: mapInstanceRef.current,
        title: loc.name,
        icon: isHotel
          ? {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(32, 32),
            }
          : undefined,
        label: isHotel
          ? { text: "H", color: "white", fontWeight: "bold" }
          : {
              text: (index + 1).toString(),
              color: "white",
              fontWeight: "bold",
            },
        animation: window.google.maps.Animation.DROP,
        zIndex: isHotel ? 100 : 1000 + index,
      })

      // Crear InfoWindow para cada marcador
      const activity = loc.originalActivity
      const infoContent = isHotel
        ? `
    <div style="max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          ${loc.name}
        </h3>
        <span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
          ${loc.time || "HOTEL"}
        </span>
      </div>
      
      ${
        loc.address
          ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #6b7280; font-size: 12px; display: flex; align-items: start; gap: 4px;">
            <span>📍</span>
            <span>${loc.address}</span>
          </div>
        </div>
      `
          : ""
      }
      
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
        <button 
          onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + (loc.address ? ", " + loc.address : ""))}', '_blank')"
          style="background: #8b5cf6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;"
          onmouseover="this.style.background='#7c3aed'"
          onmouseout="this.style.background='#8b5cf6'"
        >
          🔗 Ver en Google Maps
        </button>
      </div>
    </div>
  `
        : `
    <div style="max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          ${loc.name}
        </h3>
        <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
          <span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">
            ${activity?.type?.replace("_", " ") || "Actividad"}
          </span>
          ${loc.time ? `<span style="color: #6b7280; font-size: 12px;">⏰ ${loc.time}</span>` : ""}
        </div>
      </div>
      
      ${
        loc.address
          ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #6b7280; font-size: 12px; display: flex; align-items: start; gap: 4px;">
            <span>📍</span>
            <span>${loc.address}</span>
          </div>
        </div>
      `
          : ""
      }
      
      ${
        activity?.description
          ? `
        <div style="margin-bottom: 8px;">
          <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.4;">
            ${activity.description}
          </p>
        </div>
      `
          : ""
      }
      
      ${
        activity?.priceEstimate
          ? `
        <div style="margin-bottom: 8px;">
          <div style="color: #059669; font-size: 12px; font-weight: 500;">
            💰 ${
              typeof activity.priceEstimate === "object"
                ? `${activity.priceEstimate.amount} ${activity.priceEstimate.currency || "EUR"}`
                : activity.priceEstimate
            }
          </div>
        </div>
      `
          : ""
      }
      
      ${
        activity?.notes
          ? `
        <div style="margin-bottom: 8px; padding: 6px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;">
          <div style="font-size: 12px; color: #92400e;">
            📝 ${activity.notes}
          </div>
        </div>
      `
          : ""
      }
      
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
        <button 
          onclick="window.open('https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + (loc.address ? ", " + loc.address : ""))}', '_blank')"
          style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;"
          onmouseover="this.style.background='#2563eb'"
          onmouseout="this.style.background='#3b82f6'"
        >
          🔗 Ver en Google Maps
        </button>
      </div>
    </div>
  `

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 300,
      })

      // Añadir evento click al marcador
      marker.addListener("click", () => {
        // Cerrar otras InfoWindows abiertas
        activityMarkersRef.current.forEach((otherMarker, otherIndex) => {
          if (otherIndex !== index && otherMarker.infoWindow) {
            otherMarker.infoWindow.close()
          }
        })

        // Abrir esta InfoWindow
        infoWindow.open(mapInstanceRef.current, marker)
      })

      // Guardar referencia a la InfoWindow en el marcador
      marker.infoWindow = infoWindow

      activityMarkersRef.current.push(marker)
      bounds.extend({ lat: loc.coordinates.lat, lng: loc.coordinates.lng })
      console.log(`✅ Marker ${index + 1} created with InfoWindow and added to map`)
    })

    // Ajustar vista inmediatamente después de crear marcadores
    if (!bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds)
      console.log("🗺️ Map bounds adjusted to show all markers")
    }

    // Si hay más de una ubicación, intentar calcular la ruta
    if (finalLocationsForDay.length > 1 && window.google?.maps?.DirectionsService && directionsRendererRef.current) {
      console.log("🗺️ Calculating route between locations...")

      const directionsService = new window.google.maps.DirectionsService()
      const origin = finalLocationsForDay[0].coordinates
      const destination = finalLocationsForDay[finalLocationsForDay.length - 1].coordinates
      const waypoints = finalLocationsForDay.slice(1, -1).map((loc) => ({
        location: new window.google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng),
        stopover: true,
      }))

      try {
        directionsService.route(
          {
            origin: new window.google.maps.LatLng(origin.lat, origin.lng),
            destination: new window.google.maps.LatLng(destination.lat, destination.lng),
            waypoints: waypoints,
            optimizeWaypoints: false,
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (result: any, status: string) => {
            if (status === "OK" && result && typeof result === "object") {
              console.log("✅ Route calculated successfully")

              try {
                directionsRendererRef.current!.setDirections(result)
                setDirections(result)

                if (result.routes && result.routes.length > 0 && result.routes[0].legs) {
                  let totalDistVal = 0
                  let totalDurVal = 0

                  result.routes[0].legs.forEach((leg: any) => {
                    totalDistVal += leg.distance?.value || 0
                    totalDurVal += leg.duration?.value || 0
                  })

                  setTotalDistance(totalDistVal < 1000 ? `${totalDistVal} m` : `${(totalDistVal / 1000).toFixed(1)} km`)

                  const hours = Math.floor(totalDurVal / 3600)
                  const minutes = Math.floor((totalDurVal % 3600) / 60)
                  setTotalDuration(hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`)
                }
              } catch (renderError) {
                console.error("Error rendering directions:", renderError)
                setError(`Error al renderizar la ruta: ${renderError.message}`)
              }
            } else {
              console.warn("Could not calculate route:", status)
              // Aún así, ajustar el mapa para mostrar todos los marcadores
              if (!bounds.isEmpty()) {
                mapInstanceRef.current.fitBounds(bounds)
              }
            }
          },
        )
      } catch (e) {
        console.error("Error requesting directions:", e)
        // Ajustar el mapa para mostrar todos los marcadores
        if (!bounds.isEmpty()) {
          mapInstanceRef.current.fitBounds(bounds)
        }
      }
    }
  }

  const goToPreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1)
    }
  }

  const goToNextDay = () => {
    if (itineraryJson && selectedDayIndex < itineraryJson.dailyPlans.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1)
    }
  }

  const openInGoogleMaps = () => {
    if (!directions || !directions.routes[0] || !itineraryJson) return

    const route = directions.routes[0]
    const currentDayPlan = itineraryJson.dailyPlans[selectedDayIndex]
    if (!currentDayPlan) return

    const locationsForDay = currentDayPlan.activities
      .filter((activity) => activity.location && isValidCoordinates(activity.location.coordinates))
      .map((activity) => activity.location!.coordinates!)

    if (locationsForDay.length === 0) return

    let mapsUrl = `https://www.google.com/maps/dir/`
    locationsForDay.forEach((coord) => {
      mapsUrl += `${coord.lat},${coord.lng}/`
    })
    mapsUrl += `@${locationsForDay[0].lat},${locationsForDay[0].lng},12z` // Center point and zoom
    mapsUrl += `?entry=ttu&travelmode=driving` // travelmode puede ser driving o walking

    window.open(mapsUrl, "_blank")
  }

  if (!itineraryJson) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No hay datos de itinerario para mostrar en el mapa.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const currentDayPlan = itineraryJson.dailyPlans[selectedDayIndex]
  const dayLocationsForList =
    currentDayPlan?.activities
      .filter((activity) => activity.location) // No es necesario chequear coords aquí, solo para la lista
      .map((activity) => ({
        name: activity.location!.name,
        address: activity.location!.address,
        time: activity.startTime,
        // Para el botón "Ver en Google Maps", necesitamos una URL o coordenadas
        // Si tenemos coordenadas, podemos construir una URL de búsqueda
        mapQuery: activity.location!.coordinates
          ? `${activity.location!.coordinates.lat},${activity.location!.coordinates.lng}`
          : activity.location!.name + (itineraryJson.destination.name ? `, ${itineraryJson.destination.name}` : ""),
      })) || []

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Mapa del itinerario</CardTitle>
          {itineraryJson.dailyPlans.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousDay}
                disabled={selectedDayIndex === 0}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Día anterior</span>
              </Button>
              <div className="text-sm font-medium">
                Día {selectedDayIndex + 1} de {itineraryJson.dailyPlans.length}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextDay}
                disabled={selectedDayIndex === itineraryJson.dailyPlans.length - 1}
                className="h-8 w-8 p-0 bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Día siguiente</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="map">Mapa</TabsTrigger>
            <TabsTrigger value="list">Lista de lugares</TabsTrigger>
          </TabsList>
          <TabsContent value="map">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {currentDayPlan && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">
                  {currentDayPlan.title || `Día ${currentDayPlan.dayNumber}`}
                </h3>
                <div className="text-sm text-muted-foreground mb-2">
                  {dayLocationsForList.length} {dayLocationsForList.length === 1 ? "lugar" : "lugares"} para visitar
                </div>
                {totalDistance && totalDuration && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      <span>Distancia total: {totalDistance}</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Tiempo estimado: {totalDuration}</span>
                    </Badge>
                  </div>
                )}
                {directions && dayLocationsForList.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInGoogleMaps}
                    className="flex items-center gap-1 mb-3 bg-transparent"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Abrir ruta en Google Maps</span>
                  </Button>
                )}
              </div>
            )}
            {/* Panel de depuración */}
            <MapDebugPanel itinerary={itineraryJson} selectedDayIndex={selectedDayIndex} />

            {/* Mapa */}
            <div ref={mapRef} className="w-full h-[400px] rounded-md border" style={{ backgroundColor: "#f0f0f0" }}>
              {!mapLoaded && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Skeleton className="h-[300px] w-full" />
                    <div className="mt-2">Cargando mapa...</div>
                  </div>
                </div>
              )}
            </div>
            {currentDayPlan && dayLocationsForList.length === 0 && !error && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No hay ubicaciones con coordenadas válidas para mostrar en el mapa para este día.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="list">
            {currentDayPlan ? (
              <>
                <h3 className="text-lg font-medium mb-3">
                  {currentDayPlan.title || `Día ${currentDayPlan.dayNumber}`}
                </h3>
                {dayLocationsForList.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>No hay ubicaciones definidas para este día.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {dayLocationsForList.map((location, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                        <div className="bg-primary/10 p-2 rounded-full mt-1">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{location.name}</div>
                          {location.address && <div className="text-xs text-muted-foreground">{location.address}</div>}
                          {location.time && (
                            <div className="text-xs text-muted-foreground mt-1">Hora: {location.time}</div>
                          )}
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs bg-transparent"
                              onClick={() =>
                                window.open(
                                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.mapQuery)}`,
                                  "_blank",
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver en Google Maps
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Selecciona un día para ver los lugares.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
