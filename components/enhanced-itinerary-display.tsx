"use client"

import type { JsonItinerary } from "@/types/enhanced-database"
import JsonDailyPlanDisplay from "./json-itinerary/json-daily-plan-display"
import WeatherDayBadge from "./weather-day-badge"
import { Info, Users, CalendarRange, Hotel, Euro, StickyNote, Palette } from "lucide-react"

interface EnhancedItineraryDisplayProps {
  itinerary: JsonItinerary | null
}

export default function EnhancedItineraryDisplay({ itinerary }: EnhancedItineraryDisplayProps) {
  const translateActivityType = (type: string): string => {
    const translations: { [key: string]: string } = {
      culture: "cultura",
      food: "gastronomía",
      sightseeing: "turismo",
      accommodation: "alojamiento",
      meal: "comida",
      transport: "transporte",
      free_time: "tiempo libre",
      event: "evento",
      custom: "personalizado",
    }
    return translations[type] || type
  }

  const translateBudgetType = (type: string): string => {
    const translations: { [key: string]: string } = {
      low: "bajo",
      medium: "medio",
      high: "alto",
      custom: "personalizado",
    }
    return translations[type] || type
  }

  const getBoardTypeDescription = (boardType?: string) => {
    switch (boardType) {
      // Valores del formulario (correctos)
      case "sin-pension":
        return "Solo Alojamiento"
      case "solo-desayuno":
        return "Alojamiento y Desayuno"
      case "media-pension":
        return "Media Pensión"
      case "pension-completa":
        return "Pensión Completa"
      case "todo-incluido":
        return "Todo Incluido"
    }
  }

  if (!itinerary) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">No hay itinerario para mostrar.</div>
  }

  // Ensure dailyPlans is sorted
  const sortedDailyPlans = itinerary.dailyPlans
    ? [...itinerary.dailyPlans].sort((a, b) => a.dayNumber - b.dayNumber)
    : []

  return (
    <div className="p-2 md:p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      {/* Cabecera del Itinerario */}
      <header className="mb-6 p-4 bg-primary/10 dark:bg-primary/20 border-l-4 border-primary rounded-md">
        <h1 className="text-2xl md:text-3xl font-bold text-primary dark:text-sky-300">{itinerary.title}</h1>
        {itinerary.destination?.name && (
          <p className="text-md text-slate-700 dark:text-slate-300 mt-1">
            <Info className="inline-block h-4 w-4 mr-1.5 relative -top-0.5" />
            Destino: {itinerary.destination.name}
          </p>
        )}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          {(itinerary.startDate || itinerary.endDate || itinerary.daysCount) && (
            <p>
              <CalendarRange className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-0.5" />
              {itinerary.startDate} al {itinerary.endDate} ({itinerary.daysCount} días)
            </p>
          )}
          {itinerary.travelers && (
            <p>
              <Users className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-0.5" />
              {itinerary.travelers} viajero(s)
            </p>
          )}
          {itinerary.preferences?.hotel?.name && (
            <p>
              <Hotel className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-0.5" />
              Hotel: {itinerary.preferences.hotel.name}
            </p>
          )}
          {itinerary.budget?.type && (
            <p>
              <Euro className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-0.5" />
              Presupuesto: {translateBudgetType(itinerary.budget.type)}
              {itinerary.budget.estimatedTotal &&
                ` (${itinerary.budget.estimatedTotal.toLocaleString()} ${itinerary.budget.currency || ""})`}
            </p>
          )}
          {itinerary.preferences?.boardType && (
            <p>
              <Palette className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-0.5" />
              Pensión: {getBoardTypeDescription(itinerary.preferences.boardType)}
            </p>
          )}
          {itinerary.preferences?.activityTypes && itinerary.preferences.activityTypes.length > 0 && (
            <p>
              <Palette className="inline-block h-3.5 w-3.5 mr-1.5 relative -top-0.5" />
              Intereses: {itinerary.preferences.activityTypes.map((type) => translateActivityType(type)).join(", ")}
            </p>
          )}
        </div>
      </header>

      {/* Disclaimer de verificación */}
      <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-700 dark:text-amber-300">
            <p className="font-medium mb-1">Verificación automática</p>
            <p>
              Los lugares han sido verificados automáticamente. En casos excepcionales (&lt;5%), algunos lugares podrían
              requerir confirmación adicional, estar temporalmente cerrados, o encontrarse a mayor distancia del centro.
              Recomendamos verificar horarios y ubicaciones antes de la visita.
            </p>
          </div>
        </div>
      </div>

      {/* Pronóstico del tiempo si está disponible */}
      {itinerary.weatherData && itinerary.weatherData.forecast && itinerary.weatherData.forecast.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-slate-700 dark:text-slate-200">Pronóstico del Tiempo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {itinerary.weatherData.forecast.map((dayWeather) => (
              <WeatherDayBadge
                key={dayWeather.date}
                date={dayWeather.date}
                minTemp={dayWeather.temperature.min}
                maxTemp={dayWeather.temperature.max}
                condition={dayWeather.description}
                chanceOfRain={(dayWeather as any).chanceOfRain || 0} // Cast to any if chanceOfRain is not in type yet
                iconCode={dayWeather.icon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Planes Diarios */}
      <div>
        {sortedDailyPlans.map((dayPlan) => (
          <JsonDailyPlanDisplay
            key={dayPlan.dayNumber}
            day={dayPlan}
            destinationName={itinerary.destination?.name || "Destino"}
          />
        ))}
      </div>

      {/* Notas Generales */}
      {itinerary.generalNotes && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-700/50">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center">
            <StickyNote className="h-5 w-5 mr-2" />
            Notas Generales del Viaje
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-wrap">{itinerary.generalNotes}</p>
        </div>
      )}
    </div>
  )
}
