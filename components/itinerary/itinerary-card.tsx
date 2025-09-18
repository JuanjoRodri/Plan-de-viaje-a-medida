"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Clock, Trash2, Edit } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ItineraryCardProps {
  itinerary: {
    id: string
    title: string
    destination: string
    start_date: string
    end_date: string
    travelers: number
    budget: string
    board_type: string
    created_at: string
    content?: string
  }
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
  showActions?: boolean
}

export default function ItineraryCard({ itinerary, onDelete, onEdit, showActions = false }: ItineraryCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es })
    } catch {
      return dateString
    }
  }

  const getBoardTypeLabel = (boardType: string) => {
    const types: Record<string, string> = {
      "sin-pension": "Sin pensión",
      desayuno: "Solo desayuno",
      "media-pension": "Media pensión",
      "pension-completa": "Pensión completa",
      "todo-incluido": "Todo incluido",
    }
    return types[boardType] || boardType
  }

  const getBudgetLabel = (budget: string) => {
    const budgets: Record<string, string> = {
      economico: "Económico",
      medio: "Medio",
      alto: "Alto",
      lujo: "Lujo",
    }
    return budgets[budget] || budget
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{itinerary.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              {itinerary.destination}
            </CardDescription>
          </div>
          {showActions && (
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(itinerary.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(itinerary.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(itinerary.start_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(itinerary.end_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {itinerary.travelers} viajero{itinerary.travelers > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(itinerary.created_at)}</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{getBudgetLabel(itinerary.budget)}</Badge>
          <Badge variant="outline">{getBoardTypeLabel(itinerary.board_type)}</Badge>
        </div>

        {itinerary.content && (
          <div className="text-sm text-muted-foreground line-clamp-3">{itinerary.content.substring(0, 150)}...</div>
        )}
      </CardContent>
    </Card>
  )
}

// Named export para compatibilidad
export { ItineraryCard }
