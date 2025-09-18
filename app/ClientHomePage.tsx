"use client"

import { useState, useEffect, useRef } from "react"
import TravelForm from "@/components/travel-form"
import Navbar from "@/components/navbar"
import type { JsonItinerary, WeatherData as JsonWeatherData } from "@/types/enhanced-database" // Added GenerationParams
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import {
  Home,
  Printer,
  Users2,
  Save,
  FolderOpen,
  Check,
  MapPin,
  ThermometerSun,
  FileDown,
  Edit,
  History,
  EuroIcon,
  Share2,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  Clock,
} from "lucide-react"
import SavedItinerariesModal, { type SavedItinerary } from "@/components/saved-itineraries-modal"
import ItineraryHistoryModal, { type ItineraryHistoryItem } from "@/components/itinerary-history"
import ItineraryEditor from "@/components/itinerary-editor/itinerary-editor"
import ItineraryMapView from "@/components/itinerary-map-view"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import EnhancedItineraryDisplay from "@/components/enhanced-itinerary-display"
import { generateItineraryPdfClient } from "@/app/services/generate-pdf-client"
import Image from "next/image"

interface User {
  id: string
  email: string
  name: string
  role: string
  monthly_itinerary_limit: number
  monthly_itineraries_used: number
  remaining_itineraries: number
  email_notifications_enabled?: boolean
  notification_hours_before?: number
  notification_email?: string
  agency_name?: string
  agency_phone?: string
  agency_email?: string
  agent_name?: string
  agency_address?: string
  agency_website?: string
  agency_logo_url?: string
}

interface CurrentItineraryState {
  itineraryJson: JsonItinerary
  id?: string
}

