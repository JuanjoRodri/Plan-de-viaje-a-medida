"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import {
  AlertCircle,
  FolderOpen,
  FileText,
  CalendarDays,
  Users,
  Hotel,
  Clock,
  Tag,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

export type JsonItinerary = any
export type JsonWeatherData = any

export type ApiSavedItineraryType = {
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
}

export type SavedItinerary = {
  id: string
  html: string | null
  json_content?: JsonItinerary | string | null
  title?: string
  destination: string
  days: string
  nights: string
  hotel: string
  travelers: string
  is_favorite: boolean
  savedAt: number
  updatedAt: number
  weather_data?: JsonWeatherData
  budget?: string
}

const API_ENDPOINT = "/api/itineraries"

const SavedItinerariesModal: React.FC<{ onLoadItinerary: (itinerary: SavedItinerary) => void }> = ({
  onLoadItinerary,
}) => {
  const [savedItems, setSavedItems] = useState<SavedItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState<string>("")
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSavedItems()
  }, [])

  useEffect(() => {
    // Cuando se activa el modo edición, enfoca el input
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  const fetchSavedItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_ENDPOINT}?type=saved&limit=50&page=1`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const mappedItems: SavedItinerary[] = (data.itineraries || [])
        .map((item: ApiSavedItineraryType) => ({
          id: item.id,
          html: item.html_content,
          json_content: item.json_content,
          title: item.title || `Viaje a ${item.destination}`,
          destination: item.destination,
          days: item.days.toString(),
          nights: (item.nights ?? (item.days > 0 ? item.days - 1 : 0)).toString(),
          hotel: item.hotel || "No especificado",
          travelers: item.travelers.toString(),
          is_favorite: item.is_favorite || true,
          savedAt: new Date(item.created_at).getTime(),
          updatedAt: new Date(item.updated_at || item.created_at).getTime(),
          weather_data: item.weather_data,
          budget: item.budget_type,
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt)
      setSavedItems(mappedItems)
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

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const saveTitle = async (id: string) => {
    if (!editTitle.trim()) {
      toast({
        title: "Error",
        description: "El título no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    setProcessingIds((prev) => new Set(prev).add(id))

    try {
      const response = await fetch(`/api/itineraries/${id}/update-title`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitle }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Actualizar el título en la lista local
      setSavedItems((items) => items.map((item) => (item.id === id ? { ...item, title: editTitle } : item)))

      toast({
        title: "Éxito",
        description: "Título actualizado correctamente",
      })

      setEditingId(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al actualizar el título: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const removeFromFavorites = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres quitar este itinerario de favoritos?")) {
      return
    }

    setProcessingIds((prev) => new Set(prev).add(id))

    try {
      const response = await fetch(`/api/itineraries/${id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_favorite: false }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Eliminar el itinerario de la lista local
      setSavedItems((items) => items.filter((item) => item.id !== id))

      toast({
        title: "Éxito",
        description: "Itinerario eliminado de favoritos",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al eliminar de favoritos: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const isProcessing = (id: string) => processingIds.has(id)

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center text-2xl">
          <FolderOpen className="mr-2 h-6 w-6" /> Itinerarios Guardados
        </DialogTitle>
        <DialogDescription>Aquí puedes ver y cargar itinerarios que has guardado como favoritos.</DialogDescription>
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
            <p className="text-xl font-semibold">Error al cargar los itinerarios guardados</p>
            <p className="text-sm text-center">{error}</p>
            <Button onClick={fetchSavedItems} variant="outline" className="mt-4">
              Reintentar
            </Button>
          </div>
        ) : savedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
            <FileText className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">No hay itinerarios guardados</p>
            <p className="text-sm text-center">Guarda itinerarios como favoritos para verlos aquí.</p>
          </div>
        ) : (
          <ScrollArea className="h-full w-full px-1">
            <div className="space-y-3 p-1">
              {savedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card"
                >
                  <div className="flex justify-between items-start mb-2">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="font-semibold text-lg"
                          placeholder="Título del itinerario"
                          disabled={isProcessing(item.id)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveTitle(item.id)}
                          disabled={isProcessing(item.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing} disabled={isProcessing(item.id)}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg text-primary">{item.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(item.id, item.title || "")}
                            disabled={isProcessing(item.id)}
                            title="Editar título"
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromFavorites(item.id)}
                            disabled={isProcessing(item.id)}
                            title="Quitar de favoritos"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </>
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
                    {item.budget && (
                      <p className="flex items-center">
                        <Tag className="mr-2 h-4 w-4 text-amber-600" /> Presupuesto: {item.budget}
                      </p>
                    )}
                    <p className="flex items-center pt-1">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" /> Guardado: {formatDate(item.savedAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onLoadItinerary(item)}
                    className="mt-3 w-full sm:w-auto"
                    variant="default"
                    size="sm"
                    disabled={isProcessing(item.id)}
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
        <DialogClose asChild>
          <Button variant="outline">Cerrar</Button>
        </DialogClose>
      </DialogFooter>
    </>
  )
}

export default SavedItinerariesModal
