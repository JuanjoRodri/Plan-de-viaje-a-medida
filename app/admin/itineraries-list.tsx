"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Eye, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Itinerary {
  id: string
  title: string
  destination: string
  days: number
  travelers: number
  created_at: string
  user_name: string
  user_email: string
}

export default function AdminItinerariesList() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [itineraryContent, setItineraryContent] = useState<string>("")
  const [itineraryContentLoading, setItineraryContentLoading] = useState(false)

  useEffect(() => {
    fetchItineraries()
  }, [])

  const fetchItineraries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/itineraries")
      if (response.ok) {
        const data = await response.json()
        setItineraries(data.itineraries)
      }
    } catch (error) {
      console.error("Error fetching itineraries:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredItineraries = itineraries.filter(
    (itinerary) =>
      itinerary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.user_email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleViewItinerary = async (itinerary: Itinerary) => {
    setSelectedItinerary(itinerary)
    setViewDialogOpen(true)
    setItineraryContentLoading(true)

    try {
      const response = await fetch(`/api/admin/itineraries/${itinerary.id}`)
      if (response.ok) {
        const data = await response.json()
        setItineraryContent(data.itinerary.html_content || "No hay contenido disponible")
      }
    } catch (error) {
      console.error("Error fetching itinerary content:", error)
      setItineraryContent("Error al cargar el contenido")
    } finally {
      setItineraryContentLoading(false)
    }
  }

  const handleDeleteItinerary = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este itinerario?")) {
      try {
        const response = await fetch(`/api/admin/itineraries/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setItineraries(itineraries.filter((itinerary) => itinerary.id !== id))
        }
      } catch (error) {
        console.error("Error deleting itinerary:", error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar itinerarios..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Button onClick={fetchItineraries} variant="outline">
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItineraries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron itinerarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredItineraries.map((itinerary) => (
                  <TableRow key={itinerary.id}>
                    <TableCell className="font-medium">{itinerary.title}</TableCell>
                    <TableCell>{itinerary.destination}</TableCell>
                    <TableCell>{itinerary.days}</TableCell>
                    <TableCell>{itinerary.user_name || itinerary.user_email}</TableCell>
                    <TableCell>{formatDate(itinerary.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewItinerary(itinerary)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItinerary(itinerary.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItinerary?.title}</DialogTitle>
            <DialogDescription>
              {selectedItinerary?.destination} - {selectedItinerary?.days} días
            </DialogDescription>
          </DialogHeader>
          {itineraryContentLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: itineraryContent }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
