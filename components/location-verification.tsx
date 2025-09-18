"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertTriangle, MapPin, X } from "lucide-react"
import { verifyLocation } from "@/app/services/weather-service"

interface LocationVerificationProps {
  initialLocation: string
  onLocationVerified: (verifiedLocation: string) => void
  onCancel: () => void
  autoVerify?: boolean
  placeName?: string
  destination?: string
}

export default function LocationVerification({
  initialLocation,
  onLocationVerified,
  onCancel,
  autoVerify = false,
  placeName,
  destination,
}: LocationVerificationProps) {
  const [location, setLocation] = useState(initialLocation)
  const [verifying, setVerifying] = useState(autoVerify)
  const [result, setResult] = useState<{
    status: string
    normalizedLocation: string
    message: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (autoVerify && initialLocation) {
      handleVerify()
    }
  }, [autoVerify, initialLocation])

  const handleVerify = async () => {
    if (!location.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const result = await verifyLocation(location)
      setResult(result)
    } catch (error) {
      console.error("Error during verification:", error)
      setError("Error al verificar la ubicación. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (result && result.status === "verified") {
      onLocationVerified(result.normalizedLocation)
    }
  }

  const renderVerificationResult = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-red-500 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Error: {error}
        </div>
      )
    }

    if (!result) {
      return null
    }

    if (result.status === "closed_permanently") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
          <div className="flex items-start">
            <X className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-700">Lugar cerrado permanentemente</p>
              <p className="text-sm text-red-600 mt-1">{result.message}</p>
              <div className="mt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    placeName + " " + destination,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-700 hover:text-red-800 underline"
                >
                  Buscar alternativas en Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className={`p-4 rounded-md ${
          result.status === "verified"
            ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
            : "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
        }`}
      >
        <div className="flex items-start gap-3">
          {result.status === "verified" ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <p className="font-medium">
              {result.status === "verified" ? "Ubicación verificada" : "Ubicación no verificada"}
            </p>
            <p className="text-sm mt-1">{result.message}</p>
            {result.status === "verified" && (
              <p className="text-sm font-medium mt-2">Ubicación normalizada: {result.normalizedLocation}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Verificación de ubicación
        </CardTitle>
        <CardDescription>Verifica que la ubicación sea correcta antes de obtener datos del clima</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Destino</Label>
          <div className="flex gap-2">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Barcelona, España"
              disabled={isLoading}
            />
            <Button onClick={handleVerify} disabled={isLoading || !location.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </div>
        </div>

        {renderVerificationResult()}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!result || result.status !== "verified"}>
          Confirmar ubicación
        </Button>
      </CardFooter>
    </Card>
  )
}
