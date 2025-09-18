"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface RenewDialogProps {
  isOpen: boolean
  onClose: () => void
  itineraryId: string
  currentExpiration: string | null
}

export function RenewDialog({ isOpen, onClose, itineraryId, currentExpiration }: RenewDialogProps) {
  const [days, setDays] = useState("30")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Calcular la nueva fecha de expiración
      const daysToAdd = Number.parseInt(days)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + daysToAdd)

      // Llamar a nuestra nueva API en lugar de actualizar directamente con Supabase
      const response = await fetch("/api/shared-itinerary/update-expiration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: itineraryId,
          expiresAt: expiresAt.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al actualizar la fecha de expiración")
      }

      toast({
        title: "Enlace renovado",
        description: `El enlace ahora expirará en ${days} días.`,
      })
      onClose()
    } catch (error) {
      console.error("Error al renovar el enlace:", error)
      toast({
        title: "Error",
        description: "No se pudo renovar el enlace. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renovar enlace compartido</DialogTitle>
          <DialogDescription>
            Establece cuántos días más quieres que este enlace esté disponible.
            {currentExpiration && (
              <p className="mt-2">Fecha de expiración actual: {new Date(currentExpiration).toLocaleDateString()}</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="days" className="text-right">
                Días
              </Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
