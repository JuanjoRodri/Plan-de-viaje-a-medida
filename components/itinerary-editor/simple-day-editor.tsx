"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import SimpleActivityEditor from "./simple-activity-editor"
import type { ParsedDay, ParsedActivity } from "./simple-parser"

interface SimpleDayEditorProps {
  day: ParsedDay
  onChange: (day: ParsedDay) => void
  onDelete: (id: string) => void
  isFirst?: boolean
  isLast?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
}

export default function SimpleDayEditor({
  day,
  onChange,
  onDelete,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
}: SimpleDayEditorProps) {
  const [collapsed, setCollapsed] = useState(false)

  const handleTitleChange = (title: string) => {
    onChange({
      ...day,
      title,
    })
  }

  const handleActivityChange = (updatedActivity: ParsedActivity) => {
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

  const handleAddActivity = (type: ParsedActivity["type"] = "activity") => {
    // Calcular hora de inicio basada en la última actividad
    let startTime = "09:00"
    let endTime = "10:00"

    if (day.activities.length > 0) {
      const lastActivity = day.activities[day.activities.length - 1]
      startTime = lastActivity.endTime

      // Calcular hora de fin (1 hora después)
      const [hours, minutes] = startTime.split(":").map(Number)
      const endHours = hours + 1
      endTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }

    const newActivity: ParsedActivity = {
      id: `activity-${Date.now()}`,
      title: "Nueva actividad",
      location: "",
      startTime,
      endTime,
      price: "",
      description: "",
      type,
    }

    onChange({
      ...day,
      activities: [...day.activities, newActivity],
    })
  }

  const moveActivity = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === day.activities.length - 1)) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updatedActivities = [...day.activities]
    const activity = updatedActivities[index]
    updatedActivities.splice(index, 1)
    updatedActivities.splice(newIndex, 0, activity)

    onChange({
      ...day,
      activities: updatedActivities,
    })
  }

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">Día {day.dayNumber}:</CardTitle>
              <Input
                value={day.title.replace(`Día ${day.dayNumber}`, "").replace(":", "").trim()}
                onChange={(e) => handleTitleChange(`Día ${day.dayNumber}: ${e.target.value}`)}
                placeholder="Título del día"
                className="border-0 p-0 h-auto text-lg font-semibold focus-visible:ring-0"
              />
            </div>
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
            <Button variant="ghost" size="icon" onClick={() => onDelete(day.id)} className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="p-4 pt-2">
          <div className="space-y-3">
            {day.activities.map((activity, index) => (
              <SimpleActivityEditor
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

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddActivity("activity")}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Actividad
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddActivity("meal")}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Comida
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddActivity("transport")}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Transporte
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddActivity("accommodation")}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Alojamiento
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
