"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import ActivityEditor from "./activity-editor" // No cambia la importación
import AddActivityModal from "./add-activity-modal" // NUEVA IMPORTACIÓN
import type { JsonDailyPlan, JsonActivity } from "@/types/enhanced-database" // NUEVA IMPORTACIÓN

interface DayEditorProps {
  day: JsonDailyPlan // CAMBIADO: de ItineraryDay a JsonDailyPlan
  onChange: (day: JsonDailyPlan) => void
  onDelete: (dayNumber: number) => void // CAMBIADO: de id string a dayNumber y agregado =>
  isFirst?: boolean
  isLast?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  destinationName?: string // Para títulos de actividad por defecto
}

export default function DayEditor({
  day,
  onChange,
  onDelete,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  destinationName = "destino",
}: DayEditorProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false) // NUEVO ESTADO

  const handleTitleChange = (newTitle: string) => {
    onChange({
      ...day,
      title: newTitle,
    })
  }

  const handleDateChange = (newDate: string) => {
    onChange({
      ...day,
      date: newDate,
    })
  }

  const handleActivityChange = (updatedActivity: JsonActivity) => {
    const updatedActivities = day.activities.map((activity) =>
      activity.id === updatedActivity.id ? updatedActivity : activity,
    )
    onChange({
      ...day,
      activities: updatedActivities,
    })
  }

  const handleActivityDelete = (activityId: string) => {
    const updatedActivities = day.activities.filter((activity) => activity.id !== activityId)
    onChange({
      ...day,
      activities: updatedActivities,
    })
  }

  // NUEVA FUNCIÓN para manejar la adición de actividades desde el modal
  const handleAddActivity = (newActivity: JsonActivity) => {
    onChange({
      ...day,
      activities: [...day.activities, newActivity],
    })
  }

  // FUNCIÓN ACTUALIZADA para calcular la hora de inicio por defecto
  const getDefaultStartTime = (): string => {
    if (day.activities.length === 0) {
      return "09:00"
    }

    const lastActivity = day.activities[day.activities.length - 1]
    if (lastActivity.endTime) {
      return lastActivity.endTime
    } else {
      // Si la última actividad no tiene hora de fin, usar la hora de inicio + 1h
      const [hours, minutes] = lastActivity.startTime.split(":").map(Number)
      const nextHour = (hours + 1) % 24
      return `${nextHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }
  }

  const moveActivity = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === day.activities.length - 1)) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updatedActivities = [...day.activities]
    const activityToMove = updatedActivities[index]
    updatedActivities.splice(index, 1)
    updatedActivities.splice(newIndex, 0, activityToMove)

    onChange({
      ...day,
      activities: updatedActivities,
    })
  }

  return (
    <>
      <Card className="mb-4 shadow-sm">
        <CardHeader className="p-3 pb-2 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="h-7 w-7 text-muted-foreground"
              >
                {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="sr-only">{collapsed ? "Expandir" : "Colapsar"}</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-full">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Día {day.dayNumber}:</span>
                  <Input
                    value={day.title || `Día ${day.dayNumber} en ${destinationName}`}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="border-0 p-0 h-auto text-base focus-visible:ring-0 w-auto font-medium"
                    placeholder={`Título del día (ej: Explorando ${destinationName})`}
                  />
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {onMoveUp && !isFirst && (
                <Button variant="ghost" size="icon" onClick={onMoveUp} className="h-7 w-7">
                  <ChevronUp className="h-4 w-4" />
                  <span className="sr-only">Mover día arriba</span>
                </Button>
              )}
              {onMoveDown && !isLast && (
                <Button variant="ghost" size="icon" onClick={onMoveDown} className="h-7 w-7">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Mover día abajo</span>
                </Button>
              )}
              <Input
                type="date"
                value={day.date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-7 text-xs w-32 px-2 py-1 mr-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(day.dayNumber)} // CAMBIADO: pasar dayNumber
                className="h-7 w-7 text-destructive"
                disabled={isFirst && isLast}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Eliminar día</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        {!collapsed && (
          <CardContent className="p-3 pt-2">
            <div className="space-y-2.5">
              {day.activities.map((activity, index) => (
                <ActivityEditor
                  key={activity.id}
                  activity={activity}
                  onChange={handleActivityChange}
                  onDelete={handleActivityDelete}
                  onMoveUp={() => moveActivity(index, "up")}
                  onMoveDown={() => moveActivity(index, "down")}
                  isFirst={index === 0}
                  isLast={index === day.activities.length - 1}
                />
              ))}
              <div className="flex flex-wrap gap-2 mt-3">
                {/* BOTÓN ACTUALIZADO para abrir el modal */}
                <Button onClick={() => setShowAddModal(true)} className="h-8 text-xs px-3" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Añadir Actividad
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* NUEVO MODAL */}
      <AddActivityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddActivity}
        destinationName={destinationName}
        defaultStartTime={getDefaultStartTime()}
      />
    </>
  )
}
