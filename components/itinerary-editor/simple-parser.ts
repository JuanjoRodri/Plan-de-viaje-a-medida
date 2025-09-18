// Parser mejorado para extraer datos del HTML del itinerario

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
  console.log("🔍 Iniciando parsing mejorado del itinerario...")
  console.log("📄 HTML recibido:", html.substring(0, 500) + "...")

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")

  const days: ParsedDay[] = []

  // Buscar encabezados de día (h2 que contengan "Día")
  const dayHeaders = doc.querySelectorAll("h2")
  console.log(`📅 Encabezados H2 encontrados: ${dayHeaders.length}`)

  dayHeaders.forEach((header, index) => {
    const headerText = header.textContent || ""
    console.log(`🔍 Procesando encabezado: "${headerText}"`)

    const dayMatch = headerText.match(/día\s*(\d+)/i)
    if (!dayMatch) {
      console.log(`❌ No es un encabezado de día: "${headerText}"`)
      return
    }

    const dayNumber = Number.parseInt(dayMatch[1], 10)
    console.log(`✅ Día ${dayNumber} detectado`)

    const day: ParsedDay = {
      id: `day-${dayNumber}`,
      dayNumber,
      title: headerText,
      activities: [],
    }

    // Buscar la lista (ul) que sigue a este encabezado
    let nextElement = header.nextElementSibling
    while (nextElement && nextElement.tagName !== "UL" && nextElement.tagName !== "H2") {
      nextElement = nextElement.nextElementSibling
    }

    if (nextElement && nextElement.tagName === "UL") {
      const listItems = nextElement.querySelectorAll("li")
      console.log(`📝 Elementos de lista encontrados para día ${dayNumber}: ${listItems.length}`)

      listItems.forEach((li, liIndex) => {
        const activity = parseActivityFromListItem(li, liIndex, dayNumber)
        if (activity) {
          day.activities.push(activity)
          console.log(`✅ Actividad añadida: "${activity.title}" en "${activity.location}"`)
        }
      })
    }

    if (day.activities.length > 0) {
      days.push(day)
      console.log(`📅 Día ${dayNumber} añadido con ${day.activities.length} actividades`)
    }
  })

  // Si no se encontraron días, crear uno por defecto
  if (days.length === 0) {
    console.log("⚠️ No se encontraron días, creando día por defecto")
    days.push({
      id: "day-1",
      dayNumber: 1,
      title: "Día 1",
      activities: [],
    })
  }

  console.log(`🎯 Total de días parseados: ${days.length}`)
  return days
}

