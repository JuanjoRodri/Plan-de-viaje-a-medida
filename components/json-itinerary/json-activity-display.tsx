import type { JsonActivity } from "@/types/enhanced-database"
import JsonLocationDisplay from "./json-location-display"
import JsonPriceDisplay from "./json-price-display"
import JsonSentimentDisplay from "./json-sentiment-display"
import { Utensils, BedDouble, Bus, Palette, PlaneTakeoff, Info, StickyNote, Clock3 } from "lucide-react"
import { formatActivityTimeRange } from "@/lib/time-utils"

interface JsonActivityDisplayProps {
  activity: JsonActivity
  destinationName?: string
}

export default function JsonActivityDisplay({ activity, destinationName }: JsonActivityDisplayProps) {
  const getActivityIcon = () => {
    switch (activity.type) {
      case "meal":
        return <Utensils className="h-5 w-5 text-orange-500" />
      case "accommodation":
        return <BedDouble className="h-5 w-5 text-purple-500" />
      case "transport":
        return <Bus className="h-5 w-5 text-blue-500" />
      case "sightseeing":
        return <Palette className="h-5 w-5 text-teal-500" />
      case "event":
        return <PlaneTakeoff className="h-5 w-5 text-red-500" />
      case "free_time":
        return <Clock3 className="h-5 w-5 text-gray-500" />
      case "custom":
      default:
        return <Info className="h-5 w-5 text-indigo-500" />
    }
  }

  const formattedTimeRange = formatActivityTimeRange(activity.startTime, activity.endTime, activity.durationMinutes)

  return (
    <div className="py-4 px-1 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{getActivityIcon()}</div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              <span className="text-primary font-mono">{formattedTimeRange}</span>: {activity.title}
            </h4>
          </div>

          {activity.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activity.description}</p>
          )}

          {activity.location && <JsonLocationDisplay location={activity.location} destinationName={destinationName} />}
          {activity.priceEstimate && <JsonPriceDisplay priceEstimate={activity.priceEstimate} />}
          {activity.sentiment && <JsonSentimentDisplay sentiment={activity.sentiment} />}

          {activity.notes && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-md border border-yellow-200 dark:border-yellow-700/50 text-xs text-yellow-700 dark:text-yellow-300 flex items-start">
              <StickyNote className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
              <span>{activity.notes}</span>
            </div>
          )}
          {activity.isOptional && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">(Actividad opcional)</p>
          )}
        </div>
      </div>
    </div>
  )
}
