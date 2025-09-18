"use client"

import type React from "react"
import { useState, useEffect, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Wand2,
  Sun,
  CheckCircle,
  Search,
  Star,
  CalendarDays,
  Users,
  Hotel,
  Euro,
  MapPin,
  Clock,
  Info,
  AlertTriangle,
} from "lucide-react"
import { generateItinerary as generateItineraryAction, checkItineraryLimits } from "@/app/actions"
import type { User } from "@/types/database"
import type { WeatherData as ExternalWeatherData } from "@/app/services/weather-service"
import type { JsonItinerary } from "@/types/enhanced-database"
import WeatherForecast from "./weather-forecast"
import { verifyDestination } from "@/app/services/destination-service"
import { cn } from "@/lib/utils"

interface PlaceSearchResult {
  place_id: string
  name: string
  formatted_address?: string
  vicinity?: string
  rating?: number
  user_ratings_total?: number
}

interface DestinationSuggestion {
  name: string
  description: string
  place_id?: string
}

interface TravelFormProps {
  onItineraryGenerated: (itineraryJson: JsonItinerary, formDataForContext: any) => void
  user: User | null
  onLimitsUpdate: (used: number, limit: number) => void
}

export default function TravelForm({ onItineraryGenerated, user, onLimitsUpdate }: TravelFormProps) {
  const [formData, setFormData] = useState({
    destination: "",
    placeId: "",
    days: "3",
    nights: "2",
    hotel: "",
    hotelPlaceId: "",
    age: "30-50",
    travelers: "2",
    arrivalTime: "14:00",
    departureTime: "10:00",
    preferences: "",
    budget: "medio",
    customBudget: "",
    transportModes: ["walking"],
    maxDistance: "5",
    tripType: "general",
    boardType: "sin-pension",
    includeWeather: false,
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Mañana por defecto
  })

  const [isVerifyingDestination, setIsVerifyingDestination] = useState(false)
  const [destinationError, setDestinationError] = useState<string | null>(null)
  const [destinationSuggestions, setDestinationSuggestions] = useState<DestinationSuggestion[]>([])
  const [isDestinationVerified, setIsDestinationVerified] = useState(false)
  const destinationDebounceRef = useRef<NodeJS.Timeout>()

  const [isVerifyingHotel, setIsVerifyingHotel] = useState(false)
  const [hotelError, setHotelError] = useState<string | null>(null)
  const [hotelSuggestions, setHotelSuggestions] = useState<PlaceSearchResult[]>([])
  const [isHotelVerified, setIsHotelVerified] = useState(false)
  const hotelDebounceRef = useRef<NodeJS.Timeout>()

  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<ExternalWeatherData | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [showProgressBar, setShowProgressBar] = useState(false)
  const [progressValue, setProgressValue] = useState(0)

  useEffect(() => {
    const numDays = Number.parseInt(formData.days, 10)
    setFormData((prev) => ({ ...prev, nights: isNaN(numDays) || numDays <= 0 ? "0" : (numDays - 1).toString() }))
  }, [formData.days])

  useEffect(() => {
    if (destinationDebounceRef.current) clearTimeout(destinationDebounceRef.current)
    if (!formData.destination.trim() || isDestinationVerified) {
      setDestinationSuggestions([])
      setDestinationError(null)
      return
    }

    destinationDebounceRef.current = setTimeout(async () => {
      setIsVerifyingDestination(true)
      setDestinationError(null)
      setDestinationSuggestions([])
      try {
        const result = await verifyDestination(formData.destination)
        if (result.isValid && result.normalizedName) {
          setFormData((prev) => ({ ...prev, destination: result.normalizedName, placeId: result.placeId || "" }))
          setIsDestinationVerified(true)
        } else {
          setDestinationError(result.message || "Destino no válido.")
          setDestinationSuggestions(result.suggestions || [])
        }
      } catch (error) {
        setDestinationError("Error al verificar el destino.")
      }
      setIsVerifyingDestination(false)
    }, 800)
  }, [formData.destination, isDestinationVerified])

  useEffect(() => {
    if (hotelDebounceRef.current) clearTimeout(hotelDebounceRef.current)
    if (!formData.hotel.trim() || isHotelVerified || !formData.destination || !isDestinationVerified) {
      setHotelSuggestions([])
      setHotelError(null)
      return
    }

    hotelDebounceRef.current = setTimeout(async () => {
      setIsVerifyingHotel(true)
      setHotelError(null)
      setHotelSuggestions([])
      try {
        const query = `${formData.hotel} en ${formData.destination}`
        const response = await fetch(
          `/api/places/search?query=${encodeURIComponent(query)}&location=${formData.placeId || ""}&type=lodging&limit=5`,
        )
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Error en la búsqueda de hoteles.")
        }
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          setHotelSuggestions(data.results)
        } else {
          setHotelError("No se encontraron hoteles con ese nombre en la zona.")
        }
      } catch (error: any) {
        setHotelError(error.message || "Error al buscar hoteles.")
      }
      setIsVerifyingHotel(false)
    }, 800)
  }, [formData.hotel, formData.destination, isHotelVerified, isDestinationVerified, formData.placeId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "destination") {
      setIsDestinationVerified(false)
      setFormData((prev) => ({ ...prev, placeId: "" }))
      setIsHotelVerified(false)
      setFormData((prev) => ({ ...prev, hotel: "", hotelPlaceId: "" }))
      setHotelSuggestions([])
      setHotelError(null)
    }
    if (name === "hotel") {
      setIsHotelVerified(false)
      setFormData((prev) => ({ ...prev, hotelPlaceId: "" }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean | string) => {
    setFormData((prev) => ({ ...prev, [name]: !!checked }))
  }

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[name as keyof typeof prev] as string[]
      if (currentValues.includes(value)) {
        return { ...prev, [name]: currentValues.filter((v) => v !== value) }
      } else {
        return { ...prev, [name]: [...currentValues, value] }
      }
    })
  }

  const handleSelectDestination = (suggestion: DestinationSuggestion) => {
    setFormData((prev) => ({ ...prev, destination: suggestion.name, placeId: suggestion.place_id || "" }))
    setIsDestinationVerified(true)
    setDestinationSuggestions([])
    setDestinationError(null)
  }

  const handleSelectHotel = (hotel: PlaceSearchResult) => {
    setFormData((prev) => ({ ...prev, hotel: hotel.name, hotelPlaceId: hotel.place_id }))
    setIsHotelVerified(true)
    setHotelSuggestions([])
    setHotelError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    if (!isDestinationVerified && formData.destination.trim() !== "") {
      setFormError("Por favor, verifica el destino antes de continuar.")
      return
    }
    if (formData.hotel.trim() && !isHotelVerified) {
      setFormError("Por favor, selecciona un hotel de la lista o deja el campo vacío si no tienes preferencia.")
      return
    }

    // Verificar límites antes de mostrar la barra de progreso
    const limitsCheck = await checkItineraryLimits()
    if (!limitsCheck.canGenerate) {
      setFormError(limitsCheck.message || "Has alcanzado tu límite mensual de itinerarios")
      return
    }

    // Mover AQUÍ, ANTES de startTransition
    setShowProgressBar(true)
    setProgressValue(0)

    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 100 / 120 // Incremento para 120 segundos
      })
    }, 1000) // Cada segundo

    startTransition(async () => {
      // Iniciar barra de progreso simple de 120 segundos

      const formPayload = new FormData(formRef.current!)
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => formPayload.append(key, item))
        } else if (typeof value === "boolean") {
          formPayload.append(key, value.toString())
        } else if (value !== null && value !== undefined) {
          if (!formRef.current?.elements.namedItem(key)) {
            formPayload.append(key, value as string)
          }
        }
      })

      if (weatherData && formData.includeWeather) {
        formPayload.append("weatherData", JSON.stringify(weatherData))
      }

      const result = await generateItineraryAction(formPayload)

      if (result.success && result.itineraryJson) {
        onItineraryGenerated(result.itineraryJson, {
          ...formData,
          weatherData: formData.includeWeather ? weatherData : null,
        })
      } else {
        setFormError(result.error || "Ocurrió un error desconocido al generar el itinerario.")
      }
    })
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))
  }

  const transportOptions = [
    { id: "walking", label: "A pie (máx 5km)" },
    { id: "transit", label: "Transporte público (máx 20km)" },
    { id: "taxi", label: "Taxi / VTC (máx 20km)" },
    { id: "bicycling", label: "Bicicleta (máx 10km)" },
    { id: "driving", label: "Coche (máx 50km)" },
  ]

  return (
    <Card className="w-full shadow-xl border-primary/20 dark:border-primary/30">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/30 p-4 md:p-6 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <Wand2 className="h-7 w-7 text-primary dark:text-sky-400" />
          <div>
            <CardTitle className="text-xl md:text-2xl text-primary dark:text-sky-300">Crea tu Viaje Perfecto</CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Rellena los detalles y nuestra IA diseñará un itinerario a tu medida.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">
          {/* Campos Principales */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="font-semibold">
              Destino Principal
            </Label>
            <div className="relative">
              <Input
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="Ej: Roma, Italia"
                className={cn("pr-10", isDestinationVerified && "border-green-500 focus-visible:ring-green-500")}
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isVerifyingDestination ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : isDestinationVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Search className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {destinationError && !isVerifyingDestination && (
              <Alert variant="destructive" className="text-sm p-2 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{destinationError}</AlertDescription>
              </Alert>
            )}
            {destinationSuggestions.length > 0 && !isDestinationVerified && (
              <Card className="mt-1 p-2 space-y-1 border-slate-300 dark:border-slate-700">
                <p className="text-xs font-medium text-muted-foreground">¿Quisiste decir...?</p>
                {destinationSuggestions.slice(0, 3).map((s) => (
                  <div
                    key={s.name + (s.place_id || "")}
                    onClick={() => handleSelectDestination(s)}
                    className="p-2 rounded-md hover:bg-muted dark:hover:bg-slate-700 cursor-pointer text-sm"
                  >
                    <p className="font-semibold">{s.name}</p>
                    {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="hotel" className="font-semibold">
              Hotel o Alojamiento (Opcional)
            </Label>
            <div className="relative">
              <Input
                id="hotel"
                name="hotel"
                value={formData.hotel}
                onChange={handleChange}
                placeholder="Nombre de tu hotel o tipo (ej: 'cerca de la playa')"
                className={cn("pr-10", isHotelVerified && "border-green-500 focus-visible:ring-green-500")}
                disabled={!isDestinationVerified && !formData.destination}
                autoComplete="off"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isVerifyingHotel ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : isHotelVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Search className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {hotelError && !isVerifyingHotel && (
              <Alert variant="destructive" className="text-sm p-2 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{hotelError}</AlertDescription>
              </Alert>
            )}
            {hotelSuggestions.length > 0 && !isHotelVerified && (
              <Card className="mt-1 p-2 space-y-1 max-h-60 overflow-y-auto border-slate-300 dark:border-slate-700">
                {hotelSuggestions.map((h) => (
                  <div
                    key={h.place_id}
                    onClick={() => handleSelectHotel(h)}
                    className="p-2 rounded-md hover:bg-muted dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <p className="font-semibold text-sm">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.formatted_address || h.vicinity}</p>
                    {h.rating !== undefined && h.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(h.rating)}
                        <span className="text-xs text-muted-foreground">({h.user_ratings_total || 0})</span>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <Label htmlFor="startDate" className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Fecha de Inicio
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="days" className="flex items-center">
                <CalendarDays className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Días
              </Label>
              <Input
                id="days"
                name="days"
                type="number"
                value={formData.days}
                onChange={handleChange}
                min="1"
                max="30"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="nights" className="flex items-center">
                <Hotel className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Noches
              </Label>
              <Input
                id="nights"
                name="nights"
                type="number"
                value={formData.nights}
                readOnly
                className="mt-1 bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="travelers" className="flex items-center">
                <Users className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Viajeros
              </Label>
              <Input
                id="travelers"
                name="travelers"
                type="number"
                value={formData.travelers}
                onChange={handleChange}
                min="1"
                max="20"
                required
                className="mt-1"
              />
            </div>
          </div>

          {/* Campos que antes eran "Avanzados", ahora siempre visibles */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-6">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-2">
              Personaliza tu Experiencia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="arrivalTime" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                  Hora de Llegada (Hotel/Destino)
                </Label>
                <Input
                  id="arrivalTime"
                  name="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="departureTime" className="flex items-center">
                  <Clock className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                  Hora de Salida (Hotel/Destino)
                </Label>
                <Input
                  id="departureTime"
                  name="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="age" className="flex items-center">
                  <Users className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                  Rango de Edad
                </Label>
                <Select name="age" value={formData.age} onValueChange={(value) => handleSelectChange("age", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25 años</SelectItem>
                    <SelectItem value="26-35">26-35 años</SelectItem>
                    <SelectItem value="30-50">30-50 años</SelectItem>
                    <SelectItem value="51-65">51-65 años</SelectItem>
                    <SelectItem value="65+">Más de 65 años</SelectItem>
                    <SelectItem value="family_young">Familia (niños pequeños)</SelectItem>
                    <SelectItem value="family_teen">Familia (adolescentes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tripType" className="flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                  Tipo de Viaje
                </Label>
                <Select
                  name="tripType"
                  value={formData.tripType}
                  onValueChange={(value) => handleSelectChange("tripType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General / Cultural</SelectItem>
                    <SelectItem value="relax">Relax / Descanso</SelectItem>
                    <SelectItem value="adventure">Aventura / Naturaleza</SelectItem>
                    <SelectItem value="romantic">Romántico</SelectItem>
                    <SelectItem value="foodie">Gastronómico</SelectItem>
                    <SelectItem value="shopping">Compras</SelectItem>
                    <SelectItem value="business">Negocios</SelectItem>
                    <SelectItem value="party">Fiesta / Vida Nocturna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="budget" className="flex items-center">
                <Euro className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Presupuesto General
              </Label>
              <Select
                name="budget"
                value={formData.budget}
                onValueChange={(value) => handleSelectChange("budget", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo (€) - Mochilero / Muy ajustado</SelectItem>
                  <SelectItem value="medio">Medio (€€) - Cómodo pero consciente</SelectItem>
                  <SelectItem value="alto">Alto (€€€) - Lujo / Sin restricciones</SelectItem>
                  <SelectItem value="personalizado">Personalizado (detallar abajo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.budget === "personalizado" && (
              <div>
                <Label htmlFor="customBudget">Detalles del Presupuesto Personalizado</Label>
                <Textarea
                  id="customBudget"
                  name="customBudget"
                  value={formData.customBudget}
                  onChange={handleChange}
                  placeholder="Ej: Máx 50€/día para comidas, 100€ para hotel/noche, actividades gratuitas preferidas..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            )}

            <div>
              <Label htmlFor="boardType" className="flex items-center">
                <Hotel className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Tipo de Pensión (Hotel)
              </Label>
              <Select
                name="boardType"
                value={formData.boardType}
                onValueChange={(value) => handleSelectChange("boardType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin-pension">Sin Pensión / Solo Alojamiento</SelectItem>
                  <SelectItem value="solo-desayuno">Desayuno Incluido</SelectItem>
                  <SelectItem value="media-pension">Media Pensión (Desayuno y Cena)</SelectItem>
                  <SelectItem value="pension-completa">Pensión Completa</SelectItem>
                  <SelectItem value="todo-incluido">Todo Incluido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center mb-1">
                <MapPin className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Modos de Transporte Preferidos
              </Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                {transportOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`transport-${option.id}`}
                      checked={formData.transportModes.includes(option.id)}
                      onCheckedChange={(checked) => handleMultiSelectChange("transportModes", option.id)}
                    />
                    <Label htmlFor={`transport-${option.id}`} className="text-sm font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="maxDistance" className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                Distancia Máxima desde el Alojamiento
              </Label>
              <Select
                name="maxDistance"
                value={formData.maxDistance}
                onValueChange={(value) => handleSelectChange("maxDistance", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 km - Solo centro histórico</SelectItem>
                  <SelectItem value="5">5 km - Centro ampliado</SelectItem>
                  <SelectItem value="10">10 km - Área metropolitana</SelectItem>
                  <SelectItem value="15">15 km - Ciudad completa</SelectItem>
                  <SelectItem value="25">25 km - Área extendida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="preferences" className="flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-primary/80 dark:text-sky-500/80" />
                  Preferencias Adicionales y Estilo de Viaje
                </Label>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold">IMPORTANTE</span>
              </div>
              <Textarea
                id="preferences"
                name="preferences"
                value={formData.preferences}
                onChange={handleChange}
                placeholder="Ej: Me encanta el arte moderno, prefiero evitar multitudes, busco experiencias locales auténticas, ritmo relajado, no me importa madrugar, etc."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Sección de Clima */}
          {isDestinationVerified && formData.destination && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center text-md font-medium">
                  <Sun className="h-5 w-5 mr-2 text-amber-500" />
                  Clima en {formData.destination}
                </Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWeather"
                    name="includeWeather"
                    checked={formData.includeWeather}
                    onCheckedChange={(checked) => handleCheckboxChange("includeWeather", checked)}
                  />
                  <Label htmlFor="includeWeather" className="text-sm font-normal cursor-pointer">
                    Adaptar itinerario al clima
                  </Label>
                </div>
              </div>
              <WeatherForecast
                destination={formData.destination}
                days={5}
                onWeatherDataReady={(data) => {
                  setWeatherData(data)
                }}
              />
            </div>
          )}

          {formError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {showProgressBar && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Generando itinerario...</span>
                <span>{Math.round(progressValue)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending || (!isDestinationVerified && !!formData.destination.trim())}
            className="w-full text-base py-3 bg-gradient-to-r from-primary to-sky-600 hover:from-primary/90 hover:to-sky-600/90 text-white dark:from-sky-500 dark:to-sky-400 dark:hover:from-sky-500/90 dark:hover:to-sky-400/90 transition-all duration-300 ease-in-out transform hover:scale-105"
            size="lg"
          >
            {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
            {isPending ? "Generando Itinerario..." : "Generar Itinerario"}
          </Button>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            La generación puede tardar unos momentos. ¡Gracias por tu paciencia!
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
