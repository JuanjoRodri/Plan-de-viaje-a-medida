"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    agencia: "",
    empleados: "",
    interes: "",
    mensaje: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    console.log(`Campo ${id} cambiado a:`, value)
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    console.log(`Select ${name} cambiado a:`, value)
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== ENVIANDO FORMULARIO ===")
    console.log("Datos del formulario:", formData)

    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      console.log("Enviando request a /api/contact...")

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`)
      }

      console.log("=== ÉXITO EN EL FRONTEND ===")
      setSubmitStatus("success")
      setFormData({
        nombre: "",
        apellidos: "",
        email: "",
        telefono: "",
        agencia: "",
        empleados: "",
        interes: "",
        mensaje: "",
      })
    } catch (error) {
      console.error("=== ERROR EN EL FRONTEND ===")
      console.error("Error:", error)
      setSubmitStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Error al enviar el formulario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {submitStatus === "success" && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Mensaje enviado</AlertTitle>
          <AlertDescription className="text-green-700">
            Hemos recibido tu mensaje. Nos pondremos en contacto contigo lo antes posible.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === "error" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {errorMessage || "Ha ocurrido un error al enviar el formulario. Por favor, inténtalo de nuevo."}
          </AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" placeholder="Tu nombre" required value={formData.nombre} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="apellidos">Apellidos *</Label>
            <Input
              id="apellidos"
              placeholder="Tus apellidos"
              required
              value={formData.apellidos}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            type="tel"
            placeholder="+34 600 000 000"
            value={formData.telefono}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="agencia">Nombre de la agencia *</Label>
          <Input
            id="agencia"
            placeholder="Nombre de tu agencia de viajes"
            required
            value={formData.agencia}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="empleados">Número de empleados</Label>
          <Select value={formData.empleados} onValueChange={(value) => handleSelectChange("empleados", value)}>
            <SelectTrigger id="empleados">
              <SelectValue placeholder="Selecciona el tamaño de tu agencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-3">1-3 empleados</SelectItem>
              <SelectItem value="4-10">4-10 empleados</SelectItem>
              <SelectItem value="11-25">11-25 empleados</SelectItem>
              <SelectItem value="25+">Más de 25 empleados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="interes">¿En qué estás interesado?</Label>
          <Select value={formData.interes} onValueChange={(value) => handleSelectChange("interes", value)}>
            <SelectTrigger id="interes">
              <SelectValue placeholder="Selecciona tu interés principal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="demo">Solicitar una demostración</SelectItem>
              <SelectItem value="prueba">Comenzar prueba gratuita</SelectItem>
              <SelectItem value="precios">Información sobre precios</SelectItem>
              <SelectItem value="integracion">Integración con sistemas existentes</SelectItem>
              <SelectItem value="soporte">Soporte técnico</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="mensaje">Mensaje *</Label>
          <Textarea
            id="mensaje"
            placeholder="Cuéntanos más sobre tus necesidades y cómo podemos ayudarte..."
            rows={4}
            required
            value={formData.mensaje}
            onChange={handleChange}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar mensaje"}
        </Button>
      </form>
    </>
  )
}
