"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Save, Printer, AlertTriangle, Check, RefreshCw, Settings2, Info, Calendar, MapPin } from "lucide-react"
import DayEditor from "./day-editor"
import { v4 as uuidv4 } from "uuid"
import type {
  JsonItinerary,
  JsonDailyPlan,
  WeatherData,
  JsonDestinationInfo,
  JsonBudgetInfo,
  JsonTravelPreferences,
} from "@/types/enhanced-database" // NUEVAS IMPORTACIONES
import ItineraryMapView from "../itinerary-map-view" // Asumimos que este componente se adaptará o tomará datos del JSON
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Función temporal para convertir JSON a un HTML muy básico para preview/print
// ESTA FUNCIÓN DEBERÍA SER REEMPLAZADA POR COMPONENTES REACT EN FASE 4
const convertJsonToBasicHtmlForPreview = (itinerary: JsonItinerary | null): string => {
  if (!itinerary) return "<p>No hay datos de itinerario para mostrar.</p>"

  let html = `<h1>Itinerario: ${itinerary.title}</h1>`
  html += `<p><strong>Destino:</strong> ${itinerary.destination.name}</p>`
  html += `<p><strong>Fechas:</strong> ${itinerary.startDate} a ${itinerary.endDate} (${itinerary.daysCount} días)</p>`
  html += `<p><strong>Viajeros:</strong> ${itinerary.travelers}</p>`
  if (itinerary.budget) {
    html += `<p><strong>Presupuesto:</strong> ${itinerary.budget.type} (${itinerary.budget.estimatedTotal || "N/A"} ${itinerary.budget.currency})</p>`
  }

  itinerary.dailyPlans.forEach((day) => {
    html += `<details open><summary><h2>Día ${day.dayNumber}: ${day.title || day.date}</h2></summary>`
    html += `<ul>`
    day.activities.forEach((activity) => {
      html += `<li>`
      html += `<strong>${activity.startTime} ${activity.endTime ? `- ${activity.endTime}` : ""}: ${activity.title}</strong> (${activity.type})`
      if (activity.location?.name) {
        html += `<br/><em>Lugar: ${activity.location.name} ${activity.location.address ? `(${activity.location.address})` : ""}</em>`
        if (activity.location.verified && activity.location.mapsUrl) {
          html += ` <a href="${activity.location.mapsUrl}" target="_blank">[Verificado en Mapa]</a>`
        }
      }
      if (activity.priceEstimate?.amount) {
        html += `<br/><em>Precio: ${activity.priceEstimate.amount} ${activity.priceEstimate.currency} ${activity.priceEstimate.perPerson ? "por persona" : ""}</em>`
      }
      if (activity.description) {
        html += `<p>${activity.description}</p>`
      }
      if (activity.notes) {
        html += `<p><em>Notas: ${activity.notes}</em></p>`
      }
      html += `</li>`
    })
    html += `</ul></details>`
  })
  return html
}

interface ItineraryEditorProps {
  initialJsonItinerary: JsonItinerary | null // CAMBIADO: de initialHtml
  // Las siguientes props podrían venir del JsonItinerary o pasarse por separado si son para la UI del editor
  // destination: string // Ahora en initialJsonItinerary.destination.name
  // days: string // Ahora en initialJsonItinerary.daysCount
  // nights: string // Se puede calcular o añadir a JsonItinerary
  // hotel: string // Ahora en initialJsonItinerary.preferences.hotel.name
  // travelers: string // Ahora en initialJsonItinerary.travelers
  // arrivalTime: string // Podría ser parte de JsonItinerary.transportInfo o un campo de metadatos
  // departureTime: string // Ídem
  weatherData?: WeatherData | null // Sigue igual, es un dato complementario
  onSave: (updatedItinerary: JsonItinerary) => void // CAMBIADO: devuelve el JSON completo
  onCancel: () => void
  userId: string // Necesario para crear un nuevo itinerario si initialJsonItinerary es null
}

