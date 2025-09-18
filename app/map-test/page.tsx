"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ItineraryMapView from "@/components/itinerary-map-view"
import ItineraryCoordinatesFixer from "@/components/itinerary-coordinates-fixer"
import { MapPin, Bug } from "lucide-react"
import type { JsonItinerary } from "@/types/itinerary-json"
import SimpleMapTest from "@/components/simple-map-test"

// Modificar el itinerario de ejemplo para asegurarnos de que tiene coordenadas válidas
// Buscar la definición de sampleItinerary y actualizar las coordenadas:

const sampleItinerary: JsonItinerary = {
  id: "test-itinerary-1",
  title: "Viaje de prueba a Madrid",
  destination: {
    name: "Madrid, España",
    // Coordenadas de Madrid (asegurarse de que son números, no strings)
    coordinates: { lat: 40.416775, lng: -3.70379 },
  },
  dates: {
    startDate: "2023-07-15",
    endDate: "2023-07-18",
    durationDays: 4,
  },
  preferences: {
    hotel: {
      name: "Hotel Prado Madrid",
      address: "Calle del Prado 6, Madrid",
      // Añadir coordenadas explícitas para el hotel
      coordinates: { lat: 40.4154, lng: -3.6975 },
    },
  },
  dailyPlans: [
    {
      id: "day-1",
      dayNumber: 1,
      title: "Día 1: Centro histórico",
      date: "2023-07-15",
      activities: [
        {
          id: "act-1-1",
          title: "Desayuno en Plaza Mayor",
          type: "meal",
          startTime: "09:00",
          endTime: "10:00",
          location: {
            name: "Plaza Mayor",
            address: "Plaza Mayor, Madrid",
            // Añadir coordenadas explícitas
            coordinates: { lat: 40.4156, lng: -3.7074 },
          },
        },
        {
          id: "act-1-2",
          title: "Visita al Palacio Real",
          type: "activity",
          startTime: "10:30",
          endTime: "12:30",
          location: {
            name: "Palacio Real de Madrid",
            address: "Calle de Bailén, s/n, 28071 Madrid",
            // Añadir coordenadas explícitas
            coordinates: { lat: 40.418, lng: -3.7144 },
          },
        },
        {
          id: "act-1-3",
          title: "Almuerzo en Mercado San Miguel",
          type: "meal",
          startTime: "13:00",
          endTime: "14:30",
          location: {
            name: "Mercado de San Miguel",
            address: "Plaza de San Miguel, s/n, 28005 Madrid",
            // Añadir coordenadas explícitas
            coordinates: { lat: 40.4153, lng: -3.7091 },
          },
        },
        {
          id: "act-1-4",
          title: "Visita al Museo del Prado",
          type: "activity",
          startTime: "15:00",
          endTime: "18:00",
          location: {
            name: "Museo del Prado",
            address: "Paseo del Prado, s/n, 28014 Madrid",
            // Añadir coordenadas explícitas
            coordinates: { lat: 40.4138, lng: -3.6921 },
          },
        },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      title: "Día 2: Parques y museos",
      date: "2023-07-16",
      activities: [
        {
          id: "act-2-1",
          title: "Paseo por El Retiro",
          type: "activity",
          startTime: "10:00",
          endTime: "12:00",
          location: {
            name: "Parque del Retiro",
            address: "Plaza de la Independencia, 7, 28001 Madrid",
            // Añadir coordenadas explícitas
            coordinates: { lat: 40.4146, lng: -3.6877 },
          },
        },
        {
          id: "act-2-2",
          title: "Visita al Museo Reina Sofía",
          type: "activity",
          startTime: "12:30",
          endTime: "14:30",
          location: {
            name: "Museo Reina Sofía",
            address: "Calle de Santa Isabel, 52, 28012 Madrid",
            // Añadir coordenadas explícitas
            coordinates: { lat: 40.4079, lng: -3.6944 },
          },
        },
      ],
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export default function MapTestPage() {
  const [itinerary, setItinerary] = useState<JsonItinerary>(sampleItinerary)
  const [activeTab, setActiveTab] = useState("map")

  const handleFixComplete = (fixedItinerary: JsonItinerary) => {
    setItinerary(fixedItinerary)
    // Cambiar a la pestaña del mapa después de arreglar las coordenadas
    setActiveTab("map")
  }

  const logItineraryData = () => {
    console.log("🔍 DEBUG: Itinerary data:", itinerary)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <MapPin className="h-6 w-6 mr-2 text-primary" />
        Prueba del Mapa de Itinerario
      </h1>

      <Button variant="outline" className="mb-4" onClick={logItineraryData}>
        <Bug className="h-4 w-4 mr-2" />
        Log datos del itinerario
      </Button>

      <Button
        variant="outline"
        className="mb-4 ml-2"
        onClick={() => {
          // Forzar recreación de marcadores para el día actual
          console.log("🔧 Forcing marker recreation...")
          if (window.google && window.google.maps) {
            console.log("✅ Google Maps API is available")
          } else {
            console.log("❌ Google Maps API is not available")
          }
        }}
      >
        <MapPin className="h-4 w-4 mr-2" />
        Verificar Google Maps API
      </Button>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="simple">0. Prueba Simple</TabsTrigger>
          <TabsTrigger value="fix">1. Verificar Coordenadas</TabsTrigger>
          <TabsTrigger value="map">2. Ver Mapa</TabsTrigger>
        </TabsList>

        <TabsContent value="simple">
          <SimpleMapTest />
        </TabsContent>

        <TabsContent value="fix">
          <Card>
            <CardHeader>
              <CardTitle>Paso 1: Verificar y corregir coordenadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ItineraryCoordinatesFixer itinerary={itinerary} onFixComplete={handleFixComplete} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Paso 2: Visualizar el mapa del itinerario</CardTitle>
            </CardHeader>
            <CardContent>
              <ItineraryMapView itineraryJson={itinerary} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
