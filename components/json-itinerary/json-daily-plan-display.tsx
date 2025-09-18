import type { JsonDailyPlan } from "@/types/enhanced-database"
import JsonActivityDisplay from "./json-activity-display"
import { CalendarDays, StickyNote } from "lucide-react"

interface JsonDailyPlanDisplayProps {
  day: JsonDailyPlan
  destinationName?: string
}

export default function JsonDailyPlanDisplay({ day, destinationName }: JsonDailyPlanDisplayProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + "T00:00:00") // Asegurar que se interprete como fecha local
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800/30">
      <div className="flex items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        <CalendarDays className="h-6 w-6 mr-3 text-primary" />
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Día {day.dayNumber}: {day.title || "Plan del Día"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(day.date)}</p>
        </div>
      </div>

      {day.summary && <p className="mb-4 text-sm text-slate-600 dark:text-slate-300 italic">{day.summary}</p>}

      {day.activities && day.activities.length > 0 ? (
        <div className="space-y-1">
          {day.activities.map((activity) => (
            <JsonActivityDisplay key={activity.id} activity={activity} destinationName={destinationName} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">No hay actividades planeadas para este día.</p>
      )}

      {day.dailyNotes && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-700/50 text-sm text-blue-700 dark:text-blue-300 flex items-start">
          <StickyNote className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-semibold mb-0.5">Notas del Día:</h5>
            <p>{day.dailyNotes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
