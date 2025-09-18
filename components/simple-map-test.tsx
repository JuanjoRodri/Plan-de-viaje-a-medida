"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimpleMapTest() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [markersCreated, setMarkersCreated] = useState(false)

  useEffect(() => {
    if (window.google && !mapInstanceRef.current && mapRef.current) {
      console.log("🗺️ Creating simple test map...")

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 40.416775, lng: -3.70379 }, // Madrid
        zoom: 13,
      })

      mapInstanceRef.current = map
      setMapLoaded(true)
      console.log("✅ Simple test map created")
    }
  }, [])

  const createTestMarkers = () => {
    if (!mapInstanceRef.current) {
      console.log("❌ Map not ready")
      return
    }

    console.log("🗺️ Creating test markers...")

    const testLocations = [
      { lat: 40.4156, lng: -3.7074, name: "Plaza Mayor" },
      { lat: 40.418, lng: -3.7144, name: "Palacio Real" },
      { lat: 40.4153, lng: -3.7091, name: "Mercado San Miguel" },
      { lat: 40.4138, lng: -3.6921, name: "Museo del Prado" },
    ]

    testLocations.forEach((location, index) => {
      try {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapInstanceRef.current,
          title: location.name,
          label: {
            text: (index + 1).toString(),
            color: "white",
            fontWeight: "bold",
          },
          animation: window.google.maps.Animation.DROP,
        })

        console.log(`✅ Test marker ${index + 1} created: ${location.name}`)

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><h3>${location.name}</h3><p>Marcador de prueba ${index + 1}</p></div>`,
        })

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })
      } catch (error) {
        console.error(`❌ Error creating test marker ${index + 1}:`, error)
      }
    })

    setMarkersCreated(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prueba Simple de Marcadores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={createTestMarkers} disabled={!mapLoaded} variant={markersCreated ? "secondary" : "default"}>
            {markersCreated ? "Marcadores Creados ✅" : "Crear Marcadores de Prueba"}
          </Button>
        </div>

        <div ref={mapRef} className="w-full h-[400px] rounded-md border" style={{ backgroundColor: "#f0f0f0" }}>
          {!mapLoaded && (
            <div className="w-full h-full flex items-center justify-center">
              <div>Cargando mapa simple...</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
