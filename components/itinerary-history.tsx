"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertCircle, History, FileText, CalendarDays, Users, Hotel, Clock, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export type JsonItinerary = any
export type JsonWeatherData = any

export type ApiItineraryType = {
  id: string
  html_content: string | null
  json_content?: JsonItinerary | string | null
  title?: string
  destination: string
  days: number
  nights?: number
  hotel?: string
  travelers: number
  is_favorite?: boolean
  created_at: string
  updated_at: string
  weather_data?: JsonWeatherData
  budget_type?: string
  auto_saved?: boolean
}

export type ItineraryHistoryItem = {
  id: string
  htmlContent: string | null
  json_content?: JsonItinerary | string | null
  title?: string
  destination: string
  days: string
  nights: string
  hotel?: string
  travelers: string
  isFavorite: boolean
  createdAt: number
  updatedAt: number
  weather_data?: JsonWeatherData
  budget_type?: string
  auto_saved?: boolean
}

// Cambiamos el endpoint para usar el endpoint general con el tipo correcto
const API_ENDPOINT = "/api/itineraries"

const ItineraryHistoryModal: React.FC<{ onLoadItinerary: (item: ItineraryHistoryItem) => void }> = ({
  onLoadItinerary,
}) => {
  const [historyItems, setHistoryItems] = useState<ItineraryHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistoryItems()
  }, [])

  const fetchHistoryItems = async () => {
    setLoading(true)
    setError(null)
    try {
      // Usamos el endpoint general con type=history para obtener solo los itinerarios del historial
      const response = await fetch(`${API_ENDPOINT}?type=history&limit=50&page=1`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const mappedItems: ItineraryHistoryItem[] = (data.itineraries || [])
        .map((item: ApiItineraryType) => ({
          id: item.id,
          htmlContent: item.html_content,
          json_content: item.json_content,
          title: item.title || `Viaje a ${item.destination}`,
          destination: item.destination,
          days: item.days.toString(),
          nights: (item.nights ?? (item.days > 0 ? item.days - 1 : 0)).toString(),
          hotel: item.hotel || "No especificado",
          travelers: item.travelers.toString(),
          isFavorite: item.is_favorite || false,
          createdAt: new Date(item.created_at).getTime(),
          updatedAt: new Date(item.updated_at || item.created_at).getTime(),
          weather_data: item.weather_data,
          budget_type: item.budget_type,
          auto_saved: item.auto_saved,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt)
      setHistoryItems(mappedItems)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center text-2xl">
          <History className="mr-2 h-6 w-6" /> Historial de Itinerarios
        </DialogTitle>
        <DialogDescription>
          Aquí puedes ver y cargar itinerarios generados o guardados automáticamente.
        </DialogDescription>
      </DialogHeader>

      {/* This div is crucial for ScrollArea height calculation within a flex container */}
      <div className="relative flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-1/4 mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-600 p-4">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Error al cargar el historial</p>
            <p className="text-sm text-center">{error}</p>
            <Button onClick={fetchHistoryItems} variant="outline" className="mt-4">
              Reintentar
            </Button>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <FileText className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">No hay itinerarios en el historial</p>
            <p className="text-sm text-center">Empieza a generar itinerarios para verlos aquí.</p>
          </div>
        ) : (
          <ScrollArea className="h-full w-full px-1">
            <div className="space-y-3 p-1">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-primary">{item.title}</h3>
                    {item.auto_saved && (
                      <Badge variant="outline" className="text-xs">
                        Auto-guardado
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center">
                      <CalendarDays className="mr-2 h-4 w-4 text-sky-600" /> {item.days} días, {item.nights} noches
                    </p>
                    <p className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-green-600" /> {item.travelers}{" "}
                      {Number(item.travelers) === 1 ? "persona" : "personas"}
                    </p>
                    {item.hotel && item.hotel !== "No especificado" && (
                      <p className="flex items-center">
                        <Hotel className="mr-2 h-4 w-4 text-purple-600" /> Hotel: {item.hotel}
                      </p>
                    )}
                    {item.budget_type && (
                      <p className="flex items-center">
                        <Tag className="mr-2 h-4 w-4 text-amber-600" /> Presupuesto: {item.budget_type}
                      </p>
                    )}
                    <p className="flex items-center pt-1">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" /> Última modificación: {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onLoadItinerary(item)}
                    className="mt-3 w-full sm:w-auto"
                    variant="default"
                    size="sm"
                  >
                    Cargar Itinerario
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <DialogFooter className="pt-4 border-t mt-auto">
        <Button
          onClick={async () => {
            if (confirm("¿Estás seguro de que quieres vaciar todo el historial? Esta acción no se puede deshacer.")) {
              try {
                const response = await fetch("/api/itineraries/clear-history", {
                  method: "DELETE",
                })
                if (response.ok) {
                  setHistoryItems([])
                } else {
                  alert("Error al vaciar el historial")
                }
              } catch (error) {
                alert("Error al vaciar el historial")
              }
            }
          }}
          variant="destructive"
          size="sm"
        >
          Vaciar historial
        </Button>
        <DialogClose asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}

export default ItineraryHistoryModal
