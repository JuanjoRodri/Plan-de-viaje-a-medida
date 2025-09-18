// Utilidades para formatear horarios en español

const DAYS_TRANSLATION: Record<string, string> = {
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
}

const DAYS_SHORT_TRANSLATION: Record<string, string> = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mié",
  Thu: "Jue",
  Fri: "Vie",
  Sat: "Sáb",
  Sun: "Dom",
}

/**
 * Convierte hora de 12h (AM/PM) a 24h
 */
function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(" ")
  let [hours, minutes] = time.split(":")

  if (hours === "12") {
    hours = "00"
  }

  if (modifier === "PM") {
    hours = (Number.parseInt(hours, 10) + 12).toString()
  }

  return `${hours}:${minutes}`
}

/**
 * Formatea una hora individual (ej: "9:00 AM" -> "9:00")
 */
function formatSingleTime(time: string): string {
  if (!time) return time

  // Si ya está en formato 24h (HH:MM), devolverlo tal como está
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    return time
  }

  // Si tiene AM/PM, convertir a 24h
  if (time.includes("AM") || time.includes("PM")) {
    return convertTo24Hour(time)
  }

  return time
}

/**
 * Formatea horarios de apertura de Google Places al español
 */
export function formatOpeningHours(openingHours: string): string {
  if (!openingHours) return ""

  // Casos comunes de Google Places:
  // "Monday: 9:00 AM – 10:00 PM"
  // "Monday: Closed"
  // "Open 24 hours"
  // "Temporarily closed"

  // Caso: Abierto 24 horas
  if (openingHours.toLowerCase().includes("open 24 hours") || openingHours.toLowerCase().includes("24 hours")) {
    return "Abierto 24 horas"
  }

  // Caso: Temporalmente cerrado (solo si es el mensaje completo)
  if (openingHours.toLowerCase().includes("temporarily closed") || openingHours.toLowerCase().trim() === "closed") {
    return "Temporalmente cerrado"
  }

  let formatted = openingHours

  // Traducir días de la semana (formato completo)
  Object.entries(DAYS_TRANSLATION).forEach(([english, spanish]) => {
    formatted = formatted.replace(new RegExp(english, "gi"), spanish)
  })

  // Traducir días de la semana (formato corto)
  Object.entries(DAYS_SHORT_TRANSLATION).forEach(([english, spanish]) => {
    formatted = formatted.replace(new RegExp(`\\b${english}\\b`, "gi"), spanish)
  })

  // Convertir horarios de AM/PM a 24h
  // Buscar patrones como "9:00 AM – 10:00 PM"
  formatted = formatted.replace(
    /(\d{1,2}:\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}:\d{2})\s*(AM|PM)/gi,
    (match, startTime, startModifier, endTime, endModifier) => {
      const start24 = convertTo24Hour(`${startTime} ${startModifier}`)
      const end24 = convertTo24Hour(`${endTime} ${endModifier}`)
      return `${start24} - ${end24}`
    },
  )

  // Convertir horarios individuales con AM/PM
  formatted = formatted.replace(/(\d{1,2}:\d{2})\s*(AM|PM)/gi, (match, time, modifier) => {
    return convertTo24Hour(`${time} ${modifier}`)
  })

  // Reemplazar guiones largos con guiones normales
  formatted = formatted.replace(/[–—]/g, "-")

  return formatted
}

/**
 * Formatea horarios de actividades (startTime, endTime)
 */
export function formatActivityTime(time: string): string {
  if (!time) return time

  // Si ya está en formato HH:MM, formatear para que se vea mejor
  const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/)
  if (timeMatch) {
    const hour = Number.parseInt(timeMatch[1])
    const minute = timeMatch[2]

    // Formatear sin ceros innecesarios
    if (minute === "00") {
      return `${hour}:00`
    }
    return `${hour}:${minute}`
  }

  return time
}

/**
 * Formatea un rango de tiempo de actividad
 */
export function formatActivityTimeRange(startTime: string, endTime?: string, durationMinutes?: number): string {
  const formattedStart = formatActivityTime(startTime)

  if (endTime) {
    const formattedEnd = formatActivityTime(endTime)
    return `${formattedStart} - ${formattedEnd}`
  }

  if (durationMinutes) {
    return `${formattedStart} (${durationMinutes} min)`
  }

  return formattedStart
}
