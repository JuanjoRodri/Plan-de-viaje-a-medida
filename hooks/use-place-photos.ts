"use client"

import { useState, useCallback } from "react"
import type { PlacePhoto, PlacePhotosResponse } from "@/types/enhanced-database"

interface UsePlacePhotosReturn {
  photos: PlacePhoto[]
  loading: boolean
  error: string | null
  loadPhotos: (placeId: string, googlePlaceId?: string) => Promise<void>
  clearPhotos: () => void
}

export function usePlacePhotos(): UsePlacePhotosReturn {
  const [photos, setPhotos] = useState<PlacePhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPhotos = useCallback(async (placeId: string, googlePlaceId?: string) => {
    if (!placeId) {
      setError("Place ID is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = new URL(`/api/places/photos/${encodeURIComponent(placeId)}`, window.location.origin)
      if (googlePlaceId) {
        url.searchParams.set("googlePlaceId", googlePlaceId)
      }

      const response = await fetch(url.toString())
      const data: PlacePhotosResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (data.success) {
        setPhotos(data.photos)
        setError(null)
      } else {
        setError(data.error || "Failed to load photos")
        setPhotos([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load photos"
      setError(errorMessage)
      setPhotos([])
      console.error("Error loading photos:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearPhotos = useCallback(() => {
    setPhotos([])
    setError(null)
  }, [])

  return {
    photos,
    loading,
    error,
    loadPhotos,
    clearPhotos,
  }
}
