"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
  variant?: "input" | "select"
}

export function TimePicker({ value, onChange, className, variant = "input" }: TimePickerProps) {
  // Validar y formatear el valor de entrada
  const formatTimeValue = (input: string): string => {
    if (!input) return ""

    // Intentar extraer horas y minutos con regex
    const timeRegex = /^(\d{1,2}):?(\d{2})?$/
    const match = input.match(timeRegex)

    if (match) {
      const hour = Number.parseInt(match[1], 10)
      const minute = match[2] ? Number.parseInt(match[2], 10) : 0

      // Validar rango
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      }
    }

    return value
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Permitir entrada parcial mientras escribe
    if (newValue.length <= 5) {
      onChange(newValue)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onChange(formatTimeValue(e.target.value))
  }

  // Generar opciones para el select (cada 15 minutos)
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(timeString)
      }
    }
    return options
  }

  if (variant === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder="HH:MM" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {generateTimeOptions().map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder="HH:MM"
      className={cn("font-mono", className)}
      maxLength={5}
    />
  )
}
