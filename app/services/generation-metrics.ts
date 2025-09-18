import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface GenerationMetrics {
  id: string
  destination: string
  days: number
  total_attempts: number
  final_success: boolean
  total_duration: number
  attempts_detail: any[]
  created_at: string
}

export interface MetricsSummary {
  totalGenerations: number
  successRate: number
  averageAttempts: number
  averageDuration: number
  commonErrors: { error: string; count: number }[]
  successByAttempt: { attempt: number; count: number }[]
}

/**
 * Guarda métricas de generación en la base de datos
 */
export async function saveGenerationMetrics(data: Omit<GenerationMetrics, "id" | "created_at">): Promise<boolean> {
  try {
    const { error } = await supabase.from("generation_logs").insert([data])

    if (error) {
      console.error("Error saving generation metrics:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in saveGenerationMetrics:", error)
    return false
  }
}

/**
 * Obtiene resumen de métricas para el dashboard
 */
export async function getMetricsSummary(days = 7): Promise<MetricsSummary | null> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from("generation_logs")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching metrics:", error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        totalGenerations: 0,
        successRate: 0,
        averageAttempts: 0,
        averageDuration: 0,
        commonErrors: [],
        successByAttempt: [],
      }
    }

    // Calcular métricas
    const totalGenerations = data.length
    const successful = data.filter((d) => d.final_success).length
    const successRate = (successful / totalGenerations) * 100

    const totalAttempts = data.reduce((sum, d) => sum + d.total_attempts, 0)
    const averageAttempts = totalAttempts / totalGenerations

    const totalDuration = data.reduce((sum, d) => sum + d.total_duration, 0)
    const averageDuration = totalDuration / totalGenerations

    // Errores comunes
    const errorCounts: { [key: string]: number } = {}
    data.forEach((d) => {
      if (!d.final_success && d.attempts_detail) {
        d.attempts_detail.forEach((attempt: any) => {
          if (attempt.error) {
            const errorKey = attempt.error.substring(0, 100) // Truncar errores largos
            errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1
          }
        })
      }
    })

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Éxito por intento
    const successByAttemptMap: { [key: number]: number } = {}
    data.forEach((d) => {
      if (d.final_success && d.attempts_detail) {
        const successfulAttempt = d.attempts_detail.find((a: any) => a.success)
        if (successfulAttempt) {
          const attempt = successfulAttempt.attempt
          successByAttemptMap[attempt] = (successByAttemptMap[attempt] || 0) + 1
        }
      }
    })

    const successByAttempt = Object.entries(successByAttemptMap)
      .map(([attempt, count]) => ({ attempt: Number.parseInt(attempt), count }))
      .sort((a, b) => a.attempt - b.attempt)

    return {
      totalGenerations,
      successRate,
      averageAttempts,
      averageDuration,
      commonErrors,
      successByAttempt,
    }
  } catch (error) {
    console.error("Error in getMetricsSummary:", error)
    return null
  }
}
