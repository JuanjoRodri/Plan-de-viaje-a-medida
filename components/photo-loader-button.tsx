"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, AlertCircle } from "lucide-react"
import { usePlacePhotos } from "@/hooks/use-place-photos"
import { PhotoGalleryModal } from "./photo-gallery-modal"
import { useUser } from "@/hooks/use-user"
import { hasPhotoAccess } from "@/lib/role-utils"

interface PhotoLoaderButtonProps {
  placeId: string
  googlePlaceId?: string
  placeName: string
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg"
}

export function PhotoLoaderButton({
  placeId,
  googlePlaceId,
  placeName,
  className = "",
  variant = "outline",
  size = "sm",
}: PhotoLoaderButtonProps) {
  const [showGallery, setShowGallery] = useState(false)
  const { photos, loading, error, loadPhotos } = usePlacePhotos()
  const { user } = useUser()

  // Verificar si el usuario tiene acceso a fotos
  if (!user || !hasPhotoAccess(user.role)) {
    return null
  }

  const handleLoadPhotos = async () => {
    if (photos.length > 0) {
      // Si ya tenemos fotos, mostrar galería directamente
      setShowGallery(true)
    } else {
      // Cargar fotos primero
      await loadPhotos(placeId, googlePlaceId)
      if (photos.length > 0) {
        setShowGallery(true)
      }
    }
  }

  const buttonText = photos.length > 0 ? `Ver fotos (${photos.length})` : "Cargar fotos"

  const buttonIcon = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : error ? (
    <AlertCircle className="h-4 w-4" />
  ) : (
    <Camera className="h-4 w-4" />
  )

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleLoadPhotos}
        disabled={loading}
        className={`${className} ${error ? "text-red-600 border-red-300" : ""}`}
        title={error || `Cargar fotos de ${placeName}`}
      >
        {buttonIcon}
        <span className="ml-1.5">{buttonText}</span>
      </Button>

      {showGallery && photos.length > 0 && (
        <PhotoGalleryModal
          photos={photos}
          placeName={placeName}
          isOpen={showGallery}
          onClose={() => setShowGallery(false)}
        />
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1">
          {error.includes("not available") ? "Fotos no disponibles en tu plan" : "Error al cargar fotos"}
        </p>
      )}
    </>
  )
}