export default function ItineraryEditor({
  initialJsonItinerary,
  weatherData, // Sigue siendo útil para mostrar
  onSave,
  onCancel,
  userId,
}: ItineraryEditorProps) {
  const [itinerary, setItinerary] = useState<JsonItinerary | null>(initialJsonItinerary)
  const [activeTab, setActiveTab] = useState("edit") // Pestañas: edit, settings, preview, map
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true) // Para la carga inicial

  useEffect(() => {
    setLoading(true)
    if (initialJsonItinerary) {
      setItinerary(initialJsonItinerary)
      setError(null)
    } else {
      // Crear un itinerario vacío por defecto si no se proporciona uno inicial
      // Esto es útil si el editor se usa para crear un itinerario desde cero
      const today = new Date().toISOString().split("T")[0]
      const defaultItinerary: JsonItinerary = {
        id: uuidv4(),
        userId: userId, // Asegúrate de pasar userId como prop
        title: "Nuevo Itinerario",
        destination: { name: "Mi Destino", verified: false },
        startDate: today,
        endDate: today,
        daysCount: 1,
        travelers: 1,
        budget: { type: "medium", currency: "EUR" },
        preferences: {},
        dailyPlans: [
          {
            dayNumber: 1,
            date: today,
            title: "Día 1",
            activities: [],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }
      setItinerary(defaultItinerary)
      setError(null)
    }
    setLoading(false)
  }, [initialJsonItinerary, userId])

  const handleItineraryChange = useCallback((field: keyof JsonItinerary, value: any) => {
    setItinerary((prev) => (prev ? { ...prev, [field]: value, updatedAt: new Date().toISOString() } : null))
  }, [])

  const handleDestinationChange = useCallback((field: keyof JsonDestinationInfo, value: string) => {
    setItinerary((prev) =>
      prev
        ? {
            ...prev,
            destination: { ...prev.destination, [field]: value },
            updatedAt: new Date().toISOString(),
          }
        : null,
    )
  }, [])

  const handleBudgetChange = useCallback((field: keyof JsonBudgetInfo, value: string | number) => {
    setItinerary((prev) =>
      prev
        ? {
            ...prev,
            budget: {
              ...(prev.budget || { type: "medium", currency: "EUR" }),
              [field]: field === "estimatedTotal" ? Number(value) : value,
            },
            updatedAt: new Date().toISOString(),
          }
        : null,
    )
  }, [])

  const handlePreferencesChange = useCallback((field: keyof JsonTravelPreferences, value: any) => {
    setItinerary((prev) =>
      prev
        ? {
            ...prev,
            preferences: { ...(prev.preferences || {}), [field]: value },
            updatedAt: new Date().toISOString(),
          }
        : null,
    )
  }, [])

  const handleHotelPreferenceChange = useCallback(
    (field: keyof NonNullable<JsonTravelPreferences["hotel"]>, value: string | number | boolean) => {
      setItinerary((prev) => {
        if (!prev) return null
        const currentPrefs = prev.preferences || {}
        const currentHotelPrefs = currentPrefs.hotel || {}
        return {
          ...prev,
          preferences: {
            ...currentPrefs,
            hotel: {
              ...currentHotelPrefs,
              [field]: value,
            },
          },
          updatedAt: new Date().toISOString(),
        }
      })
    },
    [],
  )

  const handleDayChange = (updatedDay: JsonDailyPlan) => {
    setItinerary((prev) => {
      if (!prev) return null
      return {
        ...prev,
        dailyPlans: prev.dailyPlans.map((day) => (day.dayNumber === updatedDay.dayNumber ? updatedDay : day)),
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const handleDayDelete = (dayNumberToDelete: number) => {
    setItinerary((prev) => {
      if (!prev || prev.dailyPlans.length <= 1) return prev // No eliminar el último día
      const filteredDays = prev.dailyPlans.filter((day) => day.dayNumber !== dayNumberToDelete)
      // Re-numerar los días restantes
      const renumberedDays = filteredDays.map((day, index) => ({
        ...day,
        dayNumber: index + 1,
      }))
      return {
        ...prev,
        dailyPlans: renumberedDays,
        daysCount: renumberedDays.length, // Actualizar daysCount
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const handleAddDay = () => {
    setItinerary((prev) => {
      if (!prev) return null
      const newDayNumber = prev.dailyPlans.length + 1
      const lastDate =
        prev.dailyPlans.length > 0
          ? new Date(prev.dailyPlans[prev.dailyPlans.length - 1].date)
          : new Date(prev.startDate)
      lastDate.setDate(lastDate.getDate() + 1)
      const newDate = lastDate.toISOString().split("T")[0]

      const newDay: JsonDailyPlan = {
        dayNumber: newDayNumber,
        date: newDate,
        title: `Día ${newDayNumber}`,
        activities: [],
      }
      const updatedDailyPlans = [...prev.dailyPlans, newDay]
      return {
        ...prev,
        dailyPlans: updatedDailyPlans,
        daysCount: updatedDailyPlans.length, // Actualizar daysCount
        endDate: newDate, // Actualizar fecha de fin del itinerario
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const moveDay = (index: number, direction: "up" | "down") => {
    setItinerary((prev) => {
      if (!prev) return null
      const dailyPlans = prev.dailyPlans
      if ((direction === "up" && index === 0) || (direction === "down" && index === dailyPlans.length - 1)) {
        return prev
      }

      const newIndex = direction === "up" ? index - 1 : index + 1
      const updatedDays = [...dailyPlans]
      const dayToMove = updatedDays[index]
      updatedDays.splice(index, 1)
      updatedDays.splice(newIndex, 0, dayToMove)

      const reorderedDays = updatedDays.map((day, idx) => ({
        ...day,
        dayNumber: idx + 1,
        // Podríamos necesitar re-calcular las fechas aquí si el orden afecta las fechas
      }))

      return {
        ...prev,
        dailyPlans: reorderedDays,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const handleSave = () => {
    if (!itinerary) {
      setError("No hay itinerario para guardar.")
      return
    }
    try {
      onSave(itinerary) // Pasar el objeto JSON completo
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      setError(null)
    } catch (err) {
      console.error("Error saving itinerary (JSON):", err)
      setError("No se pudo guardar el itinerario. Por favor, inténtalo de nuevo.")
    }
  }

  const handlePrint = () => {
    if (!itinerary) {
      setError("No hay itinerario para imprimir.")
      return
    }
    try {
      const htmlToPrint = convertJsonToBasicHtmlForPreview(itinerary) // Usar la función de conversión
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Itinerario: ${itinerary.title}</title>
              <style>
                body { font-family: sans-serif; margin: 20px; }
                h1, h2 { color: #333; }
                details { margin-bottom: 1em; border: 1px solid #eee; padding: 5px; border-radius: 4px;}
                summary { font-weight: bold; cursor: pointer; }
                ul { list-style-type: none; padding-left: 20px; }
                li { margin-bottom: 0.5em; padding: 5px; border-bottom: 1px solid #f0f0f0; }
                p { margin: 0.3em 0; }
              </style>
            </head>
            <body>
              ${htmlToPrint}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (err) {
      console.error("Error printing itinerary:", err)
      setError("No se pudo imprimir el itinerario. Por favor, inténtalo de nuevo.")
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Cargando editor de itinerario...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!itinerary) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>No se pudo cargar el itinerario para edición.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Editor de Itinerario</CardTitle>
        <CardDescription>
          Personaliza los detalles de tu viaje. Los cambios se guardan al hacer clic en "Guardar".
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid w-full grid-cols-4">
            <TabsTrigger value="settings">
              <Settings2 className="inline-block h-4 w-4 mr-1.5" />
              General
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Calendar className="inline-block h-4 w-4 mr-1.5" />
              Días y Actividades
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Info className="inline-block h-4 w-4 mr-1.5" />
              Vista Previa (HTML)
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin className="inline-block h-4 w-4 mr-1.5" />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4 p-1">
            <div>
              <Label htmlFor="itinerary-title" className="text-sm font-medium">
                Título del Itinerario
              </Label>
              <Input
                id="itinerary-title"
                value={itinerary.title}
                onChange={(e) => handleItineraryChange("title", e.target.value)}
                placeholder="Ej: Aventura en los Alpes"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination-name" className="text-sm font-medium">
                  Destino Principal
                </Label>
                <Input
                  id="destination-name"
                  value={itinerary.destination.name}
                  onChange={(e) => handleDestinationChange("name", e.target.value)}
                  placeholder="Ej: Roma, Italia"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="travelers" className="text-sm font-medium">
                  Número de Viajeros
                </Label>
                <Input
                  id="travelers"
                  type="number"
                  value={itinerary.travelers}
                  onChange={(e) => handleItineraryChange("travelers", Number.parseInt(e.target.value, 10) || 1)}
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-sm font-medium">
                  Fecha de Inicio
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={itinerary.startDate}
                  onChange={(e) => handleItineraryChange("startDate", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm font-medium">
                  Fecha de Fin
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={itinerary.endDate}
                  onChange={(e) => handleItineraryChange("endDate", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget-type" className="text-sm font-medium">
                  Tipo de Presupuesto
                </Label>
                <Select
                  value={itinerary.budget?.type || "medium"}
                  onValueChange={(value) => handleBudgetChange("type", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bajo</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget-currency" className="text-sm font-medium">
                  Moneda
                </Label>
                <Select
                  value={itinerary.budget?.currency || "EUR"}
                  onValueChange={(value) => handleBudgetChange("currency", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="hotel-name" className="text-sm font-medium">
                Nombre del Hotel (Preferencia)
              </Label>
              <Input
                id="hotel-name"
                value={itinerary.preferences?.hotel?.name || ""}
                onChange={(e) => handleHotelPreferenceChange("name", e.target.value)}
                placeholder="Ej: Grand Hotel Central"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="general-notes" className="text-sm font-medium">
                Notas Generales del Viaje
              </Label>
              <Textarea
                id="general-notes"
                value={itinerary.generalNotes || ""}
                onChange={(e) => handleItineraryChange("generalNotes", e.target.value)}
                placeholder="Cualquier nota general sobre el viaje..."
                className="mt-1"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="edit">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              {itinerary.dailyPlans
                .sort((a, b) => a.dayNumber - b.dayNumber)
                .map((day, index) => (
                  <DayEditor
                    key={day.dayNumber} // Usar dayNumber como key si los IDs no son estables o no existen aún
                    day={day}
                    onChange={handleDayChange}
                    onDelete={handleDayDelete}
                    onMoveUp={() => moveDay(index, "up")}
                    onMoveDown={() => moveDay(index, "down")}
                    isFirst={index === 0}
                    isLast={index === itinerary.dailyPlans.length - 1}
                    destinationName={itinerary.destination.name}
                  />
                ))}
              <Button onClick={handleAddDay} className="w-full mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Día
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div
              className="prose dark:prose-invert max-w-none p-2 border rounded-md bg-background shadow-sm"
              dangerouslySetInnerHTML={{ __html: convertJsonToBasicHtmlForPreview(itinerary) }}
            />
          </TabsContent>

          <TabsContent value="map">
            <ItineraryMapView
              itineraryJson={itinerary} // Pasar el JSON completo
              // destination={itinerary.destination.name} // Ya está en itineraryJson
              // hotel={itinerary.preferences?.hotel?.name || ""} // Ya está en itineraryJson
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir (Básico)
          </Button>
          <Button
            variant={saveSuccess ? "default" : "default"} // Cambiado a default para que siempre sea el color primario
            className={`flex items-center gap-2 ${saveSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            onClick={handleSave}
            disabled={saveSuccess}
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
