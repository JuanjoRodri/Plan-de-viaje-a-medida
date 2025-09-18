"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Pencil, Trash2, Share2, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Itinerary } from "@/types/database"

interface ItinerariesListProps {
  initialItineraries?: Itinerary[]
  user?: {
    id: string
    name: string
    email: string
    remaining_itineraries: number
  }
}

export default function ItinerariesList({ initialItineraries = [], user }: ItinerariesListProps) {
  const [itineraries, setItineraries] = useState<Itinerary[]>(initialItineraries)
  const [loading, setLoading] = useState(initialItineraries.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharedLink, setSharedLink] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)

  useEffect(() => {
    if (initialItineraries.length === 0) {
      fetchItineraries()
    }
  }, [initialItineraries.length])

  const fetchItineraries = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/itineraries")

      if (!response.ok) {
        throw new Error("Error al cargar los itinerarios")
      }

      const data = await response.json()
      setItineraries(data.itineraries)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este itinerario?")) {
      return
    }

    try {
      const response = await fetch(`/api/itineraries/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar el itinerario")
      }

      // Actualizar la lista de itinerarios
      setItineraries(itineraries.filter((item) => item.id !== id))
      toast({
        title: "Itinerario eliminado",
        description: "El itinerario ha sido eliminado correctamente.",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const handleShare = async (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    setIsSharing(true)
    setLinkCopied(false)

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itineraryId }),
      })

      if (!response.ok) {
        throw new Error("Error al generar el enlace para compartir")
      }

      const data = await response.json()
      const shareUrl = `${window.location.origin}/share/${data.id}`
      setSharedLink(shareUrl)
      setShowShareModal(true)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      },
      (err) => {
        console.error("Error al copiar el enlace: ", err)
        toast({
          title: "Error al copiar",
          description: "No se pudo copiar el enlace.",
          variant: "destructive",
        })
      },
    )
  }

  if (loading) {
    return <div>Cargando itinerarios...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (itineraries.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">No tienes itinerarios guardados</h2>
        <p className="text-muted-foreground mb-6">Crea tu primer itinerario personalizado para tu próximo viaje</p>
        <Button asChild>
          <Link href="/">Crear itinerario</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      {user && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Tienes <span className="font-bold">{user.remaining_itineraries}</span> itinerarios disponibles hoy.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itineraries.map((itinerary) => (
          <Card key={itinerary.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">{itinerary.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {itinerary.destination} · {itinerary.days} días · {itinerary.travelers} viajeros
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {new Date(itinerary.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/itineraries/${itinerary.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(itinerary.id)}
                      disabled={isSharing && selectedItineraryId === itinerary.id}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartir
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(itinerary.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enlace Compartido Generado</DialogTitle>
            <DialogDescription>
              Comparte este enlace con quien quieras para mostrar el itinerario. El enlace expirará en 30 días.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input id="link" value={sharedLink} readOnly />
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(sharedLink)} aria-label="Copiar enlace">
              {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
