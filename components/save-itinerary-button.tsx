"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SaveItineraryButtonProps {
  destination: string
  days: number
  travelers: number
  budgetType: string
  htmlContent: string
}

export function SaveItineraryButton({
  destination,
  days,
  travelers,
  budgetType,
  htmlContent,
}: SaveItineraryButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Por favor, ingresa un título para tu itinerario")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/itineraries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          destination,
          days,
          travelers,
          budget_type: budgetType,
          html_content: htmlContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar el itinerario")
      }

      // Cerrar el diálogo y redirigir a la página de itinerarios
      setOpen(false)
      router.push("/my-itineraries")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Guardar itinerario</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Guardar itinerario</DialogTitle>
          <DialogDescription>Dale un título a tu itinerario para guardarlo en tu cuenta</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Mi viaje a Barcelona"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Destino</Label>
            <div className="col-span-3">{destination}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Duración</Label>
            <div className="col-span-3">
              {days} {days === 1 ? "día" : "días"}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
