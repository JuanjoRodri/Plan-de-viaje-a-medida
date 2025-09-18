"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Building2 } from "lucide-react"

interface BusinessInfo {
  agency_name: string
  agency_phone: string
  agency_email: string
  agency_address: string
  agency_website: string
}

export default function BusinessInfoForm() {
  const [formData, setFormData] = useState<BusinessInfo>({
    agency_name: "",
    agency_phone: "",
    agency_email: "",
    agency_address: "",
    agency_website: "",
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Cargar información empresarial existente
  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const response = await fetch("/api/auth/business-info")
        if (response.ok) {
          const data = await response.json()
          setFormData({
            agency_name: data.agency_name || "",
            agency_phone: data.agency_phone || "",
            agency_email: data.agency_email || "",
            agency_address: data.agency_address || "",
            agency_website: data.agency_website || "",
          })
        }
      } catch (error) {
        console.error("Error loading business info:", error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadBusinessInfo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/auth/business-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Información empresarial actualizada exitosamente" })
      } else {
        setMessage({ type: "error", text: data.error || "Error al actualizar la información" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error de conexión. Inténtalo de nuevo." })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof BusinessInfo, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agency_name">Nombre de la Agencia</Label>
          <Input
            id="agency_name"
            value={formData.agency_name}
            onChange={(e) => handleInputChange("agency_name", e.target.value)}
            placeholder="Ej: Viajes Mediterráneo S.L."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency_email">Email de la Agencia</Label>
          <Input
            id="agency_email"
            type="email"
            value={formData.agency_email}
            onChange={(e) => handleInputChange("agency_email", e.target.value)}
            placeholder="contacto@agencia.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agency_address">Dirección</Label>
        <Textarea
          id="agency_address"
          value={formData.agency_address}
          onChange={(e) => handleInputChange("agency_address", e.target.value)}
          placeholder="Dirección completa de la empresa"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="agency_phone">Teléfono</Label>
          <Input
            id="agency_phone"
            value={formData.agency_phone}
            onChange={(e) => handleInputChange("agency_phone", e.target.value)}
            placeholder="Ej: +34 123 456 789"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_website">Sitio Web</Label>
          <Input
            id="agency_website"
            type="url"
            value={formData.agency_website}
            onChange={(e) => handleInputChange("agency_website", e.target.value)}
            placeholder="https://www.ejemplo.com"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        <Building2 className="mr-2 h-4 w-4" />
        {loading ? "Guardando..." : "Guardar Información Empresarial"}
      </Button>
    </form>
  )
}
