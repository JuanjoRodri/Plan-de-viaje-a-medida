// Parser corregido para extraer actividades del texto plano

export interface ParsedActivity {
  id: string
  title: string
  location: string
  startTime: string
  endTime: string
  price: string
  description: string
  type: "activity" | "meal" | "transport" | "accommodation" | "other"
}

export interface ParsedDay {
  id: string
  dayNumber: number
  title: string
  activities: ParsedActivity[]
}

export function parseItineraryFromHtml(html: string): ParsedDay[] {
  console.log("🔍 === INICIO DEBUG PARSER CORREGIDO ===")

  if (!html || html.trim().length === 0) {
    console.log("❌ HTML vacío o nulo")
    return createDefaultDay()
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  // Obtener todo el texto del documento
  const fullText = doc.body.textContent || ""
  const lines = fullText.split("\n").filter((line) => line.trim().length > 0)

  console.log(`📄 Total de líneas: ${lines.length}`)

  const days: ParsedDay[] = []
  let currentDay: ParsedDay | null = null
  let activityIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detectar encabezados de día
    const dayMatch = line.match(/día\s*(\d+)/i)
    if (dayMatch) {
      // Guardar el día anterior si existe
      if (currentDay) {
        days.push(currentDay)
        console.log(`📅 Día ${currentDay.dayNumber} completado con ${currentDay.activities.length} actividades`)
      }

      const dayNumber = Number.parseInt(dayMatch[1], 10)
      currentDay = {
        id: `day-${dayNumber}`,
        dayNumber,
        title: line,
        activities: [],
      }
      activityIndex = 0

      console.log(`📅 Nuevo día detectado: ${dayNumber} - "${line}"`)
      continue
    }

    // Si no tenemos un día actual, crear uno por defecto
    if (!currentDay) {
      currentDay = {
        id: "day-1",
        dayNumber: 1,
        title: "Día 1",
        activities: [],
      }
    }

    // Intentar extraer actividad de la línea actual
    const activity = parseActivityFromLine(line, activityIndex, currentDay.dayNumber)
    if (activity) {
      currentDay.activities.push(activity)
      activityIndex++
      console.log(`✅ Actividad añadida: "${activity.title}" en "${activity.location}" (${activity.startTime})`)
    }
  }

  // Añadir el último día
  if (currentDay) {
    days.push(currentDay)
    console.log(`📅 Último día completado con ${currentDay.activities.length} actividades`)
  }

  // Si no se encontraron días, crear uno por defecto
  if (days.length === 0) {
    console.log("⚠️ No se encontraron días, creando día por defecto")
    return createDefaultDay()
  }

  console.log(`🎯 Total de días parseados: ${days.length}`)
  days.forEach((day) => {
    console.log(`📅 ${day.title} - ${day.activities.length} actividades`)
  })

  return days
}

