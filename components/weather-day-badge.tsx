import { ThermometerSun, Cloud, Sun, Umbrella, CloudFog, CloudLightning, Snowflake } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeatherDayBadgeProps {
  date: string
  minTemp: number
  maxTemp: number
  condition: string
  chanceOfRain: number
  className?: string
  compact?: boolean
}

export default function WeatherDayBadge({
  date,
  minTemp,
  maxTemp,
  condition,
  chanceOfRain,
  className,
  compact = false,
}: WeatherDayBadgeProps) {
  // Función para obtener el icono según la condición climática
  const getWeatherIcon = () => {
    const lowerCondition = condition.toLowerCase()
    if (
      lowerCondition.includes("rain") ||
      lowerCondition.includes("drizzle") ||
      lowerCondition.includes("shower") ||
      lowerCondition.includes("lluvia")
    ) {
      return <Umbrella className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    } else if (
      lowerCondition.includes("snow") ||
      lowerCondition.includes("sleet") ||
      lowerCondition.includes("nieve")
    ) {
      return <Snowflake className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    } else if (
      lowerCondition.includes("sun") ||
      lowerCondition.includes("clear") ||
      lowerCondition.includes("despejado") ||
      lowerCondition.includes("soleado")
    ) {
      return <Sun className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    } else if (
      lowerCondition.includes("cloud") ||
      lowerCondition.includes("overcast") ||
      lowerCondition.includes("nublado") ||
      lowerCondition.includes("parcialmente")
    ) {
      return <Cloud className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    } else if (
      lowerCondition.includes("fog") ||
      lowerCondition.includes("mist") ||
      lowerCondition.includes("haze") ||
      lowerCondition.includes("niebla")
    ) {
      return <CloudFog className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    } else if (
      lowerCondition.includes("thunder") ||
      lowerCondition.includes("storm") ||
      lowerCondition.includes("tormenta")
    ) {
      return <CloudLightning className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    } else {
      return <ThermometerSun className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    }
  }

  // Función para obtener el color de fondo según la condición y temperatura
  const getWeatherColor = () => {
    const lowerCondition = condition.toLowerCase()
    const avgTemp = (minTemp + maxTemp) / 2

    if (
      lowerCondition.includes("rain") ||
      lowerCondition.includes("drizzle") ||
      lowerCondition.includes("shower") ||
      lowerCondition.includes("lluvia")
    ) {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
    } else if (
      lowerCondition.includes("snow") ||
      lowerCondition.includes("sleet") ||
      lowerCondition.includes("nieve")
    ) {
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800"
    } else if (
      (lowerCondition.includes("sun") ||
        lowerCondition.includes("clear") ||
        lowerCondition.includes("despejado") ||
        lowerCondition.includes("soleado")) &&
      avgTemp > 25
    ) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
    } else if (
      lowerCondition.includes("sun") ||
      lowerCondition.includes("clear") ||
      lowerCondition.includes("despejado") ||
      lowerCondition.includes("soleado")
    ) {
      return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
    } else if (
      lowerCondition.includes("cloud") ||
      lowerCondition.includes("overcast") ||
      lowerCondition.includes("nublado")
    ) {
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700"
    } else if (
      lowerCondition.includes("fog") ||
      lowerCondition.includes("mist") ||
      lowerCondition.includes("haze") ||
      lowerCondition.includes("niebla")
    ) {
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700"
    } else if (
      lowerCondition.includes("thunder") ||
      lowerCondition.includes("storm") ||
      lowerCondition.includes("tormenta")
    ) {
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
    } else {
      // Default
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800"
    }
  }

  // Formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
    })
  }

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5",
          getWeatherColor(),
          className,
        )}
      >
        {getWeatherIcon()}
        <span>
          {minTemp}°-{maxTemp}°
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col border rounded-md p-3", getWeatherColor(), className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{formatDate(date)}</span>
        {getWeatherIcon()}
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold">
          {minTemp}° - {maxTemp}°C
        </span>
        <span className="text-sm mt-1">{condition}</span>
        {chanceOfRain > 20 && (
          <span className="flex items-center gap-1 mt-1 text-sm">
            <Umbrella className="h-4 w-4" />
            {chanceOfRain}% prob. de lluvia
          </span>
        )}
      </div>
    </div>
  )
}