function parseActivityFromListItem(li: Element, index: number, dayNumber: number): ParsedActivity | null {
  const text = li.textContent || ""
  const innerHTML = li.innerHTML || ""

  console.log(`🔍 Procesando actividad ${index + 1}: "${text}"`)

  // Filtrar elementos que no son actividades reales
  if (text.length < 5 || text.length > 300) {
    console.log(`❌ Texto demasiado corto o largo: ${text.length} caracteres`)
    return null
  }

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
  ]

  if (adviceKeywords.some((keyword) => text.toLowerCase().includes(keyword))) {
    console.log(`❌ Filtrado como consejo: "${text.substring(0, 50)}..."`)
    return null
  }

  const id = `activity-${dayNumber}-${index}`

  // Extraer horario del texto
  const timeMatches = text.match(/(\d{1,2}):(\d{2})/g)
  let startTime = "09:00"
  let endTime = "10:00"

  if (timeMatches && timeMatches.length >= 1) {
    startTime = timeMatches[0]
    if (timeMatches.length >= 2) {
      endTime = timeMatches[1]
    } else {
      // Calcular hora de fin (1 hora después)
      const [hours, minutes] = startTime.split(":").map(Number)
      endTime = `${(hours + 1).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    }
  } else {
    // Asignar horarios automáticamente basados en el índice
    const baseHour = 9 + index * 2
    startTime = `${baseHour.toString().padStart(2, "0")}:00`
    endTime = `${(baseHour + 1).toString().padStart(2, "0")}:00`
  }

  // Limpiar texto de horarios para extraer el contenido principal
  let cleanText = text
    .replace(/\d{1,2}:\d{2}/g, "")
    .replace(/^\s*-\s*/, "")
    .trim()

  // Extraer precio
  const priceMatches = cleanText.match(/[€$]\s*\d+(?:[.,]\d+)?|\b\d+(?:[.,]\d+)?\s*(?:USD|EUR|euros?|dólares?)\b/i)
  const price = priceMatches ? priceMatches[0].trim() : ""

  // Limpiar precio del texto
  if (price) {
    cleanText = cleanText.replace(priceMatches![0], "").trim()
  }

  // Buscar enlaces para extraer ubicaciones
  let location = ""
  const links = li.querySelectorAll("a")

  if (links.length > 0) {
    // Intentar extraer ubicación de enlaces de Google Maps
    for (const link of links) {
      const href = link.getAttribute("href") || ""
      const linkText = link.textContent || ""

      if (href.includes("maps.google.com") || href.includes("goo.gl/maps")) {
        location = linkText.trim()
        console.log(`🗺️ Ubicación extraída de enlace: "${location}"`)
        break
      }
    }

    // Si no se encontró en enlaces de mapas, usar el texto del primer enlace
    if (!location && links[0]) {
      location = links[0].textContent?.trim() || ""
      console.log(`🔗 Ubicación extraída de enlace: "${location}"`)
    }
  }

  // Si no hay ubicación de enlaces, intentar extraer del texto
  if (!location) {
    location = extractLocationFromText(cleanText)
  }

  // Extraer título y limpiar ubicación del título
  let title = cleanText

  if (location) {
    // Remover la ubicación del título si está incluida
    title = title.replace(location, "").trim()
    title = title
      .replace(/\s+en\s*$/, "")
      .replace(/\s+del?\s*$/, "")
      .replace(/\s+al?\s*$/, "")
      .trim()
  }

  // Limpiar título de caracteres extraños y espacios múltiples
  title = title
    .replace(/[€$]\d+/g, "")
    .replace(/\s+/g, " ")
    .trim()

  // Si el título está vacío o es muy corto, usar el texto original
  if (!title || title.length < 3) {
    title = cleanText.substring(0, 50).trim()
  }

  // Determinar tipo de actividad
  const type = determineActivityType(title + " " + location + " " + text)

  console.log(`📝 Actividad procesada:`)
  console.log(`   Título: "${title}"`)
  console.log(`   Ubicación: "${location}"`)
  console.log(`   Horario: ${startTime} - ${endTime}`)
  console.log(`   Precio: "${price}"`)
  console.log(`   Tipo: ${type}`)

  return {
    id,
    title,
    location,
    startTime,
    endTime,
    price,
    description: "",
    type,
  }
}

function extractLocationFromText(text: string): string {
  // Patrones para extraer ubicaciones
  const locationPatterns = [
    /(.+?)\s+en\s+(.+)/i,
    /(.+?)\s+del?\s+(.+)/i,
    /(.+?)\s+al?\s+(.+)/i,
    /(.+?)\s+-\s+(.+)/i,
    /(.+?)\s+de\s+(.+)/i,
  ]

  for (const pattern of locationPatterns) {
    const match = text.match(pattern)
    if (match && match[2] && match[2].length > 2) {
      console.log(`📍 Ubicación extraída con patrón: "${match[2].trim()}"`)
      return match[2].trim()
    }
  }

  // Buscar nombres propios (palabras que empiezan con mayúscula)
  const words = text.split(" ")
  const properNouns = words.filter(
    (word) =>
      word.length > 3 &&
      word[0] === word[0].toUpperCase() &&
      !["Visita", "Exploración", "Paseo", "Recorrido", "Tour", "Desayuno", "Almuerzo", "Comida", "Cena"].includes(word),
  )

  if (properNouns.length > 0) {
    const location = properNouns.slice(0, 3).join(" ") // Máximo 3 palabras
    console.log(`🏛️ Ubicación extraída por nombres propios: "${location}"`)
    return location
  }

  return ""
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
    lowerText.includes("acomodarse")
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
