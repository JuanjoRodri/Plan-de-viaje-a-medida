import jsPDF from "jspdf"
import type { JsonItinerary, JsonDailyPlan, JsonActivity, JsonActivityLocation } from "@/types/enhanced-database"
import { formatOpeningHours } from "@/lib/time-utils"
import { createServerSupabaseClient } from "@/lib/supabase"

export class PDFGeneratorService {
  private static readonly MARGIN = 20
  private static readonly LINE_HEIGHT = 6
  private static readonly PAGE_WIDTH = 210
  private static readonly PAGE_HEIGHT = 297
  private static readonly CONTENT_WIDTH = this.PAGE_WIDTH - this.MARGIN * 2
  private static readonly MAP_WIDTH = 80
  private static readonly MAP_HEIGHT = 60

  /**
   * Obtiene los datos del usuario directamente de la base de datos
   */
  private static async getUserDataFromDatabase(userId: string) {
    try {
      console.log("🔍 Obteniendo datos de agencia para usuario:", userId)

      const supabase = createServerSupabaseClient()
      const { data: user, error } = await supabase
        .from("users")
        .select(`
          agency_name, 
          agency_phone, 
          agency_email, 
          agent_name, 
          agency_address, 
          agency_website, 
          agency_logo_url
        `)
        .eq("id", userId)
        .single()

      if (error) {
        console.error("❌ Error obteniendo datos de la agencia:", error)
        console.error("❌ Detalles del error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return null
      }

      console.log("✅ Datos de agencia obtenidos:", {
        hasAgencyName: !!user?.agency_name,
        hasAgencyEmail: !!user?.agency_email,
        hasAgencyPhone: !!user?.agency_phone,
        hasAgencyAddress: !!user?.agency_address,
        hasAgencyWebsite: !!user?.agency_website,
        hasAgencyLogo: !!user?.agency_logo_url,
        agencyName: user?.agency_name || "No especificado",
      })

      return user
    } catch (error) {
      console.error("💥 Error en getUserDataFromDatabase:", error)
      return null
    }
  }

  /**
   * Obtiene los datos del itinerario directamente de la base de datos
   */
  private static async getItineraryDataFromDatabase(itineraryId: string) {
    try {
      console.log("🔍 Obteniendo datos del itinerario para PDF:", itineraryId)

      const supabase = createServerSupabaseClient()
      const { data: itineraryData, error } = await supabase
        .from("itineraries")
        .select("board_type")
        .eq("id", itineraryId)
        .single()

      if (error) {
        console.error("❌ Error obteniendo datos del itinerario:", error)
        return null
      }

      console.log("✅ Datos del itinerario obtenidos:", {
        boardType: itineraryData?.board_type || "No especificado",
      })

      return itineraryData
    } catch (error) {
      console.error("💥 Error en getItineraryDataFromDatabase:", error)
      return null
    }
  }

  /**
   * Genera un PDF a partir de un itinerario JSON
   */
  static async generateItineraryPDF(
    itinerary: JsonItinerary,
    userId?: string,
    itineraryId?: string,
  ): Promise<Uint8Array> {
    const doc = new jsPDF()
    let yPosition = this.MARGIN

    try {
      console.log("🚀 Iniciando generación de PDF...")
      console.log("📋 Datos del itinerario:", {
        title: itinerary.title,
        destination: itinerary.destination?.name,
        userId: userId ? "✅ Proporcionado" : "❌ No proporcionado",
      })

      // Configurar fuente
      doc.setFont("helvetica")

      // Título del itinerario
      yPosition = this.addTitle(doc, yPosition, itinerary.title || "Itinerario de Viaje")
      yPosition += 15

      // Obtener datos de la agencia si tenemos userId
      let agencyData = null
      if (userId) {
        console.log("🏢 Obteniendo datos de la agencia...")
        agencyData = await this.getUserDataFromDatabase(userId)

        if (agencyData) {
          console.log("✅ Datos de agencia cargados para el PDF")
        } else {
          console.warn("⚠️ No se pudieron obtener datos de agencia")
        }
      } else {
        console.warn("⚠️ No se proporcionó userId, PDF sin información de agencia")
      }

      // Obtener datos del itinerario si tenemos itineraryId
      let itineraryData = null
      if (itineraryId) {
        console.log("📋 Obteniendo datos del itinerario...")
        itineraryData = await this.getItineraryDataFromDatabase(itineraryId)
      }

      // Siempre mostrar la sección de agencia (aunque esté vacía)
      yPosition = await this.addAgencySection(doc, yPosition, agencyData)
      yPosition += 15

      // Información general del viaje
      yPosition = this.addTravelInfoSection(doc, yPosition, itinerary, itineraryData)
      yPosition += 15

      // Resumen de presupuesto si existe
      if (itinerary.budget) {
        yPosition = this.addBudgetSummary(doc, yPosition, itinerary.budget)
        yPosition += 10
      }

      // Planes diarios
      if (itinerary.dailyPlans && itinerary.dailyPlans.length > 0) {
        yPosition = await this.addDailyPlans(doc, yPosition, itinerary.dailyPlans, itinerary.destination?.name)
      }

      // Notas generales
      if (itinerary.generalNotes) {
        yPosition = this.addGeneralNotes(doc, yPosition, itinerary.generalNotes)
      }

      // Footer con información de contacto
      if (agencyData) {
        this.addFooter(doc, agencyData)
      }

      const pdfBuffer = doc.output("arraybuffer") as Uint8Array
      console.log("✅ PDF generado exitosamente, tamaño:", pdfBuffer.byteLength, "bytes")

      return pdfBuffer
    } catch (error) {
      console.error("❌ Error generando PDF:", error)
      throw new Error("Error al generar el PDF del itinerario")
    }
  }

  /**
   * Genera URL para Google Static Maps
   */
  private static generateStaticMapUrl(
    activities: JsonActivity[],
    centerCoords?: { lat: number; lng: number },
    destinationName?: string,
  ): string {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn("Google Maps API key no disponible para mapas estáticos")
      return ""
    }

    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap"
    const params = new URLSearchParams({
      size: "400x300",
      zoom: "13",
      maptype: "roadmap",
      key: apiKey,
    })

    // Obtener coordenadas de las actividades
    const validCoords = activities
      .filter((activity) => activity.location?.coordinates)
      .map((activity) => activity.location!.coordinates!)
      .filter((coords) => coords.lat && coords.lng)

    if (validCoords.length === 0 && !centerCoords) {
      // Si no hay coordenadas, usar el nombre del destino
      if (destinationName) {
        params.set("center", destinationName)
        params.set("zoom", "12")
      } else {
        return ""
      }
    } else {
      // Usar coordenadas del centro o calcular centro de las actividades
      let centerLat: number, centerLng: number

      if (centerCoords) {
        centerLat = centerCoords.lat
        centerLng = centerCoords.lng
      } else {
        centerLat = validCoords.reduce((sum, coord) => sum + coord.lat, 0) / validCoords.length
        centerLng = validCoords.reduce((sum, coord) => sum + coord.lng, 0) / validCoords.length
      }

      params.set("center", `${centerLat},${centerLng}`)

      // Añadir marcadores para cada actividad
      validCoords.forEach((coord, index) => {
        const markerColor = index === 0 ? "red" : "blue"
        const label = String.fromCharCode(65 + index) // A, B, C, etc.
        params.append("markers", `color:${markerColor}|label:${label}|${coord.lat},${coord.lng}`)
      })
    }

    return `${baseUrl}?${params.toString()}`
  }