function parseActivityFromLine(line: string, index: number, dayNumber: number): ParsedActivity | null {
  console.log(`🔍 Analizando línea: "${line}"`)

  // Filtrar líneas que no son actividades
  if (!isValidActivityLine(line)) {
    console.log(`❌ No es una actividad válida`)
    return null
  }

  const id = `activity-${dayNumber}-${index}`

  // Extraer horario
  const timeMatch = line.match(/(\d{1,2}):(\d{2})/g)
  let startTime = "09:00"
  let endTime = "10:00"

  if (timeMatch && timeMatch.length >= 1) {
    startTime = timeMatch[0]
    if (timeMatch.length >= 2) {
      endTime = timeMatch[1]
    } else {
      // Calcular hora de fin (1-2 horas después dependiendo del tipo)
      const [hours, minutes] = startTime.split(":").map(Number)
      const duration = line.toLowerCase().includes("cena") || line.toLowerCase().includes("comida") ? 2 : 1
      endTime = `${(hours + duration).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }
  } else {
    // Asignar horarios automáticamente
    const baseHour = 9 + index * 2
    startTime = `${Math.min(baseHour, 22).toString().padStart(2, "0")}:00`
    endTime = `${Math.min(baseHour + 1, 23)
      .toString()
      .padStart(2, "0")}:00`
  }

  // Limpiar línea de horarios
  let cleanLine = line
    .replace(/\d{1,2}:\d{2}/g, "")
    .replace(/^\s*-\s*/, "")
    .trim()

  // Extraer precio
  const priceMatch = cleanLine.match(
    /€€€|€€|€|\$\$\$|\$\$|\$|[€$]\s*\d+(?:[.,]\d+)?|\b\d+(?:[.,]\d+)?\s*(?:USD|EUR|euros?|dólares?)\b/i,
  )
  const price = priceMatch ? priceMatch[0].trim() : ""

  if (price) {
    cleanLine = cleanLine.replace(priceMatch![0], "").trim()
  }

  // Extraer título y ubicación
  let title = ""
  let location = ""

  // Casos especiales para líneas divididas
  if (cleanLine.toLowerCase().includes("cena en") && cleanLine.trim().endsWith("en")) {
    // Caso: "19:00 - Cena en" (ubicación en la siguiente línea)
    title = "Cena"
    location = "Restaurante" // Se actualizará si hay más información
  } else if (cleanLine.toLowerCase().includes("restaurante") && !cleanLine.toLowerCase().includes("cena")) {
    // Caso: "Restaurante El Mañico Peñíscola €€"
    title = "Cena"
    location = cleanLine.replace(/€+|\$+/g, "").trim()
  } else {
    // Casos normales
    const result = extractTitleAndLocation(cleanLine)
    title = result.title
    location = result.location
  }

  // Limpiar título final
  title = title.replace(/[€$]+/g, "").replace(/\s+/g, " ").trim()

  if (!title || title.length < 2) {
    title = cleanLine.substring(0, 30).trim() || "Actividad"
  }

  const type = determineActivityType(title + " " + location + " " + line)

  const activity: ParsedActivity = {
    id,
    title,
    location,
    startTime,
    endTime,
    price,
    description: "",
    type,
  }

  console.log(`✅ Actividad creada:`)
  console.log(`   Título: "${title}"`)
  console.log(`   Ubicación: "${location}"`)
  console.log(`   Horario: ${startTime} - ${endTime}`)
  console.log(`   Precio: "${price}"`)
  console.log(`   Tipo: ${type}`)

  return activity
}

function isValidActivityLine(line: string): boolean {
  // Debe tener longitud mínima
  if (line.length < 5 || line.length > 300) return false

  // Filtrar consejos y recomendaciones
  const adviceKeywords = [
    "recuerda",
    "importante",
    "recomendación",
    "consejo",
    "propina",
    "nota:",
    "tip:",
    "aviso",
    "considera",
    "ten en cuenta",
    "no olvides",
    "asegúrate",
    "disfruta de un",
    "ideal para",
    "perfecto para",
  ]

  if (adviceKeywords.some((keyword) => line.toLowerCase().includes(keyword))) {
    return false
  }

  // Buscar indicadores de actividades
  const activityIndicators = [
    /\d{1,2}:\d{2}/, // Horarios
    /check.?in/i,
    /check.?out/i,
    /llegada/i,
    /salida/i,
    /visita/i,
    /exploración/i,
    /paseo/i,
    /recorrido/i,
    /tour/i,
    /desayuno/i,
    /almuerzo/i,
    /comida/i,
    /cena/i,
    /traslado/i,
    /restaurante/i,
    /hotel/i,
    /museo/i,
    /castillo/i,
    /catedral/i,
    /plaza/i,
    /parque/i,
    /playa/i,
  ]

  return activityIndicators.some((indicator) => indicator.test(line))
}

function extractTitleAndLocation(text: string): { title: string; location: string } {
  // Patrones para separar título y ubicación
  const patterns = [
    { regex: /(.+?)\s+en\s+(.+)/i, titleIndex: 1, locationIndex: 2 },
    { regex: /(.+?)\s+del?\s+(.+)/i, titleIndex: 1, locationIndex: 2 },
    { regex: /(.+?)\s+al?\s+(.+)/i, titleIndex: 1, locationIndex: 2 },
    { regex: /(.+?)\s+-\s+(.+)/i, titleIndex: 1, locationIndex: 2 },
    { regex: /(.+?)\s+de\s+(.+)/i, titleIndex: 1, locationIndex: 2 },
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern.regex)
    if (match && match[pattern.titleIndex] && match[pattern.locationIndex]) {
      return {
        title: match[pattern.titleIndex].trim(),
        location: match[pattern.locationIndex].trim(),
      }
    }
  }

  // Si no se encontró patrón, buscar nombres propios
  const words = text.split(" ")
  const properNouns = words.filter(
    (word) =>
      word.length > 3 &&
      word[0] === word[0].toUpperCase() &&
      ![
        "Visita",
        "Exploración",
        "Paseo",
        "Recorrido",
        "Tour",
        "Desayuno",
        "Almuerzo",
        "Comida",
        "Cena",
        "Check",
      ].includes(word),
  )

  if (properNouns.length > 0) {
    const location = properNouns.slice(0, 3).join(" ")
    const title = text.replace(location, "").trim()
    return { title: title || text, location }
  }

  return { title: text, location: "" }
}

function determineActivityType(text: string): ParsedActivity["type"] {
  const lowerText = text.toLowerCase()

  if (
    lowerText.includes("desayuno") ||
    lowerText.includes("almuerzo") ||
    lowerText.includes("comida") ||
    lowerText.includes("cena") ||
    lowerText.includes("restaurante") ||
    lowerText.includes("bar") ||
    lowerText.includes("café")
  ) {
    return "meal"
  }

  if (
    lowerText.includes("check") ||
    lowerText.includes("hotel") ||
    lowerText.includes("alojamiento") ||
    lowerText.includes("llegada") ||
    lowerText.includes("salida")
  ) {
    return "accommodation"
  }

  if (
    lowerText.includes("traslado") ||
    lowerText.includes("transporte") ||
    lowerText.includes("taxi") ||
    lowerText.includes("bus") ||
    lowerText.includes("aeropuerto") ||
    lowerText.includes("tren") ||
    lowerText.includes("metro")
  ) {
    return "transport"
  }

  return "activity"
}

function createDefaultDay(): ParsedDay[] {
  return [
    {
      id: "day-1",
      dayNumber: 1,
      title: "Día 1",
      activities: [],
    },
  ]
}
