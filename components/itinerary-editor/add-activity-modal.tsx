"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Search, Loader2, ExternalLink, Sparkles, Clock, MapPin, Euro } from "lucide-react"
import { TimePicker } from "@/components/itinerary-editor/time-picker"
import type { JsonActivity } from "@/types/enhanced-database"
import { v4 as uuidv4 } from "uuid"

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (activity: JsonActivity) => void
  destinationName: string
  defaultStartTime?: string
}

interface PlaceVerificationResult {
  exists: boolean
  similarity: number
  originalName: string
  correctedName?: string
  placeId?: string
  address?: string
  location?: { lat: number; lng: number }
  distanceFromDestination?: number
  suggestions?: string[]
}

// 🆕 Interfaces para el agente de recomendaciones
interface ActivityRecommendation {
  id: string
  title: string
  type: "sightseeing" | "meal" | "transport" | "accommodation" | "event" | "free_time" | "custom"
  locationName: string
  description: string
  suggestedStartTime: string
  suggestedEndTime?: string
  estimatedPrice?: string
  notes?: string
  reasoning: string
}

export default function AddActivityModal({
  isOpen,
  onClose,
  onAdd,
  destinationName,
  defaultStartTime = "09:00",
}: AddActivityModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "sightseeing" as JsonActivity["type"],
    startTime: defaultStartTime,
    endTime: "",
    description: "",
    locationName: "",
    notes: "",
    priceAmount: "",
    priceCurrency: "EUR" as const,
    pricePerPerson: true,
  })

  const [verification, setVerification] = useState<{
    status: "idle" | "loading" | "success" | "error"
    result?: PlaceVerificationResult
    error?: string
  }>({ status: "idle" })

  const [showSuggestions, setShowSuggestions] = useState(false)

  // 🆕 Estados para el agente de recomendaciones
  const [agentQuery, setAgentQuery] = useState("")
  const [agentStatus, setAgentStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        type: "sightseeing",
        startTime: defaultStartTime,
        endTime: "",
        description: "",
        locationName: "",
        notes: "",
        priceAmount: "",
        priceCurrency: "EUR",
        pricePerPerson: true,
      })
      setVerification({ status: "idle" })
      setShowSuggestions(false)
      // 🆕 Reset agente
      setAgentQuery("")
      setAgentStatus("idle")
      setRecommendations([])
      setShowRecommendations(false)
    }
  }, [isOpen, defaultStartTime])

  // Auto-verify location when locationName changes
  useEffect(() => {
    if (formData.locationName.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        verifyLocation(formData.locationName)
      }, 500) // Debounce de 500ms

      return () => clearTimeout(timeoutId)
    } else {
      setVerification({ status: "idle" })
      setShowSuggestions(false)
    }
  }, [formData.locationName])

  const verifyLocation = async (locationName: string) => {
    if (!locationName.trim()) return

    setVerification({ status: "loading" })
    setShowSuggestions(false)

    try {
      const response = await fetch("/api/places/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeName: locationName,
          destinationName: destinationName,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al verificar el lugar")
      }

      const result: PlaceVerificationResult = await response.json()

      setVerification({
        status: result.exists ? "success" : "error",
        result,
      })

      if (!result.exists && result.suggestions && result.suggestions.length > 0) {
        setShowSuggestions(true)
      }
    } catch (error) {
      setVerification({
        status: "error",
        error: "Error al verificar el lugar. Inténtalo de nuevo.",
      })
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, locationName: suggestion }))
    setShowSuggestions(false)
  }

  // 🆕 Función para obtener recomendaciones del agente
  const handleGetRecommendations = async () => {
    if (!agentQuery.trim()) return

    setAgentStatus("loading")
    setRecommendations([])

    try {
      // Importar dinámicamente el servicio
      const { getActivityRecommendations } = await import("@/app/services/activity-recommendation-agent")

      const result = await getActivityRecommendations({
        query: agentQuery,
        destination: destinationName,
        timeOfDay: formData.startTime,
        activityType: formData.type,
        context: {
          // Aquí podrías añadir más contexto si está disponible
          // totalDays, preferences, budget, etc.
        },
      })

      if (result.success && result.recommendations) {
        setRecommendations(result.recommendations)
        setAgentStatus("success")
        setShowRecommendations(true)
      } else {
        setAgentStatus("error")
        console.error("Error obteniendo recomendaciones:", result.error)
      }
    } catch (error) {
      setAgentStatus("error")
      console.error("Error llamando al agente:", error)
    }
  }

  // 🆕 Función para seleccionar una recomendación
  const handleSelectRecommendation = (recommendation: ActivityRecommendation) => {
    setFormData({
      title: recommendation.title,
      type: recommendation.type,
      startTime: recommendation.suggestedStartTime,
      endTime: recommendation.suggestedEndTime || "",
      description: recommendation.description,
      locationName: recommendation.locationName,
      notes: recommendation.notes || "",
      priceAmount: "", // El usuario puede ajustar el precio
      priceCurrency: "EUR",
      pricePerPerson: true,
    })

    // Ocultar recomendaciones y verificar la ubicación
    setShowRecommendations(false)
    setAgentQuery("")

    // Trigger verification for the selected location
    if (recommendation.locationName) {
      verifyLocation(recommendation.locationName)
    }
  }

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!formData.title.trim()) {
      alert("Por favor, introduce un título para la actividad")
      return
    }

    if (!formData.locationName.trim()) {
      alert("Por favor, introduce una ubicación")
      return
    }

    // Crear la actividad
    const newActivity: JsonActivity = {
      id: uuidv4(),
      title: formData.title,
      type: formData.type,
      startTime: formData.startTime,
      endTime: formData.endTime || undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
      location: {
        name: verification.result?.correctedName || formData.locationName,
        address: verification.result?.address,
        coordinates: verification.result?.location,
        verified: verification.status === "success",
        verificationSource: verification.status === "success" ? "google_places" : "user_input",
        placeId: verification.result?.placeId,
        mapsUrl: verification.result?.placeId
          ? `https://www.google.com/maps/place/?q=place_id:${verification.result.placeId}`
          : undefined,
      },
      priceEstimate: formData.priceAmount
        ? {
            amount: Number(formData.priceAmount),
            currency: formData.priceCurrency,
            perPerson: formData.pricePerPerson,
          }
        : undefined,
    }

    try {
      // ENRIQUECIMIENTO AUTOMÁTICO (mantiene la funcionalidad existente)
      console.log("🔍 Enriqueciendo actividad recién creada...")

      // Importar dinámicamente para evitar problemas de SSR
      const { enrichActivity } = await import("@/app/services/activity-enrichment-service")
      const enrichedActivity = await enrichActivity(newActivity, destinationName)

      console.log("✅ Actividad enriquecida exitosamente")
      onAdd(enrichedActivity)
      onClose()
    } catch (enrichmentError) {
      console.error("❌ Error enriqueciendo actividad:", enrichmentError)
      // En caso de error, usar la actividad base
      console.log("⚠️ Usando actividad sin enriquecer debido al error")
      onAdd(newActivity)
      onClose()
    }
  }

  const getVerificationIcon = () => {
    switch (verification.status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getVerificationMessage = () => {
    if (verification.status === "loading") {
      return "Verificando ubicación..."
    }

    if (verification.status === "success" && verification.result) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-700 dark:text-green-300 text-sm">
              Lugar verificado: {verification.result.correctedName}
            </span>
          </div>
          {verification.result.address && (
            <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">{verification.result.address}</p>
          )}
          {verification.result.distanceFromDestination && (
            <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
              A {verification.result.distanceFromDestination} km del centro
            </p>
          )}
          {verification.result.placeId && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 ml-6 text-xs"
              onClick={() =>
                window.open(`https://www.google.com/maps/place/?q=place_id:${verification.result?.placeId}`, "_blank")
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver en Google Maps
            </Button>
          )}
        </div>
      )
    }

    if (verification.status === "error") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">No se pudo verificar la ubicación</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
            Puedes continuar, pero es posible que no aparezca en el mapa
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Actividad</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 🆕 SECCIÓN DEL AGENTE DE RECOMENDACIONES */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                  ¿No sabes qué añadir? Pregunta al agente
                </h3>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  placeholder={`Ej: "Recomiéndame un restaurante para cenar en ${destinationName}" o "¿Qué museo puedo visitar por la mañana?"`}
                  rows={3}
                  className="resize-none"
                />

                <Button
                  onClick={handleGetRecommendations}
                  disabled={!agentQuery.trim() || agentStatus === "loading"}
                  className="w-full bg-transparent"
                  variant="outline"
                >
                  {agentStatus === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando recomendaciones...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Obtener recomendaciones
                    </>
                  )}
                </Button>
              </div>

              {/* Mostrar recomendaciones */}
              {showRecommendations && recommendations.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Recomendaciones para ti:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 bg-white dark:bg-gray-800 rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSelectRecommendation(rec)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{rec.title}</h5>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {rec.locationName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rec.suggestedStartTime}
                              </div>
                              {rec.estimatedPrice && (
                                <div className="flex items-center gap-1">
                                  <Euro className="h-3 w-3" />
                                  {rec.estimatedPrice}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {agentStatus === "error" && (
                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                  Error obteniendo recomendaciones. Inténtalo de nuevo.
                </div>
              )}
            </div>
          </div>

          {/* FORMULARIO MANUAL (mantiene TODO lo existente) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">O añade manualmente:</h3>
            </div>

            {/* Título y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título de la actividad *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Visita al Museo del Prado"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de actividad</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: JsonActivity["type"]) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sightseeing">Turismo</SelectItem>
                    <SelectItem value="meal">Comida</SelectItem>
                    <SelectItem value="transport">Transporte</SelectItem>
                    <SelectItem value="accommodation">Alojamiento</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="free_time">Tiempo libre</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Hora de inicio *</Label>
                <TimePicker
                  value={formData.startTime}
                  onChange={(value) => setFormData((prev) => ({ ...prev, startTime: value }))}
                  className="mt-1"
                  variant="select"
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora de fin (opcional)</Label>
                <TimePicker
                  value={formData.endTime}
                  onChange={(value) => setFormData((prev) => ({ ...prev, endTime: value }))}
                  className="mt-1"
                  variant="select"
                />
              </div>
            </div>

            {/* Ubicación con verificación */}
            <div>
              <Label htmlFor="location">Ubicación *</Label>
              <div className="relative mt-1">
                <Input
                  id="location"
                  value={formData.locationName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, locationName: e.target.value }))}
                  placeholder={`Ej: Museo del Prado, ${destinationName}`}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getVerificationIcon()}</div>
              </div>

              {/* Mensaje de verificación */}
              {verification.status !== "idle" && <div className="mt-2">{getVerificationMessage()}</div>}

              {/* Sugerencias */}
              {showSuggestions && verification.result?.suggestions && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Sugerencias:</p>
                  <div className="flex flex-wrap gap-2">
                    {verification.result.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe la actividad..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Precio */}
            <div>
              <Label>Precio estimado (opcional)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Input
                  type="number"
                  value={formData.priceAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, priceAmount: e.target.value }))}
                  placeholder="Cantidad"
                  min="0"
                  step="0.01"
                />
                <Select
                  value={formData.priceCurrency}
                  onValueChange={(value: "EUR" | "USD" | "GBP") =>
                    setFormData((prev) => ({ ...prev, priceCurrency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.pricePerPerson ? "per_person" : "total"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, pricePerPerson: value === "per_person" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_person">Por persona</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Reservas, recomendaciones, etc."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim() || !formData.locationName.trim()}>
            Añadir Actividad
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