  /**
   * Carga una imagen desde una URL
   */
  private static async loadImageFromUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Error cargando imagen:", error)
      return null
    }
  }

  /**
   * Añade el título principal
   */
  private static addTitle(doc: jsPDF, yPosition: number, title: string): number {
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)

    const lines = doc.splitTextToSize(title, this.CONTENT_WIDTH)
    doc.text(lines, this.MARGIN, yPosition)

    return yPosition + lines.length * 8
  }

  /**
   * Añade la sección de información de la agencia con layout responsive
   */
  private static async addAgencySection(doc: jsPDF, yPosition: number, agencyData: any): Promise<number> {
    // Título de la sección
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("INFORMACIÓN DE LA AGENCIA", this.MARGIN, yPosition)
    yPosition += 10

    // Si no hay datos de agencia, mostrar mensaje
    if (!agencyData || (!agencyData.agency_name && !agencyData.agency_email && !agencyData.agency_phone)) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(100, 100, 100)
      doc.text("Complete su información empresarial en el perfil para que aparezca aquí", this.MARGIN, yPosition)
      yPosition += 15

      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(this.MARGIN, yPosition, this.PAGE_WIDTH - this.MARGIN, yPosition)

      return yPosition + 5
    }

    // Preparar los campos de información
    const fields = [
      { label: "Nombre:", value: agencyData?.agency_name || "" },
      { label: "Agente:", value: agencyData?.agent_name || "" },
      { label: "Teléfono:", value: agencyData?.agency_phone || "" },
      { label: "Email:", value: agencyData?.agency_email || "" },
      { label: "Dirección:", value: agencyData?.agency_address || "" },
      { label: "Sitio web:", value: agencyData?.agency_website || "" },
    ].filter((field) => field.value) // Solo mostrar campos que tienen valor

    // Logo de la agencia (si existe)
    let logoHeight = 0
    let logoWidth = 0
    if (agencyData?.agency_logo_url) {
      try {
        const logoImage = await this.loadImageFromUrl(agencyData.agency_logo_url)
        if (logoImage) {
          logoWidth = 35
          logoHeight = 25
          doc.addImage(logoImage, "JPEG", this.MARGIN, yPosition, logoWidth, logoHeight)

          // Añadir borde al logo
          doc.setDrawColor(200, 200, 200)
          doc.rect(this.MARGIN, yPosition, logoWidth, logoHeight)
        }
      } catch (error) {
        console.warn("No se pudo cargar el logo de la agencia:", error)
      }
    }

    // Calcular el espacio disponible para la información
    const availableWidth = this.CONTENT_WIDTH - (logoWidth > 0 ? logoWidth + 10 : 0)
    const infoStartX = logoWidth > 0 ? this.MARGIN + logoWidth + 10 : this.MARGIN

    // Layout en dos columnas si hay suficiente espacio
    const useDoubleColumn = availableWidth > 100 && fields.length > 2
    let infoY = yPosition

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 0)

    if (useDoubleColumn) {
      // Layout en dos columnas
      const columnWidth = availableWidth / 2 - 5
      let leftColumnY = infoY
      let rightColumnY = infoY

      fields.forEach((field, index) => {
        const isLeftColumn = index % 2 === 0
        const columnX = isLeftColumn ? infoStartX : infoStartX + columnWidth + 10
        const currentY = isLeftColumn ? leftColumnY : rightColumnY

        // Manejar campos largos como dirección
        if (field.label === "Dirección:" && field.value) {
          const addressLines = doc.splitTextToSize(`${field.label} ${field.value}`, columnWidth)
          doc.text(addressLines, columnX, currentY)
          if (isLeftColumn) {
            leftColumnY += addressLines.length * 6
          } else {
            rightColumnY += addressLines.length * 6
          }
        } else {
          doc.text(`${field.label} ${field.value}`, columnX, currentY)
          if (isLeftColumn) {
            leftColumnY += 6
          } else {
            rightColumnY += 6
          }
        }
      })

      infoY = Math.max(leftColumnY, rightColumnY)
    } else {
      // Layout en una columna
      fields.forEach((field) => {
        if (field.label === "Dirección:" && field.value) {
          const addressLines = doc.splitTextToSize(`${field.label} ${field.value}`, availableWidth)
          doc.text(addressLines, infoStartX, infoY)
          infoY += addressLines.length * 6
        } else {
          doc.text(`${field.label} ${field.value}`, infoStartX, infoY)
          infoY += 6
        }
      })
    }

    // Calcular la posición final considerando el logo
    const finalY = Math.max(yPosition + logoHeight, infoY)

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(this.MARGIN, finalY + 5, this.PAGE_WIDTH - this.MARGIN, finalY + 5)

    return finalY + 10
  }

  /**
   * Añade la sección de información del viaje
   */
  private static addTravelInfoSection(
    doc: jsPDF,
    yPosition: number,
    itinerary: JsonItinerary,
    itineraryData?: any,
  ): number {
    // Título de la sección
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("INFORMACIÓN DEL VIAJE", this.MARGIN, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")

    const info = []

    // Destino
    if (itinerary.destination?.name) {
      info.push(`Destino: ${itinerary.destination.name}`)
    }

    // Fechas
    if (itinerary.startDate && itinerary.endDate) {
      const startDate = new Date(itinerary.startDate).toLocaleDateString("es-ES")
      const endDate = new Date(itinerary.endDate).toLocaleDateString("es-ES")
      info.push(`Fechas: ${startDate} al ${endDate}`)
    }

    // Duración
    if (itinerary.daysCount) {
      info.push(`Duración: ${itinerary.daysCount} días`)
    }

    // Viajeros
    if (itinerary.travelers) {
      info.push(`Viajeros: ${itinerary.travelers} persona${itinerary.travelers > 1 ? "s" : ""}`)
    }

    // Hotel
    if (itinerary.preferences?.hotel?.name) {
      info.push(`Alojamiento: ${itinerary.preferences.hotel.name}`)
    }

    // Tipo de pensión - USAR DATOS DE LA BASE DE DATOS
    const boardType = itineraryData?.board_type || itinerary.preferences?.boardType
    if (boardType) {
      const boardTypeMap = {
        "sin-pension": "Sin pensión",
        "solo-desayuno": "Solo desayuno",
        "media-pension": "Media pensión",
        "pension-completa": "Pensión completa",
        "todo-incluido": "Todo incluido",
        // Mantener compatibilidad con valores antiguos
        room_only: "Solo habitación",
        breakfast: "Solo desayuno",
        half_board: "Media pensión",
        full_board: "Pensión completa",
        all_inclusive: "Todo incluido",
      }
      const boardTypeText = boardTypeMap[boardType] || boardType
      info.push(`Pensión: ${boardTypeText}`)
    }

    info.forEach((item, index) => {
      doc.text(item, this.MARGIN, yPosition + index * this.LINE_HEIGHT)
    })

    return yPosition + info.length * this.LINE_HEIGHT
  }

  /**
   * Añade resumen de presupuesto
   */
  private static addBudgetSummary(doc: jsPDF, yPosition: number, budget: any): number {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Información de Presupuesto", this.MARGIN, yPosition)
    yPosition += 8

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")

    if (budget.type) {
      const budgetTypeMap = {
        low: "Económico",
        medium: "Medio",
        high: "Alto",
        custom: "Personalizado",
      }
      doc.text(`Tipo de presupuesto: ${budgetTypeMap[budget.type] || budget.type}`, this.MARGIN, yPosition)
      yPosition += this.LINE_HEIGHT
    }

    if (budget.estimatedTotal && budget.currency) {
      doc.setFont("helvetica", "bold")
      doc.text(`Total estimado: ${budget.estimatedTotal} ${budget.currency}`, this.MARGIN, yPosition)
      yPosition += this.LINE_HEIGHT + 2
    }

    return yPosition
  }

  /**
   * Añade los planes diarios
   */
  private static async addDailyPlans(
    doc: jsPDF,
    yPosition: number,
    dailyPlans: JsonDailyPlan[],
    destinationName?: string,
  ): Promise<number> {
    // Título de la sección
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("ITINERARIO DETALLADO", this.MARGIN, yPosition)
    yPosition += 15

    for (let i = 0; i < dailyPlans.length; i++) {
      const plan = dailyPlans[i]

      // Verificar si necesitamos nueva página
      if (yPosition > this.PAGE_HEIGHT - 100) {
        doc.addPage()
        yPosition = this.MARGIN
      }

      // Título del día
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)

      const dayTitle = `DÍA ${plan.dayNumber}${plan.title ? `: ${plan.title}` : ""}`
      doc.text(dayTitle, this.MARGIN, yPosition)
      yPosition += 10

      // Fecha del día
      if (plan.date) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 100)
        const formattedDate = new Date(plan.date + "T00:00:00").toLocaleDateString("es-ES")
        doc.text(`Fecha: ${formattedDate}`, this.MARGIN, yPosition)
        yPosition += 8
        doc.setTextColor(0, 0, 0)
      }

      // Generar y añadir mapa del día
      const mapUrl = this.generateStaticMapUrl(
        plan.activities,
        plan.activities.find((a) => a.location?.coordinates)?.location?.coordinates,
        destinationName,
      )

      if (mapUrl) {
        try {
          console.log(`Cargando mapa para día ${plan.dayNumber}:`, mapUrl)
          const mapImage = await this.loadImageFromUrl(mapUrl)

          if (mapImage) {
            // Posicionar el mapa a la derecha
            const mapX = this.PAGE_WIDTH - this.MARGIN - this.MAP_WIDTH
            const mapY = yPosition - 15

            doc.addImage(mapImage, "JPEG", mapX, mapY, this.MAP_WIDTH, this.MAP_HEIGHT)

            // Añadir borde al mapa
            doc.setDrawColor(200, 200, 200)
            doc.rect(mapX, mapY, this.MAP_WIDTH, this.MAP_HEIGHT)

            // Añadir etiqueta del mapa
            doc.setFontSize(8)
            doc.setFont("helvetica", "italic")
            doc.text(`Mapa del Día ${plan.dayNumber}`, mapX, mapY + this.MAP_HEIGHT + 8)

            console.log(`✅ Mapa añadido para día ${plan.dayNumber}`)
          }
        } catch (error) {
          console.error(`Error añadiendo mapa para día ${plan.dayNumber}:`, error)
        }
      }

      // Resumen del día (ajustado para dejar espacio al mapa)
      if (plan.summary) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "italic")
        const summaryWidth = this.CONTENT_WIDTH - this.MAP_WIDTH - 10
        const summaryLines = doc.splitTextToSize(plan.summary, summaryWidth)
        doc.text(summaryLines, this.MARGIN, yPosition)
        yPosition += Math.max(summaryLines.length * this.LINE_HEIGHT + 5, this.MAP_HEIGHT + 15)
      } else {
        // Si no hay resumen, dejar espacio para el mapa
        yPosition += this.MAP_HEIGHT + 15
      }

      // Actividades
      if (plan.activities && plan.activities.length > 0) {
        yPosition = await this.addActivities(doc, yPosition, plan.activities, destinationName)
      }

      // Notas del día
      if (plan.dailyNotes) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(0, 0, 150)
        const notesLines = doc.splitTextToSize(`Notas del día: ${plan.dailyNotes}`, this.CONTENT_WIDTH)
        doc.text(notesLines, this.MARGIN, yPosition)
        yPosition += notesLines.length * 5 + 5
        doc.setTextColor(0, 0, 0)
      }

      yPosition += 15
    }

    return yPosition
  }

  /**
   * Añade las actividades de un día
   */
  private static async addActivities(
    doc: jsPDF,
    yPosition: number,
    activities: JsonActivity[],
    destinationName?: string,
  ): Promise<number> {
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i]

      // Verificar si necesitamos nueva página
      if (yPosition > this.PAGE_HEIGHT - 40) {
        doc.addPage()
        yPosition = this.MARGIN
      }

      // Hora y título de la actividad
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      const timeText = activity.startTime ? `${activity.startTime} - ` : ""
      doc.text(`${timeText}${activity.title}`, this.MARGIN + 5, yPosition)
      yPosition += 7

      // Descripción
      if (activity.description) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const descLines = doc.splitTextToSize(activity.description, this.CONTENT_WIDTH - 10)
        doc.text(descLines, this.MARGIN + 5, yPosition)
        yPosition += descLines.length * 5 + 3
      }

      // Información del lugar
      if (activity.location) {
        yPosition = this.addLocationInfo(doc, yPosition, activity.location)
      }

      // Precio estimado
      if (activity.priceEstimate) {
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 100, 0)
        const priceText = `Precio estimado: ${activity.priceEstimate.amount} ${activity.priceEstimate.currency}${activity.priceEstimate.perPerson ? " por persona" : ""}`
        doc.text(priceText, this.MARGIN + 5, yPosition)
        yPosition += 6
        doc.setTextColor(0, 0, 0)
      }

      // Notas de la actividad
      if (activity.notes) {
        doc.setFontSize(9)
        doc.setFont("helvetica", "italic")
        doc.setTextColor(100, 100, 100)
        const notesLines = doc.splitTextToSize(`Notas: ${activity.notes}`, this.CONTENT_WIDTH - 10)
        doc.text(notesLines, this.MARGIN + 5, yPosition)
        yPosition += notesLines.length * 4 + 3
        doc.setTextColor(0, 0, 0)
      }

      yPosition += 5
    }

    return yPosition
  }

  /**
   * Añade información detallada del lugar
   */
  private static addLocationInfo(doc: jsPDF, yPosition: number, location: JsonActivityLocation): number {
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 100, 100)

    // Nombre del lugar
    doc.text(`Lugar: ${location.name}`, this.MARGIN + 10, yPosition)
    yPosition += 5

    // Dirección
    if (location.address) {
      doc.text(`Dirección: ${location.address}`, this.MARGIN + 10, yPosition)
      yPosition += 5
    }

    // Teléfono
    if (location.phoneNumber) {
      doc.text(`Teléfono: ${location.phoneNumber}`, this.MARGIN + 10, yPosition)
      yPosition += 5
    }

    // Horarios
    if (location.openingHours) {
      doc.text("Horarios:", this.MARGIN + 10, yPosition)
      yPosition += 4

      const formattedHours = formatOpeningHours(location.openingHours)
      const hoursLines = doc.splitTextToSize(formattedHours, this.CONTENT_WIDTH - 20)
      doc.text(hoursLines, this.MARGIN + 15, yPosition)
      yPosition += hoursLines.length * 4 + 3
    }

    // Rating
    if (location.userRating) {
      doc.text(`Rating: ${location.userRating.toFixed(1)}/5`, this.MARGIN + 10, yPosition)
      if (location.userRatingsTotal) {
        doc.text(` (${location.userRatingsTotal} reseñas)`, this.MARGIN + 60, yPosition)
      }
      yPosition += 5
    }

    // Website
    if (location.website) {
      doc.text(`Web: ${location.website}`, this.MARGIN + 10, yPosition)
      yPosition += 5
    }

    doc.setTextColor(0, 0, 0) // Resetear color
    return yPosition + 3
  }

  /**
   * Añade notas generales
   */
  private static addGeneralNotes(doc: jsPDF, yPosition: number, notes: string): number {
    // Verificar si necesitamos nueva página
    if (yPosition > this.PAGE_HEIGHT - 60) {
      doc.addPage()
      yPosition = this.MARGIN
    }

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("Notas Generales del Viaje", this.MARGIN, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    const notesLines = doc.splitTextToSize(notes, this.CONTENT_WIDTH)
    doc.text(notesLines, this.MARGIN, yPosition)
    yPosition += notesLines.length * this.LINE_HEIGHT + 5

    return yPosition
  }

  /**
   * Añade footer con información de contacto
   */
  private static addFooter(doc: jsPDF, agencyData: any): void {
    const pageCount = doc.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      // Línea separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(this.MARGIN, this.PAGE_HEIGHT - 25, this.PAGE_WIDTH - this.MARGIN, this.PAGE_HEIGHT - 25)

      // Información de contacto
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)

      const footerText = []
      if (agencyData?.agency_name) footerText.push(agencyData.agency_name)
      if (agencyData?.agency_phone) footerText.push(`Tel: ${agencyData.agency_phone}`)
      if (agencyData?.agency_email) footerText.push(`Email: ${agencyData.agency_email}`)

      if (footerText.length > 0) {
        doc.text(footerText.join(" | "), this.MARGIN, this.PAGE_HEIGHT - 15)
      }

      // Número de página
      doc.text(`Página ${i} de ${pageCount}`, this.PAGE_WIDTH - this.MARGIN - 20, this.PAGE_HEIGHT - 15)

      // Fecha de generación
      const currentDate = new Date().toLocaleDateString("es-ES")
      doc.text(`Generado el: ${currentDate}`, this.PAGE_WIDTH - this.MARGIN - 20, this.PAGE_HEIGHT - 10)
    }
  }
}

/**
 * Función principal de generación de PDF.
 * Usa exclusivamente jsPDF → sin depender de Puppeteer.
 */
export async function generateItineraryPdf(
  itinerary: JsonItinerary,
  userId?: string,
  itineraryId?: string,
): Promise<Uint8Array> {
  return PDFGeneratorService.generateItineraryPDF(itinerary, userId, itineraryId)
}
