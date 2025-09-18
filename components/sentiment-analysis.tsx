"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react"
import {
  type SentimentResult,
  getPlaceReviews,
  getPlaceReviewsFromGoogle,
  analyzeSentiment,
} from "@/app/services/sentiment-analysis"

interface SentimentAnalysisProps {
  placeName: string
  location: string
  placeId?: string // NUEVO: place_id opcional para usar reseñas reales
}

export default function SentimentAnalysis({ placeName, location, placeId }: SentimentAnalysisProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SentimentResult | null>(null)
  const [reviews, setReviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showReviews, setShowReviews] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      let placeReviews = null

      // NUEVO: Si tenemos place_id, usar reseñas reales de Google Places
      if (placeId) {
        console.log(`🔍 Usando reseñas reales de Google Places para place_id: ${placeId}`)
        placeReviews = await getPlaceReviewsFromGoogle(placeId)
      }

      // Fallback: usar función original si no hay place_id o falla la nueva función
      if (!placeReviews) {
        console.log(`⚠️ Fallback: usando función original para ${placeName}`)
        placeReviews = await getPlaceReviews(placeName, location)
      }

      setReviews(placeReviews.reviews)

      // Analizar sentimiento
      const sentimentResult = await analyzeSentiment(placeReviews)
      setResult(sentimentResult)
    } catch (err) {
      setError("Error al analizar el sentimiento. Por favor, inténtalo de nuevo.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Función para determinar el color basado en la puntuación
  const getSentimentColor = (score: number) => {
    if (score >= 0.5) return "text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800"
    if (score >= 0 && score < 0.5)
      return "text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    if (score >= -0.5 && score < 0)
      return "text-amber-600 bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
    return "text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800"
  }

  // Función para obtener el icono basado en la puntuación
  const getSentimentIcon = (score: number) => {
    if (score >= 0.2) return <ThumbsUp className="h-5 w-5" />
    if (score <= -0.2) return <ThumbsDown className="h-5 w-5" />
    return <AlertTriangle className="h-5 w-5" />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h3 className="text-lg font-semibold">Análisis de sentimiento</h3>
          <p className="text-sm text-muted-foreground">
            Analiza las opiniones {placeId ? "reales de Google Places" : "recientes"} sobre {placeName}
          </p>
        </div>
        <Button onClick={handleAnalyze} disabled={loading} size="sm" className="self-start">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            "Analizar opiniones"
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <Card className={`p-4 border ${getSentimentColor(result.score)}`}>
          <div className="flex items-start gap-3">
            <div className="mt-1">{getSentimentIcon(result.score)}</div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4 className="font-medium">Sentimiento general:</h4>
                <Badge variant="outline" className={getSentimentColor(result.score)}>
                  {result.score >= 0.7
                    ? "Muy positivo"
                    : result.score >= 0.3
                      ? "Positivo"
                      : result.score >= -0.3
                        ? "Neutral"
                        : result.score >= -0.7
                          ? "Negativo"
                          : "Muy negativo"}
                </Badge>
                {result.recommendation ? (
                  <Badge className="bg-green-600">Recomendado</Badge>
                ) : (
                  <Badge variant="destructive">No recomendado</Badge>
                )}
                {placeId && (
                  <Badge variant="secondary" className="text-xs">
                    Reseñas reales
                  </Badge>
                )}
              </div>

              <p className="text-sm mb-3">{result.summary}</p>

              {result.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {result.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setShowReviews(!showReviews)}>
                {showReviews ? "Ocultar reseñas" : "Ver reseñas analizadas"}
              </Button>

              {showReviews && (
                <div className="mt-3 space-y-2">
                  {reviews.map((review, index) => (
                    <div key={index} className="text-sm p-2 bg-muted/50 rounded-md">
                      "{review}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
