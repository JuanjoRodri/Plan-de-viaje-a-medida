import type { JsonSentimentAnalysisResult } from "@/types/enhanced-database"
import { Star, MessageSquare, Tags } from "lucide-react" // CAMBIADO: MessageSquareText a MessageSquare

interface JsonSentimentDisplayProps {
  sentiment: JsonSentimentAnalysisResult
}

export default function JsonSentimentDisplay({ sentiment }: JsonSentimentDisplayProps) {
  if (!sentiment || typeof sentiment.score !== "number") {
    return null
  }

  const getStarColor = (index: number, score: number) => {
    const roundedScore = Math.round(score * 2) / 2 // Redondea a .0 o .5
    if (index < Math.floor(roundedScore)) return "text-yellow-400 dark:text-yellow-500"
    if (index < roundedScore) return "text-yellow-400 dark:text-yellow-500 opacity-60" // Para medias estrellas
    return "text-gray-300 dark:text-gray-500"
  }

  return (
    <div className="mt-2 p-2 bg-sky-50 dark:bg-slate-800 rounded-md border border-sky-200 dark:border-slate-700 text-xs">
      <div className="flex items-center mb-1">
        <div className="flex items-center mr-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${getStarColor(i, sentiment.score)}`} fill="currentColor" />
          ))}
        </div>
        <span className="font-semibold text-sky-700 dark:text-sky-300">{sentiment.score.toFixed(1)}/5</span>
        {sentiment.label && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-sky-200 dark:bg-sky-700 text-sky-800 dark:text-sky-200 rounded-full text-[10px]">
            {sentiment.label}
          </span>
        )}
      </div>
      {sentiment.summary && (
        <p className="text-slate-600 dark:text-slate-300 flex items-start">
          {/* CAMBIADO: MessageSquareText a MessageSquare */}
          <MessageSquare className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
          {sentiment.summary}
        </p>
      )}
      {sentiment.keywords && sentiment.keywords.length > 0 && (
        <div className="mt-1 flex items-start">
          <Tags className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
          <div className="flex flex-wrap gap-1">
            {sentiment.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
      {sentiment.reviewCount && (
        <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">
          Basado en {sentiment.reviewCount} reseñas ({sentiment.source || "IA"})
        </p>
      )}
    </div>
  )
}