export default function ClientHomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentItinerary, setCurrentItinerary] = useState<CurrentItineraryState | null>(null)
  const [savedModalOpen, setSavedModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState("itinerary")
  const [navbarKey, setNavbarKey] = useState(0)
  const itineraryDisplayRef = useRef<HTMLDivElement>(null)

  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  const [showShareFormModal, setShowShareFormModal] = useState(false)
  const [referenceNote, setReferenceNote] = useState("")
  const [justLoadedItinerary, setJustLoadedItinerary] = useState(false)

  // Nuevos estados para notificaciones
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false)
  const [notificationHoursBefore, setNotificationHoursBefore] = useState(12)
  const [updatingNotifications, setUpdatingNotifications] = useState(false)

  // Añadir este estado después de los existentes
  const [lastAutoSavedId, setLastAutoSavedId] = useState<string | null>(null)

  useEffect(() => {
    const loadCurrentItinerary = () => {
      try {
        const currentItineraryJsonString = localStorage.getItem("currentJsonItinerary")
        if (currentItineraryJsonString) {
          const loadedJsonItinerary: JsonItinerary = JSON.parse(currentItineraryJsonString)
          setCurrentItinerary({ itineraryJson: loadedJsonItinerary, id: loadedJsonItinerary.id })
        }
      } catch (error) {
        console.error("Error cargando itinerario JSON actual:", error)
        localStorage.removeItem("currentJsonItinerary")
      }
    }
    loadCurrentItinerary()
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          // Cargar preferencias de notificación
          setEmailNotificationsEnabled(data.user.email_notifications_enabled || false)
          setNotificationHoursBefore(data.user.notification_hours_before || 12)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // Solo guardar en historial si:
    // 1. Hay un itinerario actual
    // 2. No estamos en modo edición
    // 3. Hay usuario autenticado
    // 4. NO acabamos de cargar un itinerario (para evitar duplicados)
    // 5. El itinerario NO es ya del historial (para evitar re-guardar)
    // 6. NO hemos guardado ya este itinerario específico (nuevo control)
    if (
      currentItinerary &&
      !editMode &&
      user &&
      !justLoadedItinerary &&
      !currentItinerary.itineraryJson.isHistory &&
      currentItinerary.itineraryJson.id !== lastAutoSavedId
    ) {
      saveToHistoryDb(currentItinerary.itineraryJson)
      setLastAutoSavedId(currentItinerary.itineraryJson.id)
    }
    if (justLoadedItinerary) {
      setJustLoadedItinerary(false)
    }
  }, [currentItinerary, editMode, user, justLoadedItinerary, lastAutoSavedId])

  const handleLimitsUpdate = (used: number, limit: number) => {
    setNavbarKey((prev) => prev + 1)
  }

  const updateNotificationPreferences = async () => {
    if (!user) return

    setUpdatingNotifications(true)
    try {
      const response = await fetch("/api/auth/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_notifications_enabled: emailNotificationsEnabled,
          notification_hours_before: notificationHoursBefore,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser({ ...user, ...data.user })
        console.log("Preferencias de notificación actualizadas")
      } else {
        console.error("Error actualizando preferencias")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setUpdatingNotifications(false)
    }
  }

  const saveToHistoryDb = async (itineraryJsonToSave: JsonItinerary) => {
    if (!user) return
    try {
      const payload = {
        id: itineraryJsonToSave.id, // Ensure ID is passed if it exists
        title: itineraryJsonToSave.title,
        destination: itineraryJsonToSave.destination.name,
        days: itineraryJsonToSave.daysCount,
        nights: itineraryJsonToSave.daysCount > 0 ? itineraryJsonToSave.daysCount - 1 : 0,
        travelers: itineraryJsonToSave.travelers,
        hotel: itineraryJsonToSave.preferences?.hotel?.name || "No especificado",
        arrival_time: itineraryJsonToSave.dailyPlans[0]?.activities[0]?.startTime || "N/A",
        departure_time:
          itineraryJsonToSave.dailyPlans[itineraryJsonToSave.dailyPlans.length - 1]?.activities[
            itineraryJsonToSave.dailyPlans[itineraryJsonToSave.dailyPlans.length - 1].activities.length - 1
          ]?.endTime || "N/A",
        budget_type: itineraryJsonToSave.budget?.type,
        json_content: itineraryJsonToSave,
        weather_data: itineraryJsonToSave.weatherData,
        budget_details: itineraryJsonToSave.budget
          ? {
              total_estimated: itineraryJsonToSave.budget.estimatedTotal,
              currency: itineraryJsonToSave.budget.currency,
            }
          : null,
        is_history: true,
        auto_saved: true, // This is an auto-save to history
        is_favorite: itineraryJsonToSave.isFavorite || false,
        start_date: itineraryJsonToSave.startDate,
        end_date: itineraryJsonToSave.endDate,
        board_type: itineraryJsonToSave.preferences?.boardType,
        generation_params: itineraryJsonToSave.generationParams,
      }
      const response = await fetch("/api/itineraries/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) console.error("Error saving to history DB:", await response.text())
      else console.log("Itinerario guardado en historial de BD (JSON).")
    } catch (error) {
      console.error("Error saving to history DB:", error)
    }
  }

  const handleItineraryGenerated = (itineraryJson: JsonItinerary) => {
    const newItineraryState: CurrentItineraryState = {
      itineraryJson: itineraryJson,
      id: itineraryJson.id,
    }
    setCurrentItinerary(newItineraryState)
    setJustLoadedItinerary(false)
    try {
      localStorage.setItem("currentJsonItinerary", JSON.stringify(itineraryJson))
    } catch (error) {
      console.error("Error guardando itinerario JSON actual en localStorage:", error)
    }
    handleLimitsUpdate(0, 0) // This might need actual values if limits are strictly enforced per generation
    window.scrollTo(0, 0)
    setEditMode(false)
    setActiveTab("itinerary")
    setLastAutoSavedId(null) // Permitir auto-guardado del nuevo itinerario
  }

  const handleReset = () => {
    setCurrentItinerary(null)
    setEditMode(false)
    try {
      localStorage.removeItem("currentJsonItinerary")
    } catch (error) {
      console.error("Error limpiando itinerario JSON actual de localStorage:", error)
    }
    window.scrollTo(0, 0)
    setLastAutoSavedId(null)
  }

  const handleSaveItineraryToDb = async () => {
    if (!currentItinerary?.itineraryJson || !user) {
      alert("No hay itinerario para guardar o no estás autenticado.")
      return
    }

    const itineraryToSave = currentItinerary.itineraryJson
    console.log("Attempting to save itinerary to DB:", itineraryToSave)

    try {
      const payload = {
        id: itineraryToSave.id, // Pass the existing ID
        title: itineraryToSave.title,
        destination: itineraryToSave.destination.name,
        days: itineraryToSave.daysCount,
        nights: itineraryToSave.daysCount > 0 ? itineraryToSave.daysCount - 1 : 0,
        travelers: itineraryToSave.travelers,
        hotel: itineraryToSave.preferences?.hotel?.name || "No especificado",
        arrival_time: itineraryToSave.dailyPlans[0]?.activities[0]?.startTime || "N/A",
        departure_time:
          itineraryToSave.dailyPlans[itineraryToSave.dailyPlans.length - 1]?.activities[
            itineraryToSave.dailyPlans[itineraryToSave.dailyPlans.length - 1].activities.length - 1
          ]?.endTime || "N/A",
        budget_type: itineraryToSave.budget?.type,
        json_content: itineraryToSave, // Crucial: send the full JSON object
        weather_data: itineraryToSave.weatherData,
        budget_details: itineraryToSave.budget
          ? {
              total_estimated: itineraryToSave.budget.estimatedTotal,
              currency: itineraryToSave.budget.currency,
              breakdown: itineraryToSave.budget.breakdown,
            }
          : null,
        is_history: false, // Mark as NOT history
        auto_saved: false, // Mark as NOT auto-saved
        is_favorite: true, // Explicitly mark as favorite when user clicks "Guardar"
        start_date: itineraryToSave.startDate,
        end_date: itineraryToSave.endDate,
        board_type: itineraryToSave.preferences?.boardType,
        generation_params: itineraryToSave.generationParams,
        // html_content: _convertJsonToHtml(itineraryToSave) // Optional: if you still want HTML in DB
      }

      const response = await fetch("/api/itineraries", {
        method: "POST", // This endpoint should handle upsert logic based on ID
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Itinerary saved successfully to DB:", result.itinerary)
        setSaveSuccess(true)
        // Update currentItinerary with the potentially updated one from DB (e.g., new updated_at)
        if (result.itinerary?.json_content) {
          setCurrentItinerary({ itineraryJson: result.itinerary.json_content, id: result.itinerary.id })
          localStorage.setItem("currentJsonItinerary", JSON.stringify(result.itinerary.json_content))
        } else if (result.itinerary) {
          setCurrentItinerary({ itineraryJson: result.itinerary, id: result.itinerary.id }) // Fallback if json_content is not nested
          localStorage.setItem("currentJsonItinerary", JSON.stringify(result.itinerary))
        }

        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        const errorData = await response.json()
        console.error("Error guardando itinerario en BD:", errorData.error)
        alert(`Error al guardar el itinerario: ${errorData.error || "Por favor, inténtalo de nuevo."}`)
      }
    } catch (error) {
      console.error("Error saving itinerary to DB (catch block):", error)
      alert("Error al guardar el itinerario. Por favor, inténtalo de nuevo.")
    }
  }

  const handleLoadItineraryFromHistory = (itineraryToLoad: ItineraryHistoryItem) => {
    handleLoadItinerary(itineraryToLoad)
    setHistoryModalOpen(false)
  }

  const handleLoadItineraryFromSaved = (itineraryToLoad: SavedItinerary) => {
    handleLoadItinerary(itineraryToLoad)
    setSavedModalOpen(false)
  }

  const handleLoadItinerary = (itineraryToLoad: SavedItinerary | ItineraryHistoryItem) => {
    let loadedJson: JsonItinerary | null = null
    if (itineraryToLoad.json_content) {
      if (typeof itineraryToLoad.json_content === "string") {
        try {
          loadedJson = JSON.parse(itineraryToLoad.json_content) as JsonItinerary
        } catch (e) {
          console.error("Error parsing json_content string:", e)
        }
      } else if (typeof itineraryToLoad.json_content === "object") {
        loadedJson = itineraryToLoad.json_content as JsonItinerary
      }
    }

    if (
      !loadedJson &&
      (("htmlContent" in itineraryToLoad && itineraryToLoad.htmlContent) ||
        ("html" in itineraryToLoad && itineraryToLoad.html) ||
        itineraryToLoad.id)
    ) {
      const baseHtml =
        ("htmlContent" in itineraryToLoad
          ? itineraryToLoad.htmlContent
          : "html" in itineraryToLoad
            ? itineraryToLoad.html
            : "") || ""
      const destinationName = itineraryToLoad.destination || "Destino Desconocido"
      const title = itineraryToLoad.title || `Viaje a ${destinationName}`
      const daysStr = String(itineraryToLoad.days || "1")
      const travelersStr = String(itineraryToLoad.travelers || "1")
      const hotelName = itineraryToLoad.hotel || "No especificado"
      const baseTimestamp =
        ("createdAt" in itineraryToLoad
          ? itineraryToLoad.createdAt
          : "savedAt" in itineraryToLoad
            ? itineraryToLoad.savedAt
            : Date.now()) || Date.now()
      const startDate = new Date(baseTimestamp).toISOString().split("T")[0]
      const endDateDays = Number.parseInt(daysStr) > 0 ? Number.parseInt(daysStr) - 1 : 0
      const endDate = new Date(new Date(baseTimestamp).setDate(new Date(baseTimestamp).getDate() + endDateDays))
        .toISOString()
        .split("T")[0]
      const budgetType =
        "budget" in itineraryToLoad && itineraryToLoad.budget
          ? (itineraryToLoad.budget as "low" | "medium" | "high" | "custom")
          : undefined
      const weatherData =
        "weather_data" in itineraryToLoad && itineraryToLoad.weather_data
          ? (itineraryToLoad.weather_data as JsonWeatherData | undefined)
          : undefined

      loadedJson = {
        id: itineraryToLoad.id,
        userId: user?.id || "unknown",
        title: title,
        destination: { name: destinationName, verified: false },
        startDate: startDate,
        endDate: endDate,
        daysCount: Number.parseInt(daysStr),
        travelers: Number.parseInt(travelersStr),
        preferences: { hotel: { name: hotelName } },
        dailyPlans: [],
        createdAt: new Date(baseTimestamp).toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        isFavorite: itineraryToLoad.is_favorite || false,
        isHistory: !itineraryToLoad.is_favorite,
        isCurrent: true,
        lastViewedAt: new Date().toISOString(),
        weatherData: weatherData,
        budget: budgetType ? { type: budgetType, currency: "EUR" } : undefined,
        generalNotes: baseHtml ? `Contenido HTML original:\n${baseHtml}` : undefined,
      }
    }

    if (loadedJson) {
      if (
        !loadedJson.id ||
        !loadedJson.destination ||
        typeof loadedJson.destination.name !== "string" ||
        typeof loadedJson.daysCount !== "number" ||
        isNaN(loadedJson.daysCount) ||
        typeof loadedJson.travelers !== "number" ||
        isNaN(loadedJson.travelers) ||
        !Array.isArray(loadedJson.dailyPlans)
      ) {
        alert("Error: El itinerario cargado tiene un formato JSON incompleto o con tipos de datos incorrectos.")
        setCurrentItinerary(null)
        localStorage.removeItem("currentJsonItinerary")
        return
      }
      setCurrentItinerary({ itineraryJson: loadedJson, id: loadedJson.id })
      setEditMode(false)
      setJustLoadedItinerary(true)
      try {
        localStorage.setItem("currentJsonItinerary", JSON.stringify(loadedJson))
      } catch (error) {
        console.error("Error guardando itinerario JSON cargado en localStorage:", error)
      }
      window.scrollTo(0, 0)
      setActiveTab("itinerary")
      setLastAutoSavedId(null) // Resetear para permitir auto-guardado del itinerario cargado si se modifica
    } else {
      alert("Error crítico al cargar el itinerario.")
    }
  }

  const handleExportPdf = async () => {
    if (!currentItinerary?.itineraryJson) return
    setExportingPdf(true)
    try {
      await generateItineraryPdfClient(currentItinerary.itineraryJson)
    } finally {
      setExportingPdf(false)
    }
  }

  const handleSaveEditedItinerary = (updatedItineraryJson: JsonItinerary) => {
    setCurrentItinerary({ itineraryJson: updatedItineraryJson, id: updatedItineraryJson.id })
    setEditMode(false)
    try {
      localStorage.setItem("currentJsonItinerary", JSON.stringify(updatedItineraryJson))
    } catch (error) {
      console.error("Error guardando itinerario JSON editado en localStorage:", error)
    }
    window.scrollTo(0, 0)
    setActiveTab("itinerary")
  }

  const getBudgetDescription = (): string => {
    if (!currentItinerary?.itineraryJson.budget) return ""
    const budget = currentItinerary.itineraryJson.budget
    let desc = ""
    switch (budget.type) {
      case "low":
        desc = "Económico"
        break
      case "medium":
        desc = "Estándar"
        break
      case "high":
        desc = "Premium"
        break
      case "custom":
        desc = "Personalizado"
        break
      default:
        desc = budget.type
    }
    if (budget.estimatedTotal) {
      desc += ` (${budget.estimatedTotal.toLocaleString()} ${budget.currency})`
    }
    return desc
  }

  const handleShareItinerary = async () => {
    if (!currentItinerary?.itineraryJson || !user) {
      setShareError("Debes tener un itinerario cargado y estar autenticado para compartir.")
      return
    }

    // Actualizar preferencias de notificación antes de compartir
    await updateNotificationPreferences()

    setIsSharing(true)
    setShareError(null)
    setShareUrl(null)
    try {
      const payload = {
        itineraryJson: currentItinerary.itineraryJson,
        originalItineraryId: currentItinerary.id,
        reference_note: referenceNote.trim() || undefined,
        expiresInDays: 30,
      }
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Error al crear el enlace compartido.")
      }
      setShareUrl(data.shareUrl)
      setShowShareFormModal(false)
      setShowShareModal(true)
    } catch (error: any) {
      setShareError(error.message || "Ocurrió un error desconocido al compartir.")
    } finally {
      setIsSharing(false)
    }
  }

  if (editMode && currentItinerary?.itineraryJson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Navbar key={navbarKey} />
        <div className="container mx-auto px-4 py-8">
          <ItineraryEditor
            initialJsonItinerary={currentItinerary.itineraryJson}
            weatherData={currentItinerary.itineraryJson.weatherData}
            onSave={handleSaveEditedItinerary}
            onCancel={() => setEditMode(false)}
            userId={user?.id || ""}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar key={navbarKey} />
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center mb-4 md:mb-0">
            <Image
              src="https://i.ibb.co/dwt8DnG6/644757bd-a027-4e9e-b92e-546a9a20dbcf.png"
              alt="Logo"
              width={120}
              height={120}
              className="w-30 h-30 object-contain"
              priority
            />
          </div>
          <div className="flex gap-2">
            {!currentItinerary && (
              <>
                <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <History className="h-4 w-4" /> Historial
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                    <ItineraryHistoryModal onLoadItinerary={handleLoadItineraryFromHistory} />
                  </DialogContent>
                </Dialog>

                <Dialog open={savedModalOpen} onOpenChange={setSavedModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <FolderOpen className="h-4 w-4" /> Guardados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                    <SavedItinerariesModal onLoadItinerary={handleLoadItineraryFromSaved} />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </header>

        {!currentItinerary ? (
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 shadow-lg relative z-10">
              <div className="mb-6 flex justify-center">
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <img
                    src="https://i.ibb.co/wrryWH5K/imagen-viaje.png"
                    alt="Planificación de viajes"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-center mb-4">Crea un itinerario personalizado</h3>
              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Cargando...</p>
                  </div>
                </div>
              ) : (
                <TravelForm
                  onItineraryGenerated={handleItineraryGenerated}
                  user={user}
                  onLimitsUpdate={handleLimitsUpdate}
                />
              )}
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary mr-2" />
                  <h2 className="text-2xl font-bold text-primary">
                    Itinerario para {currentItinerary.itineraryJson.destination.name}
                  </h2>
                </div>
                <p className="text-muted-foreground ml-7 flex flex-wrap items-center gap-2 text-sm">
                  <span>{currentItinerary.itineraryJson.daysCount} días</span>
                  <span className="mx-1">|</span>
                  <span className="flex items-center">
                    <Users2 className="h-4 w-4 mr-1" />
                    {currentItinerary.itineraryJson.travelers}{" "}
                    {Number(currentItinerary.itineraryJson.travelers) === 1 ? "persona" : "personas"}
                  </span>
                  {currentItinerary.itineraryJson.preferences?.hotel?.name && (
                    <>
                      <span className="mx-1">|</span>
                      <span>Alojamiento: {currentItinerary.itineraryJson.preferences.hotel.name}</span>
                    </>
                  )}
                  {currentItinerary.itineraryJson.budget && (
                    <>
                      <span className="mx-1">|</span>
                      <span className="flex items-center">
                        <EuroIcon className="h-4 w-4 mr-1" />
                        {getBudgetDescription()}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <History className="h-4 w-4" /> Historial
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                    <ItineraryHistoryModal onLoadItinerary={handleLoadItineraryFromHistory} />
                  </DialogContent>
                </Dialog>

                <Dialog open={savedModalOpen} onOpenChange={setSavedModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <FolderOpen className="h-4 w-4" /> Guardados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                    <SavedItinerariesModal onLoadItinerary={handleLoadItineraryFromSaved} />
                  </DialogContent>
                </Dialog>
                <Button onClick={handleReset} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Home className="h-4 w-4" /> Nuevo itinerario
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex">
                  <div className="mr-3 mt-1">
                    <Users2 className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm">
                    Itinerario personalizado para {currentItinerary.itineraryJson.travelers}{" "}
                    {Number(currentItinerary.itineraryJson.travelers) === 1 ? "persona" : "personas"}.
                  </p>
                </div>
              </Card>
              {currentItinerary.itineraryJson.weatherData && (
                <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex">
                    <div className="mr-3 mt-1">
                      <ThermometerSun className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-sm">Incluye información meteorológica para una mejor planificación.</p>
                  </div>
                </Card>
              )}
            </div>

            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center">
                  <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Compartir Itinerario con Cliente</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Genera un enlace público para que tu cliente pueda ver el itinerario.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowShareFormModal(true)}
                  disabled={isSharing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium w-full sm:w-auto"
                  size="lg"
                >
                  {isSharing ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Share2 className="h-5 w-5 mr-2" />}{" "}
                  {isSharing ? "Generando Enlace..." : "Compartir Itinerario"}
                </Button>
              </div>
              {shareError && <p className="text-red-500 text-sm mt-2 text-center sm:text-left">{shareError}</p>}
            </Card>

            <Tabs defaultValue="itinerary" value={activeTab} onValueChange={setActiveTab} className="relative z-10">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="itinerary">Itinerario Detallado</TabsTrigger>
                <TabsTrigger value="map">Mapa de Ruta</TabsTrigger>
              </TabsList>
              <TabsContent value="itinerary">
                <div ref={itineraryDisplayRef}>
                  <EnhancedItineraryDisplay itinerary={currentItinerary.itineraryJson} />
                </div>
              </TabsContent>
              <TabsContent value="map">
                <ItineraryMapView itineraryJson={currentItinerary.itineraryJson} />
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-4 mt-8">
              <Button
                variant="outline"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent"
                onClick={() => setEditMode(true)}
              >
                <Edit className="h-4 w-4" /> Personalizar
              </Button>
              <Button
                variant={saveSuccess ? "default" : "outline"}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 ${saveSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                onClick={handleSaveItineraryToDb}
                disabled={saveSuccess || !user}
              >
                {saveSuccess ? (
                  <>
                    <Check className="h-4 w-4" /> Guardado
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Guardar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent"
                onClick={handleExportPdf}
                disabled={exportingPdf}
              >
                {exportingPdf ? (
                  "Exportando..."
                ) : (
                  <>
                    <FileDown className="h-4 w-4" /> Exportar PDF
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="flex-1 md:flex-none flex items-center justify-center gap-2"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Imprimir Vista
              </Button>
            </div>
          </div>
        )}

        <footer className="mt-8 text-center text-xs text-muted-foreground border-t pt-4">
          <p>Plan de Viaje a Medida | Desarrollado por JJ Rodriguez Studio</p>
        </footer>
      </div>

      {showShareModal && shareUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Enlace Compartido Generado</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <Check className="w-5 h-5 mr-2" />
                ¡El enlace se ha creado exitosamente!
              </p>
              <div>
                <label
                  htmlFor="shareable-link"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Enlace para compartir:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="shareable-link"
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-slate-800 dark:text-slate-100 focus:ring-primary focus:border-primary"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      alert("¡Enlace copiado al portapapeles!")
                    }}
                    aria-label="Copiar enlace"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <Button
                  onClick={() => window.open(shareUrl, "_blank")}
                  className="flex-1 flex items-center justify-center"
                  variant="outline"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Ver Itinerario
                </Button>
                <Button onClick={() => setShowShareModal(false)} className="flex-1">
                  Cerrar
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                Este enlace es público y expira en 30 días (o según configuración).
              </p>
            </div>
          </Card>
        </div>
      )}
      {showShareFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Compartir Itinerario</h3>
              <button
                onClick={() => {
                  setShowShareFormModal(false)
                  setReferenceNote("")
                  setShareError(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="reference-note"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Referencia / Cliente (opcional)
                </label>
                <input
                  id="reference-note"
                  type="text"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  placeholder="Ej: Juan Pérez, Boda Mayo 2024, Ref: #12345..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-800 dark:text-slate-100 focus:ring-primary focus:border-primary"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Esta referencia te ayudará a identificar el enlace en tu lista de itinerarios compartidos.
                </p>
              </div>

              {/* Sección de Notificaciones por Email */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-blue-600 mr-2" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notificaciones por Email
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={emailNotificationsEnabled}
                      onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {emailNotificationsEnabled && (
                  <div className="ml-7 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Avisar</span>
                      <select
                        value={notificationHoursBefore}
                        onChange={(e) => setNotificationHoursBefore(Number(e.target.value))}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                      >
                        <option value={6}>6 horas antes</option>
                        <option value={12}>12 horas antes</option>
                        <option value={24}>24 horas antes</option>
                        <option value={48}>48 horas antes</option>
                      </select>
                      <span className="text-xs text-gray-600 dark:text-gray-400">de que expire</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recibirás un email en <strong>{user?.email}</strong> cuando el enlace esté próximo a expirar.
                    </p>
                  </div>
                )}
              </div>

              {shareError && <p className="text-red-500 text-sm">{shareError}</p>}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <Button
                  onClick={() => {
                    setShowShareFormModal(false)
                    setReferenceNote("")
                    setShareError(null)
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isSharing || updatingNotifications}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleShareItinerary}
                  disabled={isSharing || updatingNotifications}
                  className="flex-1 flex items-center justify-center"
                >
                  {isSharing || updatingNotifications ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4 mr-2" />
                  )}
                  {isSharing ? "Creando Enlace..." : updatingNotifications ? "Guardando..." : "Crear Enlace"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
