"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Cloud,
  Sun,
  Umbrella,
  ThermometerSun,
  CloudFog,
  CloudLightning,
  Snowflake,
  AlertTriangle,
  Info,
  Droplets,
} from "lucide-react"
import { getWeatherForecast, type WeatherData } from "@/app/services/weather-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WeatherForecastProps {
  destination: string
  days: number
  onWeatherDataReady: (weatherData: WeatherData | null) => void
}

const weatherTranslations: { [key: string]: string } = {
  "clear sky": "Despejado",
  "few clouds": "Pocas nubes",
  "scattered clouds": "Nubes dispersas",
  "broken clouds": "Intervalos nubosos",
  "overcast clouds": "Nublado",
  "shower rain": "Chubascos",
  "light rain": "Lluvia ligera",
  "moderate rain": "Lluvia moderada",
  "heavy intensity rain": "Lluvia intensa",
  rain: "Lluvia",
  thunderstorm: "Tormenta",
  snow: "Nieve",
  mist: "Niebla",
  fog: "Niebla",
  "light intensity drizzle": "Llovizna",
  drizzle: "Llovizna",
}

function translateCondition(condition: string): string {
  const lowerCondition = condition.toLowerCase()
  // Buscar la traducción más específica primero
  if (weatherTranslations[lowerCondition]) {
    return weatherTranslations[lowerCondition]
  }
  // Buscar por palabras clave si no hay coincidencia exacta
  for (const key in weatherTranslations) {
    if (lowerCondition.includes(key)) {
      return weatherTranslations[key]
    }
  }
  // Fallback: capitalizar la primera letra
  return condition.charAt(0).toUpperCase() + condition.slice(1)
}

export default function WeatherForecast({ destination, days, onWeatherDataReady }: WeatherForecastProps) {
  const [loading, setLoading] = useState(true)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    if (destination && days > 0) {
      fetchWeatherData(destination, days)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, days])

  const fetchWeatherData = async (location: string, numDays: number) => {
    setLoading(true)
    setError(null)
    setWeatherData(null)
    try {
      const data = await getWeatherForecast(location, numDays)
      if (!data) throw new Error("No se pudieron obtener datos del clima")
      if (data.location.lat === 0 && data.location.lon === 0) setUsingMockData(true)
      setWeatherData(data)
      onWeatherDataReady(data)
    } catch (err: any) {
      const errorMessage =
        err.message.includes("API key") || err.message.includes("autenticación")
          ? "Error de configuración del servicio de clima."
          : `No se pudo obtener el clima para "${location}".`
      setError(errorMessage)
      onWeatherDataReady(null)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase()
    if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("lluvia") || lower.includes("chubasco"))
      return <Umbrella className="h-8 w-8 text-blue-500" />
    if (lower.includes("snow") || lower.includes("nieve")) return <Snowflake className="h-8 w-8 text-blue-200" />
    if (lower.includes("sun") || lower.includes("clear") || lower.includes("despejado"))
      return <Sun className="h-8 w-8 text-amber-500" />
    if (lower.includes("fog") || lower.includes("mist") || lower.includes("niebla"))
      return <CloudFog className="h-8 w-8 text-gray-400" />
    if (lower.includes("thunder") || lower.includes("storm") || lower.includes("tormenta"))
      return <CloudLightning className="h-8 w-8 text-purple-500" />
    return <Cloud className="h-8 w-8 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Cargando pronóstico del tiempo...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!weatherData) return null

  return (
    <Card className="w-full bg-slate-50/50 dark:bg-slate-800/30 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ThermometerSun className="h-5 w-5 text-primary" />
          Pronóstico para {weatherData.location.name}
        </CardTitle>
        <CardDescription>Previsión para los próximos {weatherData.forecast.length} días.</CardDescription>
      </CardHeader>
      <CardContent>
        {usingMockData && (
          <Alert
            variant="default"
            className="mb-4 bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
          >
            <Info className="h-4 w-4" />
            <AlertDescription>Mostrando datos simulados. La API del clima no está disponible.</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {weatherData.forecast.map((day, index) => (
            <div
              key={day.date}
              className={`flex flex-col items-center p-3 rounded-lg text-center ${index === 0 ? "bg-primary/10 dark:bg-primary/20" : "bg-slate-100 dark:bg-slate-800"}`}
            >
              <p className="font-bold text-sm capitalize">
                {new Date(day.date).toLocaleDateString("es-ES", { weekday: "short" })}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {new Date(day.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
              <div className="my-2">{getWeatherIcon(day.condition)}</div>
              <p className="font-bold text-lg">{Math.round(day.maxTemp)}°</p>
              <p className="text-sm text-muted-foreground">{Math.round(day.minTemp)}°</p>
              <p className="text-xs capitalize mt-2 text-center h-8 flex items-center">
                {translateCondition(day.condition)}
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-2">
                <Droplets className="h-3 w-3" />
                <span>{day.chanceOfRain}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
