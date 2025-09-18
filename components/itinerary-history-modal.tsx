"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { AlertCircle, History, FileText, CalendarDays, Users, Hotel, Clock, Tag, Loader2, Trash2 } from "lucide-react"
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
  const [clearingHistory, setClearingHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    fetchHistoryItems()
  }, [])

  const fetchHistoryItems = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("🔍 Fetching history items...")
      // Usamos el endpoint general con type=history para obtener solo los itinerarios del historial
      const response = await fetch(`${API_ENDPOINT}?type=history&limit=50&page=1`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("📊 History data received:", data.itineraries?.length || 0, "items")

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
      console.log("✅ History items set:", mappedItems.length)
    } catch (error: any) {
      console.error("❌ Error fetching history:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    console.log("🗑️ Starting clear history...")
    setClearingHistory(true)
    try {
      const response = await fetch("/api/itineraries/clear-history", {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al limpiar historial")
      }

      console.log("✅ History cleared successfully")
      // Recargar la lista después de limpiar
      await fetchHistoryItems()
      setShowClearConfirm(false)

      // Mostrar mensaje de éxito (opcional)
      alert("Historial limpiado correctamente")
    } catch (error: any) {
      console.error("❌ Error clearing history:", error)
      alert(`Error al limpiar historial: ${error.message}`)
    } finally {
      setClearingHistory(false)
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

  // Debug: Log del estado actual
  console.log("🔍 Modal state:", {
    loading,
    error,
    historyItemsCount: historyItems.length,
    clearingHistory,
    showClearConfirm,
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center text-2xl">
          <History className="mr-2 h-6 w-6" /> Historial de Itinerarios
        </DialogTitle>
        <DialogDescription>
          Aquí puedes ver todos tus itinerarios ordenados por fecha.
          {historyItems.length > 0 && ` (${historyItems.length} encontrados)`}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-primary">{item.title}</h3>
                      {item.isFavorite ? (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                          Guardado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                          Temporal
                        </Badge>
                      )}
                    </div>
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

      {/* Modal de confirmación para limpiar historial */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              ¿Confirmar limpieza del historial?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Esta acción eliminará todos los itinerarios temporales del historial. Los itinerarios guardados como
              favoritos se mantendrán intactos.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearingHistory}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClearHistory} disabled={clearingHistory} className="flex-1">
                {clearingHistory ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Limpiando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER CON BOTONES - SIMPLIFICADO Y SIEMPRE VISIBLE */}
      <DialogFooter className="pt-4 border-t mt-auto flex flex-row justify-between items-center">
        {/* BOTÓN DE LIMPIAR - SIEMPRE VISIBLE */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            console.log("🗑️ Clear button clicked!")
            setShowClearConfirm(true)
          }}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Limpiar Historial
        </Button>

        {/* BOTÓN DE CERRAR */}
        <DialogClose asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}

export default ItineraryHistoryModal
