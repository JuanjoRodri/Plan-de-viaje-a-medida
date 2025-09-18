"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react"
import type { PlacePhoto } from "@/types/enhanced-database"

interface PhotoGalleryModalProps {
  photos: PlacePhoto[]
  placeName: string
  isOpen: boolean
  onClose: () => void
}

export function PhotoGalleryModal({ photos, placeName, isOpen, onClose }: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (photos.length === 0) {
    return null
  }

  const currentPhoto = photos[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious()
    if (e.key === "ArrowRight") goToNext()
    if (e.key === "Escape") onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Fotos de {placeName}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} de {photos.length}
              </span>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex-1 flex items-center justify-center bg-black/5">
          {/* Imagen principal */}
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={currentPhoto.photo_url || "/placeholder.svg"}
              alt={`Foto ${currentIndex + 1} de ${placeName}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              loading="lazy"
            />

            {/* Botones de navegación */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-white/90 hover:bg-white shadow-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Miniaturas */}
        {photos.length > 1 && (
          <div className="p-4 pt-2">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    index === currentIndex ? "border-primary shadow-md" : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={photo.photo_url || "/placeholder.svg"}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Información de la foto */}
        <div className="p-4 pt-0 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Dimensiones: {currentPhoto.width} × {currentPhoto.height}px
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(currentPhoto.photo_url, "_blank")}
              className="h-8 px-2"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir original
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
