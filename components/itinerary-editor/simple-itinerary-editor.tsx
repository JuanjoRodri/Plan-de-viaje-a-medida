"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Save, X, AlertTriangle, Check, RefreshCw } from "lucide-react"
import SimpleDayEditor from "./simple-day-editor"
import { parseItineraryFromHtml, type ParsedDay } from "./debug-parser"
import type { WeatherData } from "@/app/services/weather-service"

interface SimpleItineraryEditorProps {
  initialHtml: string
  destination: string
  days: string
  nights: string
  hotel: string
  travelers: string
  arrivalTime: string
  departureTime: string
  weatherData?: WeatherData | null
  onSave: (html: string) => void
  onCancel: () => void
}

export default function SimpleItineraryEditor({
  initialHtml,
  destination,
  days,
  nights,
  hotel,
  travelers,
  arrivalTime,
  departureTime,
  weatherData,
  onSave,
  onCancel,
}: SimpleItineraryEditorProps) {
  const [itineraryDays, setItineraryDays] = useState<ParsedDay[]>([])
  const [activeTab, setActiveTab] = useState("edit")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("🔄 SimpleItineraryEditor useEffect iniciado")
    console.log("📄 initialHtml recibido:", initialHtml?.substring(0, 200) + "...")

    try {
      setLoading(true)
      setError(null)

      console.log("🔍 Iniciando parsing con debug completo...")

      // Verificar que tenemos HTML
      if (!initialHtml || initialHtml.trim().length === 0) {
        console.log("❌ HTML vacío o nulo")
        setError("No hay contenido de itinerario para editar.")
        setItineraryDays([
          {
            id: "day-1",
            dayNumber: 1,
            title: "Día 1",
            activities: [],
          },
        ])
        return
      }

      const parsedDays = parseItineraryFromHtml(initialHtml)
      console.log("✅ Días parseados:", parsedDays)

      setItineraryDays(parsedDays)

      if (parsedDays.length === 0 || parsedDays.every((day) => day.activities.length === 0)) {
        setError("No se pudieron extraer actividades del itinerario. Puedes añadir actividades manualmente.")
      }
    } catch (err) {
      console.error("❌ Error en parsing:", err)
      setError("Error al procesar el itinerario. Puedes crear actividades manualmente.")

      // Crear días por defecto basados en el número de días
      const defaultDays: ParsedDay[] = []
      const numDays = Number.parseInt(days) || 1

      for (let i = 1; i <= numDays; i++) {
        defaultDays.push({
          id: `day-${i}`,
          dayNumber: i,
          title: `Día ${i}`,
          activities: [],
        })
      }

      setItineraryDays(defaultDays)
    } finally {
      setLoading(false)
    }
  }, [initialHtml, days])

  const handleDayChange = (updatedDay: ParsedDay) => {
    setItineraryDays((prevDays) => prevDays.map((day) => (day.id === updatedDay.id ? updatedDay : day)))
  }

  const handleDayDelete = (dayId: string) => {
    setItineraryDays((prevDays) => {
      const filteredDays = prevDays.filter((day) => day.id !== dayId)
      return filteredDays.map((day, index) => ({
        ...day,
        dayNumber: index + 1,
        title: day.title.replace(/Día \d+/, `Día ${index + 1}`),
      }))
    })
  }

  const handleAddDay = () => {
    const newDayNumber = itineraryDays.length + 1
    const newDay: ParsedDay = {
      id: `day-${newDayNumber}`,
      dayNumber: newDayNumber,
      title: `Día ${newDayNumber}`,
      activities: [],
    }
    setItineraryDays([...itineraryDays, newDay])
  }

  const moveDay = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === itineraryDays.length - 1)) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updatedDays = [...itineraryDays]
    const day = updatedDays[index]
    updatedDays.splice(index, 1)
    updatedDays.splice(newIndex, 0, day)

    const reorderedDays = updatedDays.map((day, idx) => ({
      ...day,
      dayNumber: idx + 1,
      title: day.title.replace(/Día \d+/, `Día ${idx + 1}`),
    }))

    setItineraryDays(reorderedDays)
  }

  const generateHtmlFromDays = (): string => {
    let html = `<h1>Itinerario de viaje - ${destination}</h1>\n`
    html += `<p><strong>Duración:</strong> ${days} días / ${nights} noches</p>\n`
    html += `<p><strong>Viajeros:</strong> ${travelers} personas</p>\n`
    html += `<p><strong>Alojamiento:</strong> ${hotel}</p>\n\n`

    itineraryDays.forEach((day) => {
      html += `<h2>${day.title}</h2>\n<ul>\n`

      day.activities.forEach((activity) => {
        let activityHtml = `<li>${activity.startTime}`
        if (activity.endTime !== activity.startTime) {
          activityHtml += ` - ${activity.endTime}`
        }
        activityHtml += ` - ${activity.title}`

        if (activity.location) {
          activityHtml += ` en ${activity.location}`
        }

        if (activity.price) {
          activityHtml += ` (${activity.price})`
        }

        if (activity.description) {
          activityHtml += ` - ${activity.description}`
        }

        activityHtml += "</li>\n"
        html += activityHtml
      })

      html += "</ul>\n\n"
    })

    return html
  }

  const handleSave = () => {
    try {
      const html = generateHtmlFromDays()
      console.log("💾 HTML generado para guardar:", html)
      onSave(html)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      console.error("Error saving itinerary:", err)
      setError("No se pudo guardar el itinerario.")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Cargando editor de itinerario...</p>
            <p className="text-sm text-muted-foreground mt-2">Analizando contenido del itinerario...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Editor de Itinerario - {destination}</CardTitle>
        <CardDescription>
          Edita tu itinerario de {days} días / {nights} noches para {travelers} personas.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="edit">Editar</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <div className="space-y-4">
              {itineraryDays.map((day, index) => (
                <SimpleDayEditor
                  key={day.id}
                  day={day}
                  onChange={handleDayChange}
                  onDelete={handleDayDelete}
                  onMoveUp={() => moveDay(index, "up")}
                  onMoveDown={() => moveDay(index, "down")}
                  isFirst={index === 0}
                  isLast={index === itineraryDays.length - 1}
                />
              ))}

              <Button onClick={handleAddDay} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Añadir Día
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div
              className="prose max-w-none p-4 border rounded-lg bg-gray-50"
              dangerouslySetInnerHTML={{ __html: generateHtmlFromDays() }}
            />
          </TabsContent>

          <TabsContent value="debug">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">HTML Original (primeros 1000 caracteres):</h4>
                <pre className="text-xs overflow-auto max-h-40">{initialHtml?.substring(0, 1000)}...</pre>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Días Parseados:</h4>
                <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(itineraryDays, null, 2)}</pre>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">HTML Generado:</h4>
                <pre className="text-xs overflow-auto max-h-40">{generateHtmlFromDays()}</pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>

        <Button
          variant={saveSuccess ? "default" : "outline"}
          className={saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
          onClick={handleSave}
          disabled={saveSuccess}
        >
          {saveSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardado
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
