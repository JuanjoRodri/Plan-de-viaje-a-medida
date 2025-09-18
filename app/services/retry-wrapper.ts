import { generateItinerary } from "../actions"

export interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
}

export interface GenerationAttempt {
  attempt: number
  success: boolean
  error?: string
  duration: number
  promptType: "full" | "simplified" | "basic"
}

export interface GenerationResult {
  success: boolean
  html: string
  error?: string
  attempts: GenerationAttempt[]
  totalDuration: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 2000, // 2 segundos
  maxDelay: 10000, // 10 segundos máximo
}

/**
 * Genera prompts simplificados para reintentos
 */
function createSimplifiedFormData(originalFormData: FormData, promptType: "simplified" | "basic"): FormData {
  const newFormData = new FormData()

  // Copiar datos básicos
  for (const [key, value] of originalFormData.entries()) {
    newFormData.set(key, value)
  }

  // Simplificar según el tipo
  if (promptType === "simplified") {
    // Reducir preferencias a lo básico
    newFormData.set("preferences", "Lugares principales y restaurantes recomendados")
    newFormData.set("maxDistance", "3") // Reducir distancia
  } else if (promptType === "basic") {
    // Versión muy básica
    newFormData.set("preferences", "Lugares turísticos principales")
    newFormData.set("maxDistance", "2")
    newFormData.delete("customBudget") // Eliminar presupuesto personalizado
  }

  return newFormData
}

/**
 * Calcula el delay para el siguiente intento
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
  return Math.min(delay, options.maxDelay)
}

/**
 * Wrapper que añade reintentos a la generación de itinerarios
 */
export async function generateItineraryWithRetries(
  formData: FormData,
  options: Partial<RetryOptions> = {},
  onProgress?: (attempt: number, promptType: string, error?: string) => void,
): Promise<GenerationResult> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const attempts: GenerationAttempt[] = []
  const startTime = Date.now()

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const attemptStart = Date.now()

    // Determinar tipo de prompt según el intento
    let promptType: "full" | "simplified" | "basic" = "full"
    let currentFormData = formData

    if (attempt === 2) {
      promptType = "simplified"
      currentFormData = createSimplifiedFormData(formData, "simplified")
    } else if (attempt === 3) {
      promptType = "basic"
      currentFormData = createSimplifiedFormData(formData, "basic")
    }

    // Notificar progreso
    onProgress?.(attempt, promptType)

    try {
      // Llamar a la función original sin modificarla
      const result = await generateItinerary(currentFormData)
      const duration = Date.now() - attemptStart

      const attemptResult: GenerationAttempt = {
        attempt,
        success: result.success,
        error: result.error,
        duration,
        promptType,
      }

      attempts.push(attemptResult)

      if (result.success) {
        // Éxito - registrar métricas y devolver resultado
        await logGenerationMetrics(formData, attempts, true)

        return {
          success: true,
          html: result.html,
          attempts,
          totalDuration: Date.now() - startTime,
        }
      }

      // Falló este intento
      console.warn(`Intento ${attempt}/${opts.maxAttempts} falló:`, result.error)
      onProgress?.(attempt, promptType, result.error)

      // Si no es el último intento, esperar antes del siguiente
      if (attempt < opts.maxAttempts) {
        const delay = calculateDelay(attempt, opts)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (error) {
      const duration = Date.now() - attemptStart
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"

      attempts.push({
        attempt,
        success: false,
        error: errorMessage,
        duration,
        promptType,
      })

      console.error(`Intento ${attempt}/${opts.maxAttempts} error:`, error)
      onProgress?.(attempt, promptType, errorMessage)

      // Si no es el último intento, esperar antes del siguiente
      if (attempt < opts.maxAttempts) {
        const delay = calculateDelay(attempt, opts)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // Todos los intentos fallaron
  await logGenerationMetrics(formData, attempts, false)

  const lastError = attempts[attempts.length - 1]?.error || "Error desconocido"

  return {
    success: false,
    html: "",
    error: `Falló después de ${opts.maxAttempts} intentos. Último error: ${lastError}`,
    attempts,
    totalDuration: Date.now() - startTime,
  }
}

/**
 * Registra métricas de generación para análisis
 */
async function logGenerationMetrics(
  formData: FormData,
  attempts: GenerationAttempt[],
  finalSuccess: boolean,
): Promise<void> {
  try {
    const destination = formData.get("destination")?.toString() || "unknown"
    const days = formData.get("days")?.toString() || "0"

    const logData = {
      destination,
      days: Number.parseInt(days),
      total_attempts: attempts.length,
      final_success: finalSuccess,
      total_duration: attempts.reduce((sum, a) => sum + a.duration, 0),
      attempts_detail: attempts,
      timestamp: new Date().toISOString(),
    }

    // Enviar a endpoint de métricas (lo crearemos después)
    await fetch("/api/admin/generation-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    })
  } catch (error) {
    console.error("Error logging generation metrics:", error)
    // No fallar la generación por un error de logging
  }
}
