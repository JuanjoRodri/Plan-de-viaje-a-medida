import type { JsonActivityLocation } from "@/types/enhanced-database"
import { MapPin, ExternalLink, CheckCircle, AlertTriangle, HelpCircle, Globe, Phone, Star, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatOpeningHours } from "@/lib/time-utils"

interface JsonLocationDisplayProps {
  location: JsonActivityLocation
  destinationName?: string
}

export default function JsonLocationDisplay({ location, destinationName }: JsonLocationDisplayProps) {
  if (!location.name) {
    return null
  }

  // Priorizar location.mapsUrl (que debería tener el CID si se guardó correctamente)
  // Luego, el placeId, y como último recurso, la búsqueda por nombre.
  const mapsLink =
    location.mapsUrl || // <--- USAR mapsUrl PRIMERO
    (location.googlePlaceId
      ? `https://www.google.com/maps/place/?q=place_id:${location.googlePlaceId}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + (destinationName ? `, ${destinationName}` : ""))}`)

  const getVerificationIcon = () => {
    if (location.verified) {
      return <CheckCircle className="h-4 w-4 text-green-500" title="Verificado" />
    }
    switch (location.verificationSource) {
      case "not_verified":
      case "verification_failed":
        return <AlertTriangle className="h-4 w-4 text-orange-500" title="No verificado" />
      case "verification_error":
        return <AlertTriangle className="h-4 w-4 text-red-500" title="Error en verificación" />
      default:
        return <HelpCircle className="h-4 w-4 text-gray-400" title="Estado desconocido" />
    }
  }

  const formatRating = (rating: number) => {
    return `${rating.toFixed(1)}/5`
  }

  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
      {/* Header con nombre y estado */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
          <MapPin className="h-4 w-4 mr-2 text-primary" />
          <span>{location.name}</span>
          <span className="ml-1.5">{getVerificationIcon()}</span>
        </div>

        {/* Rating badge si está disponible */}
        {location.userRating && (
          <Badge variant="secondary" className="text-xs">
            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
            {formatRating(location.userRating)}
          </Badge>
        )}
      </div>

      {/* Dirección */}
      {location.address && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 ml-6">{location.address}</p>}

      {/* Información de contacto y enlaces - organizados en líneas */}
      <div className="ml-6 space-y-1.5">
        {/* Primera línea: Maps y Website */}
        <div className="flex items-center gap-4">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Ver en Maps <ExternalLink className="h-3 w-3 ml-1" />
          </a>

          {location.website && (
            <a
              href={location.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >
              <Globe className="h-3 w-3 mr-1" />
              Sitio Web
            </a>
          )}
        </div>

        {/* Segunda línea: Teléfono y horarios si están disponibles */}
        <div className="flex items-center gap-4">
          {location.phoneNumber && (
            <a
              href={`tel:${location.phoneNumber}`}
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <Phone className="h-3 w-3 mr-1" />
              {location.phoneNumber}
            </a>
          )}

          {location.openingHours && (
            <div className="inline-flex items-center text-xs text-slate-600 dark:text-slate-400">
              <Clock className="h-3 w-3 mr-1" />
              <span className="font-medium">{formatOpeningHours(location.openingHours)}</span>
            </div>
          )}
        </div>

        {/* Tercera línea: Botón de fotos y información adicional */}
        <div className="flex items-center gap-4">
          {/* Información adicional si está disponible */}
          {location.userRatingsTotal && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {location.userRatingsTotal.toLocaleString()} reseñas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
