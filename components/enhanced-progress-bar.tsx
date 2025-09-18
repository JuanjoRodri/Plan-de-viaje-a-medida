"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react"

export interface ProgressStep {
  id: string
  label: string
  status: "pending" | "running" | "completed" | "error" | "warning"
  progress: number
  message?: string
  duration?: number
}

interface EnhancedProgressBarProps {
  steps: ProgressStep[]
  currentStep: string
  overallProgress: number
  isGenerating: boolean
  attempt?: number
  maxAttempts?: number
  warnings?: string[]
  onCancel?: () => void
  // Añadir nueva prop para duración total
  totalDuration?: number
}

export default function EnhancedProgressBar({
  steps,
  currentStep,
  overallProgress,
  isGenerating,
  attempt = 1,
  maxAttempts = 3,
  warnings = [],
  onCancel,
  // Valor por defecto de 120 segundos
  totalDuration = 120,
}: EnhancedProgressBarProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isGenerating) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => {
        // Detener el contador cuando llegue al tiempo total
        if (prev >= totalDuration) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isGenerating, totalDuration])

  // Calcular el progreso basado en el tiempo transcurrido y la duración total
  const timeBasedProgress = Math.min(Math.floor((elapsedTime / totalDuration) * 100), 100)

  // Usar el progreso basado en tiempo si el progreso real es menor
  const displayProgress = overallProgress > timeBasedProgress ? overallProgress : timeBasedProgress

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getProgressColor = () => {
    if (attempt > 1) return "bg-yellow-500"
    return "bg-blue-500"
  }

  // Calcular tiempo restante estimado
  const remainingTime = Math.max(0, totalDuration - elapsedTime)
  const remainingTimeText = formatTime(remainingTime)

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      {/* Barra de progreso principal */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Generando itinerario...</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {attempt > 1 && (
              <span className="text-yellow-600 font-medium">
                Intento {attempt}/{maxAttempts}
              </span>
            )}
            <span>{formatTime(elapsedTime)}</span>
            {remainingTime > 0 && isGenerating && (
              <span className="text-gray-500">(Restante: {remainingTimeText})</span>
            )}
          </div>
        </div>

        <Progress value={displayProgress} className="h-2" />

        <div className="text-xs text-gray-500 text-right">{displayProgress.toFixed(0)}%</div>
      </div>

      {/* Pasos detallados */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-2 rounded transition-colors ${
              step.id === currentStep ? "bg-blue-50 border border-blue-200" : ""
            }`}
          >
            {getStepIcon(step)}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    step.status === "completed"
                      ? "text-green-700"
                      : step.status === "error"
                        ? "text-red-700"
                        : step.status === "running"
                          ? "text-blue-700"
                          : "text-gray-600"
                  }`}
                >
                  {step.label}
                </span>

                {step.duration && <span className="text-xs text-gray-500">{(step.duration / 1000).toFixed(1)}s</span>}
              </div>

              {step.message && <div className="text-xs text-gray-500 mt-1">{step.message}</div>}

              {step.status === "running" && <Progress value={step.progress} className="h-1 mt-1" />}
            </div>
          </div>
        ))}
      </div>

      {/* Advertencias */}
      {warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div key={index} className="text-sm">
                  • {warning}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Información de reintentos */}
      {attempt > 1 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="text-sm">
              {attempt === 2 && "Reintentando con parámetros simplificados..."}
              {attempt === 3 && "Último intento con configuración básica..."}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Botón de cancelar (opcional) */}
      {onCancel && isGenerating && (
        <div className="flex justify-center">
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Cancelar generación
          </button>
        </div>
      )}
    </div>
  )
}
