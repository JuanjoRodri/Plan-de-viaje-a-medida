"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MapPin, DollarSign, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { TimePicker } from "./time-picker"
import type { ParsedActivity } from "./simple-parser"

interface SimpleActivityEditorProps {
  activity: ParsedActivity
  onChange: (activity: ParsedActivity) => void
  onDelete: (id: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
}

const activityTypeColors = {
  activity: "border-l-blue-500 bg-blue-50",
  meal: "border-l-green-500 bg-green-50",
  transport: "border-l-yellow-500 bg-yellow-50",
  accommodation: "border-l-purple-500 bg-purple-50",
  other: "border-l-gray-500 bg-gray-50",
}

const activityTypeLabels = {
  activity: "Actividad",
  meal: "Comida",
  transport: "Transporte",
  accommodation: "Alojamiento",
  other: "Otro",
}

export default function SimpleActivityEditor({
  activity,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}: SimpleActivityEditorProps) {
  const [expanded, setExpanded] = useState(false)

  const handleChange = (field: keyof ParsedActivity, value: string) => {
    onChange({
      ...activity,
      [field]: value,
    })
  }

  return (
    <Card className={`border-l-4 ${activityTypeColors[activity.type]}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Fila principal */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                value={activity.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Título de la actividad"
                className="font-medium"
              />
            </div>
            <div className="flex items-center gap-1">
              {onMoveUp && !isFirst && (
                <Button variant="ghost" size="icon" onClick={onMoveUp} className="h-8 w-8">
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
              {onMoveDown && !isLast && (
                <Button variant="ghost" size="icon" onClick={onMoveDown} className="h-8 w-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(activity.id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fila de detalles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <TimePicker
                value={activity.startTime}
                onChange={(value) => handleChange("startTime", value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">-</span>
              <TimePicker
                value={activity.endTime}
                onChange={(value) => handleChange("endTime", value)}
                className="w-20"
              />
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input
                value={activity.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Ubicación"
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Input
                value={activity.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="Precio"
                className="text-sm"
              />
            </div>

            <Select
              value={activity.type}
              onValueChange={(value: ParsedActivity["type"]) => handleChange("type", value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón para expandir */}
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
              {expanded ? "Menos detalles" : "Más detalles"}
            </Button>
          </div>

          {/* Sección expandida */}
          {expanded && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label htmlFor={`description-${activity.id}`} className="text-sm">
                  Descripción
                </Label>
                <Textarea
                  id={`description-${activity.id}`}
                  value={activity.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descripción detallada de la actividad"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
