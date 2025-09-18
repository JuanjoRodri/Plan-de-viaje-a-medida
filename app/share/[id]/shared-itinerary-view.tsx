"use client"

import EnhancedItineraryDisplay from "@/components/enhanced-itinerary-display"
import type { JsonItinerary } from "@/types/enhanced-database"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import ItineraryMapView from "@/components/itinerary-map-view"

interface AgencyInfo {
  agency_name?: string
  agency_phone?: string
  agency_email?: string
  agent_name?: string
  agency_address?: string
  agency_website?: string
  agency_logo_url?: string
}

interface SharedItineraryViewProps {
  itinerary: JsonItinerary
  sharedId: string
  agencyInfo?: AgencyInfo | null
}

export default function SharedItineraryView({ itinerary, sharedId, agencyInfo }: SharedItineraryViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true)
        toast({
          title: "Enlace Copiado",
          description: "El enlace a esta página ha sido copiado al portapapeles.",
        })
        setTimeout(() => setCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err)
        toast({
          title: "Error al Copiar",
          description: "No se pudo copiar el enlace. Inténtalo manualmente.",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="bg-white dark:bg-slate-950 shadow-xl rounded-lg overflow-hidden">
      <header className="bg-slate-100 dark:bg-slate-800 p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
        {/* Información de la agencia */}
        {agencyInfo && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-3">
              {agencyInfo.agency_logo_url && (
                <img
                  src={agencyInfo.agency_logo_url || "/placeholder.svg"}
                  alt="Logo"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {agencyInfo.agency_name && <div className="font-medium">{agencyInfo.agency_name}</div>}
                <div className="flex gap-4">
                  {agencyInfo.agency_phone && <span>{agencyInfo.agency_phone}</span>}
                  {agencyInfo.agency_email && <span>{agencyInfo.agency_email}</span>}
                  {agencyInfo.agency_address && <span>{agencyInfo.agency_address}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Itinerario de Viaje</h1>
            {itinerary.title && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">"{itinerary.title}"</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-full sm:w-auto bg-transparent">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Enlace Copiado" : "Copiar Enlace"}
            </Button>
          </div>
        </div>
      </header>

      {/* Mapa del itinerario */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <ItineraryMapView itineraryJson={itinerary} />
      </div>

      <div className="p-1 md:p-0">
        <EnhancedItineraryDisplay itinerary={itinerary} />
      </div>

      <footer className="text-center p-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <p>
          Itinerario generado por{" "}
          <a href={process.env.NEXT_PUBLIC_BASE_URL || "/"} className="font-semibold text-primary hover:underline">
            {process.env.NEXT_PUBLIC_APP_NAME || "Personalizador de Viajes"}
          </a>
          .
        </p>
        <p>
          Este es un itinerario de ejemplo y puede estar sujeto a cambios. Confirma todos los detalles antes de viajar.
        </p>
      </footer>
    </div>
  )
}
