"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Clock,
  MapPin,
  DollarSign,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Building,
  Utensils,
  Car,
  Info,
  Sparkles,
  Briefcase,
  Edit3,
  Check,
  X,
} from "lucide-react"
import { TimePicker } from "@/components/itinerary-editor/time-picker"
import type { JsonActivity, JsonActivityLocation, JsonPriceEstimate } from "@/types/enhanced-database" // NUEVA IMPORTACIÓN
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Para tipo de actividad

// ANTERIOR: import { type Activity } from "./activity-editor" (ya no se usa este tipo local)

interface ActivityEditorProps {
  activity: JsonActivity // CAMBIADO: de Activity a JsonActivity
  onChange: (activity: JsonActivity) => void
  onDelete: (id: string) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  isFirst?: boolean
  isLast?: boolean
  isDragging?: boolean
}

export default function ActivityEditor({
  activity,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isDragging = false,
}: ActivityEditorProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleChange = (field: keyof JsonActivity, value: any) => {
    onChange({
      ...activity,
      [field]: value,
    })
  }

  const handleLocationChange = (field: keyof JsonActivityLocation, value: string) => {
    onChange({
      ...activity,
      location: {
        ...(activity.location || { name: "", verified: false, verificationSource: "not_verified" }), // Asegurar que location exista
        [field]: value,
      },
    })
  }

  const handlePriceChange = (field: keyof JsonPriceEstimate, value: string | number | boolean) => {
    onChange({
      ...activity,
      priceEstimate: {
        ...(activity.priceEstimate || { amount: 0, currency: "EUR", perPerson: true }), // Asegurar que priceEstimate exista
        [field]:
          field === "amount" ? Number(value) : field === "perPerson" ? value === true || value === "true" : value,
      },
    })
  }

  const getActivityTypeColor = (type: JsonActivity["type"]) => {
    // Mapeo de colores similar al anterior, ajustado a los nuevos tipos si es necesario
    switch (type) {
      case "sightseeing":
        return "border-blue-300 dark:border-blue-700"
      case "meal":
        return "border-green-300 dark:border-green-700"
      case "transport":
        return "border-amber-300 dark:border-amber-700"
      case "accommodation":
        return "border-purple-300 dark:border-purple-700"
      case "event":
        return "border-red-300 dark:border-red-700"
      case "free_time":
        return "border-teal-300 dark:border-teal-700"
      case "custom":
      default:
        return "border-gray-300 dark:border-gray-700"
    }
  }

  const getActivityTypeIcon = (type: JsonActivity["type"]) => {
    // Mapeo de iconos similar al anterior
    switch (type) {
      case "sightseeing":
        return (
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
        )
      case "meal":
        return (
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
            <Utensils className="h-5 w-5" />
          </div>
        )
      case "transport":
        return (
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full text-amber-600 dark:text-amber-400">
            <Car className="h-5 w-5" />
          </div>
        )
      case "accommodation":
        return (
          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600 dark:text-purple-400">
            <Building className="h-5 w-5" />
          </div>
        )
      case "event":
        return (
          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600 dark:text-red-400">
            <Briefcase className="h-5 w-5" /> {/* O un icono de ticket/evento */}
          </div>
        )
      case "free_time":
        return (
          <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full text-teal-600 dark:text-teal-400">
            <Info className="h-5 w-5" /> {/* O un icono de café/relax */}
          </div>
        )
      case "custom":
      default:
        return (
          <div className="bg-gray-100 dark:bg-gray-900/30 p-2 rounded-full text-gray-600 dark:text-gray-400">
            <Info className="h-5 w-5" />
          </div>
        )
    }
  }

  const activityTypes: JsonActivity["type"][] = [
    "sightseeing",
    "meal",
    "transport",
    "accommodation",
    "event",
    "free_time",
    "custom",
  ]

  return (
    <Card className={`border-l-4 ${getActivityTypeColor(activity.type)} ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start gap-2">
          <div className="cursor-grab mt-1 pt-0.5">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {getActivityTypeIcon(activity.type)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1 mr-2">
                    <Input
                      value={activity.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="font-medium border-0 p-0 h-auto text-base focus-visible:ring-0 w-full hover:bg-muted/30 focus:bg-muted/50 transition-colors"
                      placeholder="Título de la actividad"
                    />
                    <Edit3 className="h-3 w-3 text-muted-foreground/50" />
                  </div>
                ) : (
                  <h3 className="font-medium text-base">{activity.title || "Sin título"}</h3>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-7 w-7 text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="sr-only">Editar actividad</span>
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(false)}
                      className="h-7 w-7 text-green-600 hover:text-green-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span className="sr-only">Guardar cambios</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(false)}
                      className="h-7 w-7 text-gray-600 hover:text-gray-700"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span className="sr-only">Cancelar edición</span>
                    </Button>
                  </>
                )}
                {onMoveUp && !isFirst && (
                  <Button variant="ghost" size="icon" onClick={onMoveUp} className="h-7 w-7">
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span className="sr-only">Mover arriba</span>
                  </Button>
                )}
                {onMoveDown && !isLast && (
                  <Button variant="ghost" size="icon" onClick={onMoveDown} className="h-7 w-7">
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span className="sr-only">Mover abajo</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(activity.id)}
                  className="h-7 w-7 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {isEditing ? (
                  <>
                    <TimePicker
                      value={activity.startTime}
                      onChange={(value) => handleChange("startTime", value)}
                      className="w-16 h-6 px-1 py-0 text-xs"
                    />
                    {activity.endTime && (
                      <>
                        <span>-</span>
                        <TimePicker
                          value={activity.endTime}
                          onChange={(value) => handleChange("endTime", value)}
                          className="w-16 h-6 px-1 py-0 text-xs"
                        />
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-xs">
                    {activity.startTime}
                    {activity.endTime && ` - ${activity.endTime}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={activity.location?.name || ""}
                      onChange={(e) => handleLocationChange("name", e.target.value)}
                      className="w-32 h-6 px-1 py-0 text-xs hover:bg-muted/30 focus:bg-muted/50 transition-colors border-dashed border-muted-foreground/20"
                      placeholder="Ubicación"
                    />
                    <Edit3 className="h-2.5 w-2.5 text-muted-foreground/40" />
                  </div>
                ) : (
                  <span className="text-xs">{activity.location?.name || "Sin ubicación"}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={activity.priceEstimate?.amount || ""}
                      onChange={(e) => handlePriceChange("amount", e.target.value)}
                      className="w-16 h-6 px-1 py-0 text-xs hover:bg-muted/30 focus:bg-muted/50 transition-colors border-dashed border-muted-foreground/20"
                      placeholder="Precio"
                    />
                    <Select
                      value={activity.priceEstimate?.currency || "EUR"}
                      onValueChange={(value) => handlePriceChange("currency", value)}
                    >
                      <SelectTrigger className="w-16 h-6 px-1 py-0 text-xs hover:bg-muted/30">
                        <SelectValue placeholder="Moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Edit3 className="h-2.5 w-2.5 text-muted-foreground/40" />
                  </div>
                ) : (
                  <span className="text-xs">
                    {activity.priceEstimate?.amount
                      ? `${activity.priceEstimate.amount} ${activity.priceEstimate.currency || "EUR"}`
                      : "Sin precio"}
                  </span>
                )}
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-6 px-1 py-0 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                <Info className="h-3 w-3" />
                {expanded ? "Menos detalles" : "Ver detalles"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="p-3 pt-2">
          <div className="space-y-2.5">
            <div>
              <Label htmlFor={`activity-type-${activity.id}`} className="text-xs font-medium">
                Tipo de actividad
              </Label>
              {isEditing ? (
                <Select
                  value={activity.type}
                  onValueChange={(value: JsonActivity["type"]) => handleChange("type", value)}
                >
                  <SelectTrigger id={`activity-type-${activity.id}`} className="mt-1 h-8 text-sm">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-sm">
                        {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1).replace("_", " ")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`description-${activity.id}`} className="text-xs font-medium">
                Descripción
              </Label>
              {isEditing ? (
                <Textarea
                  id={`description-${activity.id}`}
                  value={activity.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descripción de la actividad"
                  className="mt-1 text-sm"
                  rows={2}
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{activity.description || "Sin descripción"}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`location-address-${activity.id}`} className="text-xs font-medium">
                Dirección
              </Label>
              {isEditing ? (
                <Input
                  id={`location-address-${activity.id}`}
                  value={activity.location?.address || ""}
                  onChange={(e) => handleLocationChange("address", e.target.value)}
                  placeholder="Dirección completa"
                  className="mt-1 text-sm h-8"
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{activity.location?.address || "Sin dirección"}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`notes-${activity.id}`} className="text-xs font-medium">
                Notas adicionales
              </Label>
              {isEditing ? (
                <Textarea
                  id={`notes-${activity.id}`}
                  value={activity.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Notas, confirmaciones, recomendaciones, etc."
                  className="mt-1 text-sm"
                  rows={2}
                />
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">{activity.notes || "Sin notas"}</p>
              )}
            </div>
            {activity.location?.verified && activity.location.mapsUrl && (
              <div className="text-xs">
                <span className="font-medium">Lugar verificado:</span>{" "}
                <a
                  href={activity.location.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver en Google Maps
                </a>
                {activity.location.userRating && ` (Rating: ${activity.location.userRating})`}
              </div>
            )}
            {activity.sentiment?.summary && (
              <div className="text-xs">
                <span className="font-medium">Sentimiento:</span> {activity.sentiment.summary} (Score:{" "}
                {activity.sentiment.score.toFixed(1)})
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
