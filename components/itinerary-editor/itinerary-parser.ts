import { v4 as uuidv4 } from "uuid"
import type { ItineraryDay, Activity as EditorActivity } from "./day-editor" // Asumo que day-editor define estos tipos

// Tipos necesarios para este parser si no vienen de day-editor
interface Activity {
  id: string
  title: string
  startTime: string
  endTime: string
  description: string
  location: string
  price: string
  type: "activity" | "meal" | "accommodation" | "transport" | string // string para flexibilidad
}

export function parseItineraryHtml(html: string): ItineraryDay[] {
  console.log("🔍 Parseando HTML del itinerario...")

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const days: ItineraryDay[] = []

  // Buscar todos los encabezados de día (h2, h3, h4, o cualquier encabezado que contenga "Día")
  const allHeaders = doc.querySelectorAll("h1, h2, h3, h4, h5, h6")
  const dayHeaders: Element[] = []

  allHeaders.forEach((header) => {
    const headerText = header.textContent || ""
    if (headerText.toLowerCase().includes("día")) {
      dayHeaders.push(header)
    }
  })

  console.log(`📅 Encabezados de día encontrados: ${dayHeaders.length}`)

  dayHeaders.forEach((header, index) => {
    const headerText = header.textContent || ""

    // Extraer número de día y título
    let dayMatch = headerText.match(/Día\s*(\d+):?\s*(.*)/i) // Case insensitive match
    if (!dayMatch) {
      // Fallback si el formato no es exacto pero contiene "día"
      const potentialDayNumberMatch = headerText.match(/(\d+)/)
      const dayNumberFromName = potentialDayNumberMatch ? Number.parseInt(potentialDayNumberMatch[1], 10) : index + 1
      dayMatch = [headerText, dayNumberFromName.toString(), headerText.replace(/día\s*\d*:?\s*/i, "").trim()]
    }

    const dayNumber = Number.parseInt(dayMatch[1], 10)
    const title = dayMatch[2] ? dayMatch[2].trim() : `Día ${dayNumber}`

    const activities: EditorActivity[] = [] // Usar EditorActivity si es el tipo esperado por ItineraryDay

    // Buscar contenido después del encabezado hasta el siguiente encabezado de día
    let currentElement = header.nextElementSibling
    let dayContent = ""

    while (currentElement) {
      const nextHeaderText = currentElement.textContent || ""
      if (nextHeaderText.toLowerCase().includes("día") && currentElement.tagName.match(/^H[1-6]$/i)) {
        break
      }
      dayContent += currentElement.outerHTML || currentElement.textContent || ""
      currentElement = currentElement.nextElementSibling
    }

    // Extraer actividades del contenido del día
    extractActivitiesFromDayContent(dayContent, activities)

    days.push({
      id: uuidv4(),
      dayNumber,
      title,
      activities,
    })
  })

  // Si no encontramos días, crear uno por defecto
  if (days.length === 0 && html.trim().length > 0) {
    // Solo si hay contenido HTML
    console.log(
      "📅 No se encontraron encabezados de día, creando un día por defecto con actividades parseadas del contenido total.",
    )
    const activities: EditorActivity[] = []
    extractActivitiesFromDayContent(html, activities) // Intentar parsear todo el HTML como actividades de un solo día
    days.push({
      id: uuidv4(),
      dayNumber: 1,
      title: "Itinerario General",
      activities,
    })
  } else if (days.length === 0) {
    console.log("📅 No se encontraron encabezados de día y el HTML está vacío.")
    days.push({
      // Día por defecto vacío si no hay nada
      id: uuidv4(),
      dayNumber: 1,
      title: "Día 1",
      activities: [],
    })
  }

  return days.sort((a, b) => a.dayNumber - b.dayNumber)
}

