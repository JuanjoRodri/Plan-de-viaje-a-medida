"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Cloud, ThermometerSun } from "lucide-react"
import Link from "next/link"
import WeatherForecast from "@/components/weather-forecast"
import type { WeatherData } from "@/app/services/weather-service"

export default function WeatherPage() {
  const [destination, setDestination] = useState("")
  const [days, setDays] = useState(7)
  const [showForecast, setShowForecast] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [recommendations, setRecommendations] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (destination.trim()) {
      setShowForecast(true)
    }
  }

  const handleWeatherDataReady = (data: WeatherData, recs: string) => {
    if (data) {
      setWeatherData(data)
      setRecommendations(recs)
    } else {
      // Si no hay datos, volver al formulario
      setShowForecast(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
          <ThermometerSun className="h-7 w-7" />
          Pronóstico del tiempo para viajes
        </h1>
        <p className="text-muted-foreground">
          Obtén información meteorológica para tu destino y recibe recomendaciones personalizadas basadas en el clima
          previsto durante tus fechas de viaje.
        </p>
      </div>

      {!showForecast ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Consultar pronóstico</CardTitle>
              <CardDescription>
                Introduce tu destino y la duración de tu viaje para obtener información meteorológica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ej: Barcelona, España"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">Número de días</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="14"
                    value={days}
                    onChange={(e) => setDays(Number.parseInt(e.target.value) || 7)}
                  />
                  <p className="text-xs text-muted-foreground">Puedes consultar hasta 14 días de pronóstico.</p>
                </div>
                <Button type="submit" className="w-full">
                  Obtener pronóstico
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                ¿Por qué consultar el clima?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">1</div>
                  <div>
                    <h3 className="font-medium">Planifica mejor tus actividades</h3>
                    <p className="text-sm text-muted-foreground">
                      Organiza actividades al aire libre en días soleados y ten alternativas para días lluviosos.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">2</div>
                  <div>
                    <h3 className="font-medium">Prepara tu equipaje adecuadamente</h3>
                    <p className="text-sm text-muted-foreground">
                      Lleva la ropa y accesorios apropiados según las condiciones climáticas previstas.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 p-2 rounded-full text-primary">3</div>
                  <div>
                    <h3 className="font-medium">Evita sorpresas desagradables</h3>
                    <p className="text-sm text-muted-foreground">
                      Anticípate a condiciones extremas o inesperadas que podrían afectar tu experiencia.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">¿Sabías que...?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  El clima puede variar significativamente incluso dentro de una misma región. Nuestro sistema utiliza
                  datos meteorológicos de OpenWeatherMap, una de las APIs de clima más precisas y confiables
                  disponibles, para ofrecerte la información más actualizada posible para tu destino específico.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <WeatherForecast destination={destination} days={days} onWeatherDataReady={handleWeatherDataReady} />
      )}

      {weatherData && (
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => {
              setShowForecast(false)
              setWeatherData(null)
              setRecommendations("")
            }}
          >
            Consultar otro destino
          </Button>
        </div>
      )}
    </div>
  )
}