function extractActivitiesFromDayContent(content: string, activities: EditorActivity[]) {
  // Crear un div temporal para parsear el contenido del día
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = content

  // Intentar extraer actividades de listas <ul> o <ol>
  const listItems = tempDiv.querySelectorAll("li")
  if (listItems.length > 0) {
    listItems.forEach((li) => {
      const text = li.textContent?.trim() || ""
      if (!text) return

      let startTime = "09:00" // Default start time
      let activityText = text

      const timeMatch = text.match(/^(\d{1,2}:\d{2})\s*[-\u2013\u2014]?\s*(.*)/) // \u2013 y \u2014 son guiones
      if (timeMatch) {
        startTime = timeMatch[1]
        activityText = timeMatch[2].trim()
      }

      const [hours, minutes] = startTime.split(":").map(Number)
      const endHours = (hours + 1) % 24 // Default 1 hour duration
      const endTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      let title = activityText
      let location = ""
      const description = "" // Podríamos intentar buscar más detalles
      const price = "" // Podríamos intentar buscar precios
      let type: EditorActivity["type"] = "activity"

      // Buscar ubicación en el texto (después de "en", "at", "@" o nombres de lugares conocidos)
      const locationKeywords = [" en ", " at ", " @ ", " en el ", " en la "]
      for (const keyword of locationKeywords) {
        const locationMatch = activityText.match(new RegExp(`(.*?)${keyword}(.+?)(?:\\s*[-\\u2013\\u2014]|$)`, "i"))
        if (locationMatch) {
          title = locationMatch[1].trim()
          location = locationMatch[2].trim()
          break
        }
      }

      // Mejorar la detección de tipo de actividad
      const titleLower = title.toLowerCase()
      if (titleLower.includes("desayuno") || titleLower.includes("breakfast")) type = "meal"
      else if (titleLower.includes("almuerzo") || titleLower.includes("comida") || titleLower.includes("lunch"))
        type = "meal"
      else if (titleLower.includes("cena") || titleLower.includes("dinner") || titleLower.includes("restaurante"))
        type = "meal"
      else if (
        titleLower.includes("check-in") ||
        titleLower.includes("check out") ||
        titleLower.includes("hotel") ||
        titleLower.includes("alojamiento")
      )
        type = "accommodation"
      else if (
        titleLower.includes("traslado") ||
        titleLower.includes("transporte") ||
        titleLower.includes("vuelo") ||
        titleLower.includes("tren") ||
        titleLower.includes("bus") ||
        titleLower.includes("taxi")
      )
        type = "transport"
      else if (
        titleLower.includes("visita") ||
        titleLower.includes("tour") ||
        titleLower.includes("museo") ||
        titleLower.includes("monumento")
      )
        type = "activity"

      // Limpiar el título de información extra (símbolos, etc.)
      title = title.replace(/[✓★?!€$]|(\s*$$.*?$$\s*)/g, "").trim() // Elimina también texto entre paréntesis

      if (title) {
        // Solo añadir si hay un título
        activities.push({
          id: uuidv4(),
          title,
          startTime,
          endTime,
          description,
          location,
          price,
          type,
        } as EditorActivity) // Asegurar que cumple con el tipo EditorActivity
      }
    })
  } else {
    // Fallback si no hay listas: buscar patrones de tiempo-actividad en texto plano
    const timeActivityRegex = /(\d{1,2}:\d{2})\s*[-\u2013\u2014]?\s*([^<\n]+)/g
    let match

    const plainTextContent = tempDiv.textContent || ""

    while ((match = timeActivityRegex.exec(plainTextContent)) !== null) {
      const startTime = match[1]
      const activityText = match[2].trim()

      const [hours, minutes] = startTime.split(":").map(Number)
      const endHours = (hours + 1) % 24
      const endTime = `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      let title = activityText
      let location = ""
      const description = ""
      const price = ""
      let type: EditorActivity["type"] = "activity"

      const locationKeywords = [" en ", " at ", " @ ", " en el ", " en la "]
      for (const keyword of locationKeywords) {
        const locationMatch = activityText.match(new RegExp(`(.*?)${keyword}(.+?)(?:\\s*[-\\u2013\\u2014]|$)`, "i"))
        if (locationMatch) {
          title = locationMatch[1].trim()
          location = locationMatch[2].trim()
          break
        }
      }

      const titleLower = title.toLowerCase()
      if (titleLower.includes("desayuno") || titleLower.includes("breakfast")) type = "meal"
      else if (titleLower.includes("almuerzo") || titleLower.includes("comida") || titleLower.includes("lunch"))
        type = "meal"
      else if (titleLower.includes("cena") || titleLower.includes("dinner") || titleLower.includes("restaurante"))
        type = "meal"
      else if (
        titleLower.includes("check-in") ||
        titleLower.includes("check out") ||
        titleLower.includes("hotel") ||
        titleLower.includes("alojamiento")
      )
        type = "accommodation"
      else if (
        titleLower.includes("traslado") ||
        titleLower.includes("transporte") ||
        titleLower.includes("vuelo") ||
        titleLower.includes("tren") ||
        titleLower.includes("bus") ||
        titleLower.includes("taxi")
      )
        type = "transport"
      else if (
        titleLower.includes("visita") ||
        titleLower.includes("tour") ||
        titleLower.includes("museo") ||
        titleLower.includes("monumento")
      )
        type = "activity"

      title = title.replace(/[✓★?!€$]|(\s*$$.*?$$\s*)/g, "").trim()

      if (title) {
        activities.push({
          id: uuidv4(),
          title,
          startTime,
          endTime,
          description,
          location,
          price,
          type,
        } as EditorActivity)
      }
    }
  }

  // Si después de todos los intentos no hay actividades, añadir una por defecto si hay contenido
  if (activities.length === 0 && content.trim().length > 0) {
    console.log(
      "No se pudieron extraer actividades estructuradas, añadiendo una actividad genérica con el contenido del día.",
    )
    activities.push({
      id: uuidv4(),
      title: "Actividades del día",
      startTime: "09:00",
      endTime: "17:00",
      description: tempDiv.textContent?.trim() || "Consultar detalles.",
      location: "",
      price: "",
      type: "activity",
    } as EditorActivity)
  }
}

export interface ItineraryItem {
  day: number
  time: string
  activity: string
}

export interface ItineraryResult {
  title: string
  description: string
  items: ItineraryItem[]
  metadata?: any
}

// Esta función parseItinerary parece ser para un formato Markdown, la mantengo por si se usa en otro lado.
export function parseItinerary(content: string): ItineraryResult {
  const result: ItineraryResult = {
    title: "",
    description: "",
    items: [],
  }

  // Extract title
  const titleMatch = content.match(/^# (.*)$/m)
  if (titleMatch) {
    result.title = titleMatch[1]
  }

  // Extract description
  const descriptionMatch = content.match(/^## Descripción\n\n([\s\S]*?)(?=\n\n##|$)/)
  if (descriptionMatch) {
    result.description = descriptionMatch[1]
  }

  // Extract itinerary items
  const itineraryRegex = /^### Día (\d+), (.*)\n([\s\S]*?)(?=\n\n### Día|\n\n##|$)/gm
  let itineraryMatch

  while ((itineraryMatch = itineraryRegex.exec(content)) !== null) {
    const day = Number.parseInt(itineraryMatch[1])
    // const dayDescription = itineraryMatch[2] // No usado actualmente
    const dayContent = itineraryMatch[3]

    const timeActivityRegex = /^(.*?)\s*-\s*(.*)$/gm
    let timeActivityMatch

    while ((timeActivityMatch = timeActivityRegex.exec(dayContent)) !== null) {
      const time = timeActivityMatch[1]
      const activity = timeActivityMatch[2]

      result.items.push({
        day: day,
        time: time,
        activity: activity,
      })
    }
  }

  return result
}
