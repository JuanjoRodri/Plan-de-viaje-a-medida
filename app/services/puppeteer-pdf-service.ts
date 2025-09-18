import puppeteer from "puppeteer"
import type { JsonItinerary, JsonDailyPlan, JsonActivity, JsonActivityLocation } from "@/types/enhanced-database"
import { formatOpeningHours } from "@/lib/time-utils"
import { createServerSupabaseClient } from "@/lib/supabase"

export class PuppeteerPDFService {
  /**
   * Obtiene los datos del usuario directamente de la base de datos
   */
  private static async getUserDataFromDatabase(userId: string) {
    try {
      const supabase = createServerSupabaseClient()
      const { data: user, error } = await supabase
        .from("users")
        .select("agency_name, agency_phone, agency_email, agent_name, agency_address, agency_website, agency_logo_url")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error obteniendo datos de la agencia:", error)
        return null
      }

      return user
    } catch (error) {
      console.error("Error en getUserDataFromDatabase:", error)
      return null
    }
  }

  /**
   * Genera el CSS para el PDF
   */
  private static generateCSS(): string {
    return `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
          background: #ffffff;
        }

        .container {
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
        }

        /* Header Styles */
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .header .subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }

        /* Agency Section */
        .agency-section {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
        }

        .agency-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3498db, #2ecc71);
        }

        .agency-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }

        .agency-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3498db, #2ecc71);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }

        .agency-title {
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
        }

        .agency-content {
          display: flex;
          align-items: flex-start;
          gap: 25px;
        }

        .agency-logo {
          width: 80px;
          height: 60px;
          object-fit: contain;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          background: white;
          padding: 5px;
        }

        .agency-info {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .agency-field {
          display: flex;
          align-items: center;
          font-size: 14px;
        }

        .agency-field .label {
          font-weight: 600;
          color: #495057;
          min-width: 80px;
        }

        .agency-field .value {
          color: #6c757d;
          margin-left: 8px;
        }

        /* Travel Info Section */
        .travel-info {
          background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 6px 20px rgba(116, 185, 255, 0.3);
        }

        .travel-info h2 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
        }

        .travel-info h2::before {
          content: '✈️';
          margin-right: 12px;
          font-size: 24px;
        }

        .travel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .travel-item {
          background: rgba(255, 255, 255, 0.15);
          padding: 15px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .travel-item .label {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .travel-item .value {
          font-size: 16px;
          font-weight: 600;
        }

        /* Budget Section */
        .budget-section {
          background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 6px 20px rgba(0, 184, 148, 0.3);
        }

        .budget-section h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }

        .budget-section h3::before {
          content: '💰';
          margin-right: 10px;
        }

        .budget-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .budget-type {
          font-size: 14px;
          opacity: 0.9;
        }

        .budget-total {
          font-size: 24px;
          font-weight: 700;
        }

        /* Daily Plans */
        .daily-plans h2 {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 25px;
          text-align: center;
          position: relative;
        }

        .daily-plans h2::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
        }

        /* Day Section */
        .day-section {
          margin-bottom: 40px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .day-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px 12px 0 0;
          position: relative;
          overflow: hidden;
        }

        .day-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          transform: rotate(45deg);
        }

        .day-number {
          font-size: 32px;
          font-weight: 900;
          margin-bottom: 5px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .day-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .day-date {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 300;
        }

        .day-content {
          background: white;
          border: 2px solid #e9ecef;
          border-top: none;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
        }

        .day-summary {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 1px solid #dee2e6;
          font-style: italic;
          color: #6c757d;
          position: relative;
        }

        .day-summary::before {
          content: '"';
          font-size: 48px;
          color: #dee2e6;
          position: absolute;
          top: 10px;
          left: 15px;
          font-family: serif;
        }

        .day-summary p {
          margin-left: 30px;
        }

        /* Map Section */
        .day-map {
          padding: 20px;
          text-align: center;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }

        .day-map img {
          max-width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .map-caption {
          margin-top: 10px;
          font-size: 12px;
          color: #6c757d;
          font-style: italic;
        }

        /* Activities */
        .activities {
          padding: 25px;
        }

        .activity {
          display: flex;
          margin-bottom: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 5px solid #3498db;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          break-inside: avoid;
        }

        .activity-time {
          min-width: 80px;
          margin-right: 20px;
        }

        .time-badge {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3);
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 8px;
        }

        .activity-description {
          color: #6c757d;
          margin-bottom: 15px;
          line-height: 1.6;
        }

        .activity-location {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          margin-bottom: 15px;
        }

        .location-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .location-icon {
          width: 24px;
          height: 24px;
          background: #e74c3c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          color: white;
          font-size: 12px;
        }

        .location-name {
          font-weight: 600;
          color: #2c3e50;
        }

        .location-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          font-size: 13px;
          color: #6c757d;
        }

        .location-detail {
          display: flex;
          align-items: flex-start;
        }

        .location-detail .label {
          font-weight: 600;
          min-width: 70px;
          color: #495057;
        }

        .opening-hours {
          grid-column: 1 / -1;
          margin-top: 8px;
        }

        .opening-hours .label {
          display: block;
          margin-bottom: 5px;
        }

        .opening-hours .hours {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-line;
        }

        .activity-price {
          background: linear-gradient(135deg, #00b894, #00a085);
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          display: inline-block;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .activity-notes {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          font-style: italic;
        }

        .day-notes {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          color: #1565c0;
          padding: 15px;
          margin: 20px;
          border-radius: 8px;
          font-style: italic;
        }

        .day-notes::before {
          content: '📝 ';
          margin-right: 8px;
        }

        /* General Notes */
        .general-notes {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 12px;
          padding: 25px;
          margin-top: 30px;
        }

        .general-notes h3 {
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
        }

        .general-notes h3::before {
          content: '📋';
          margin-right: 12px;
        }

        .general-notes p {
          color: #6c757d;
          line-height: 1.7;
        }

        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #dee2e6;
          text-align: center;
          color: #6c757d;
          font-size: 12px;
        }

        .footer-contact {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .footer-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .footer-date {
          font-style: italic;
          opacity: 0.8;
        }

        /* Print Styles */
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .day-section {
            page-break-inside: avoid;
          }
          
          .activity {
            break-inside: avoid;
          }
          
          .agency-section {
            break-inside: avoid;
          }
        }

        /* Responsive adjustments for PDF */
        @page {
          margin: 15mm;
          size: A4;
        }
      </style>
    `
  }

  /**
   * Genera el HTML completo del itinerario
   */
  private static async generateHTML(itinerary: JsonItinerary, agencyData: any): Promise<string> {
    const css = this.generateCSS()

    // Generar contenido HTML
    const agencySection = this.generateAgencySection(agencyData)
    const travelInfoSection = this.generateTravelInfoSection(itinerary)
    const budgetSection = itinerary.budget ? this.generateBudgetSection(itinerary.budget) : ""
    const dailyPlansSection = await this.generateDailyPlansSection(itinerary.dailyPlans, itinerary.destination?.name)
    const generalNotesSection = itinerary.generalNotes ? this.generateGeneralNotesSection(itinerary.generalNotes) : ""
    const footerSection = this.generateFooterSection(agencyData)

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${itinerary.title || "Itinerario de Viaje"}</title>
        ${css}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${itinerary.title || "Itinerario de Viaje"}</h1>
            <div class="subtitle">Planificación profesional de viaje</div>
          </div>

          ${agencySection}
          ${travelInfoSection}
          ${budgetSection}

          <div class="daily-plans">
            <h2>ITINERARIO DETALLADO</h2>
            ${dailyPlansSection}
          </div>

          ${generalNotesSection}
          ${footerSection}
        </div>
      </body>
      </html>
    `
  }

  /**
   * Genera la sección de la agencia
   */
  private static generateAgencySection(agencyData: any): string {
    const fields = [
      { label: "Nombre:", value: agencyData?.agency_name || "" },
      { label: "Agente:", value: agencyData?.agent_name || "" },
      { label: "Teléfono:", value: agencyData?.agency_phone || "" },
      { label: "Email:", value: agencyData?.agency_email || "" },
      { label: "Dirección:", value: agencyData?.agency_address || "" },
      { label: "Web:", value: agencyData?.agency_website || "" },
    ]

    const logoHtml = agencyData?.agency_logo_url
      ? `<img src="${agencyData.agency_logo_url}" alt="Logo de la agencia" class="agency-logo" />`
      : ""

    const fieldsHtml = fields
      .filter((field) => field.value)
      .map(
        (field) => `
        <div class="agency-field">
          <span class="label">${field.label}</span>
          <span class="value">${field.value}</span>
        </div>
      `,
      )
      .join("")

    return `
      <div class="agency-section">
        <div class="agency-header">
          <div class="agency-icon">🏢</div>
          <div class="agency-title">INFORMACIÓN DE LA AGENCIA</div>
        </div>
        <div class="agency-content">
          ${logoHtml}
          <div class="agency-info">
            ${fieldsHtml}
          </div>
        </div>
      </div>
    `
  }

  /**
   * Genera la sección de información del viaje
   */
  private static generateTravelInfoSection(itinerary: JsonItinerary): string {
    const items = []

    if (itinerary.destination?.name) {
      items.push({ label: "Destino", value: itinerary.destination.name })
    }

    if (itinerary.startDate && itinerary.endDate) {
      const startDate = new Date(itinerary.startDate).toLocaleDateString("es-ES")
      const endDate = new Date(itinerary.endDate).toLocaleDateString("es-ES")
      items.push({ label: "Fechas", value: `${startDate} al ${endDate}` })
    }

    if (itinerary.daysCount) {
      items.push({ label: "Duración", value: `${itinerary.daysCount} días` })
    }

    if (itinerary.travelers) {
      items.push({
        label: "Viajeros",
        value: `${itinerary.travelers} persona${itinerary.travelers > 1 ? "s" : ""}`,
      })
    }

    if (itinerary.preferences?.hotel?.name) {
      items.push({ label: "Alojamiento", value: itinerary.preferences.hotel.name })
    }

    if (itinerary.preferences?.boardType) {
      const boardTypeMap = {
        room_only: "Solo habitación",
        breakfast: "Solo desayuno",
        half_board: "Media pensión",
        full_board: "Pensión completa",
        all_inclusive: "Todo incluido",
      }
      items.push({
        label: "Pensión",
        value: boardTypeMap[itinerary.preferences.boardType] || itinerary.preferences.boardType,
      })
    }

    const itemsHtml = items
      .map(
        (item) => `
      <div class="travel-item">
        <div class="label">${item.label}</div>
        <div class="value">${item.value}</div>
      </div>
    `,
      )
      .join("")

    return `
      <div class="travel-info">
        <h2>INFORMACIÓN DEL VIAJE</h2>
        <div class="travel-grid">
          ${itemsHtml}
        </div>
      </div>
    `
  }

  /**
   * Genera la sección de presupuesto
   */
  private static generateBudgetSection(budget: any): string {
    const budgetTypeMap = {
      low: "Económico",
      medium: "Medio",
      high: "Alto",
      custom: "Personalizado",
    }

    const budgetType = budgetTypeMap[budget.type] || budget.type
    const total =
      budget.estimatedTotal && budget.currency
        ? `${budget.estimatedTotal.toLocaleString()} ${budget.currency}`
        : "No especificado"

    return `
      <div class="budget-section">
        <h3>INFORMACIÓN DE PRESUPUESTO</h3>
        <div class="budget-info">
          <div class="budget-type">Tipo: ${budgetType}</div>
          <div class="budget-total">${total}</div>
        </div>
      </div>
    `
  }

  /**
   * Genera la sección de planes diarios
   */
  private static async generateDailyPlansSection(
    dailyPlans: JsonDailyPlan[],
    destinationName?: string,
  ): Promise<string> {
    const daysHtml = await Promise.all(
      dailyPlans.map(async (plan, index) => {
        const mapHtml = await this.generateDayMapSection(plan.activities, destinationName, plan.dayNumber)
        const activitiesHtml = this.generateActivitiesSection(plan.activities)

        const summaryHtml = plan.summary
          ? `
          <div class="day-summary">
            <p>${plan.summary}</p>
          </div>
        `
          : ""

        const notesHtml = plan.dailyNotes
          ? `
          <div class="day-notes">
            Notas del día: ${plan.dailyNotes}
          </div>
        `
          : ""

        const formattedDate = plan.date
          ? new Date(plan.date + "T00:00:00").toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : ""

        return `
          <div class="day-section">
            <div class="day-header">
              <div class="day-number">DÍA ${plan.dayNumber}</div>
              ${plan.title ? `<div class="day-title">${plan.title}</div>` : ""}
              ${formattedDate ? `<div class="day-date">${formattedDate}</div>` : ""}
            </div>
            <div class="day-content">
              ${summaryHtml}
              ${mapHtml}
              <div class="activities">
                ${activitiesHtml}
              </div>
              ${notesHtml}
            </div>
          </div>
        `
      }),
    )

    return daysHtml.join("")
  }

  /**
   * Genera el mapa del día
   */
  private static async generateDayMapSection(
    activities: JsonActivity[],
    destinationName?: string,
    dayNumber?: number,
  ): Promise<string> {
    const mapUrl = this.generateStaticMapUrl(activities, destinationName)

    if (!mapUrl) {
      return ""
    }

    return `
      <div class="day-map">
        <img src="${mapUrl}" alt="Mapa del Día ${dayNumber}" />
        <div class="map-caption">Mapa de actividades del Día ${dayNumber}</div>
      </div>
    `
  }

  /**
   * Genera URL para Google Static Maps
   */
  private static generateStaticMapUrl(activities: JsonActivity[], destinationName?: string): string {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn("Google Maps API key no disponible para mapas estáticos")
      return ""
    }

    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap"
    const params = new URLSearchParams({
      size: "800x400",
      zoom: "13",
      maptype: "roadmap",
      key: apiKey,
    })

    // Obtener coordenadas de las actividades
    const validCoords = activities
      .filter((activity) => activity.location?.coordinates)
      .map((activity) => activity.location!.coordinates!)
      .filter((coords) => coords.lat && coords.lng)

    if (validCoords.length === 0) {
      // Si no hay coordenadas, usar el nombre del destino
      if (destinationName) {
        params.set("center", destinationName)
        params.set("zoom", "12")
      } else {
        return ""
      }
    } else {
      // Calcular centro de las actividades
      const centerLat = validCoords.reduce((sum, coord) => sum + coord.lat, 0) / validCoords.length
      const centerLng = validCoords.reduce((sum, coord) => sum + coord.lng, 0) / validCoords.length
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
   * Genera la sección de actividades
   */
  private static generateActivitiesSection(activities: JsonActivity[]): string {
    return activities
      .map((activity) => {
        const timeHtml = activity.startTime
          ? `
        <div class="activity-time">
          <div class="time-badge">${activity.startTime}</div>
        </div>
      `
          : ""

        const locationHtml = activity.location ? this.generateLocationSection(activity.location) : ""

        const priceHtml = activity.priceEstimate
          ? `
        <div class="activity-price">
          💰 ${activity.priceEstimate.amount} ${activity.priceEstimate.currency}${activity.priceEstimate.perPerson ? " por persona" : ""}
        </div>
      `
          : ""

        const notesHtml = activity.notes
          ? `
        <div class="activity-notes">
          💡 ${activity.notes}
        </div>
      `
          : ""

        return `
        <div class="activity">
          ${timeHtml}
          <div class="activity-content">
            <div class="activity-title">${activity.title}</div>
            ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ""}
            ${locationHtml}
            ${priceHtml}
            ${notesHtml}
          </div>
        </div>
      `
      })
      .join("")
  }

  /**
   * Genera la sección de ubicación
   */
  private static generateLocationSection(location: JsonActivityLocation): string {
    const details = []

    if (location.address) {
      details.push({ label: "Dirección:", value: location.address })
    }

    if (location.phoneNumber) {
      details.push({ label: "Teléfono:", value: location.phoneNumber })
    }

    if (location.website) {
      details.push({ label: "Web:", value: location.website })
    }

    if (location.userRating) {
      const rating = `${location.userRating.toFixed(1)}/5${location.userRatingsTotal ? ` (${location.userRatingsTotal} reseñas)` : ""}`
      details.push({ label: "Rating:", value: rating })
    }

    const detailsHtml = details
      .map(
        (detail) => `
      <div class="location-detail">
        <span class="label">${detail.label}</span>
        <span class="value">${detail.value}</span>
      </div>
    `,
      )
      .join("")

    const hoursHtml = location.openingHours
      ? `
      <div class="opening-hours">
        <span class="label">Horarios:</span>
        <div class="hours">${formatOpeningHours(location.openingHours)}</div>
      </div>
    `
      : ""

    return `
      <div class="activity-location">
        <div class="location-header">
          <div class="location-icon">📍</div>
          <div class="location-name">${location.name}</div>
        </div>
        <div class="location-details">
          ${detailsHtml}
          ${hoursHtml}
        </div>
      </div>
    `
  }

  /**
   * Genera la sección de notas generales
   */
  private static generateGeneralNotesSection(notes: string): string {
    return `
      <div class="general-notes">
        <h3>NOTAS GENERALES DEL VIAJE</h3>
        <p>${notes}</p>
      </div>
    `
  }

  /**
   * Genera el footer
   */
  private static generateFooterSection(agencyData: any): string {
    const contactItems = []

    if (agencyData?.agency_name) {
      contactItems.push(`<div class="footer-item">🏢 ${agencyData.agency_name}</div>`)
    }

    if (agencyData?.agency_phone) {
      contactItems.push(`<div class="footer-item">📞 ${agencyData.agency_phone}</div>`)
    }

    if (agencyData?.agency_email) {
      contactItems.push(`<div class="footer-item">✉️ ${agencyData.agency_email}</div>`)
    }

    const currentDate = new Date().toLocaleDateString("es-ES")

    return `
      <div class="footer">
        ${
          contactItems.length > 0
            ? `
          <div class="footer-contact">
            ${contactItems.join("")}
          </div>
        `
            : ""
        }
        <div class="footer-date">Generado el ${currentDate}</div>
      </div>
    `
  }

  /**
   * Genera un PDF a partir de un itinerario JSON usando Puppeteer
   */
  static async generateItineraryPDF(itinerary: JsonItinerary, userId?: string): Promise<Uint8Array> {
    let browser = null

    try {
      console.log("🚀 Iniciando generación de PDF con Puppeteer...")

      // Obtener datos de la agencia si tenemos userId
      let agencyData = null
      if (userId) {
        agencyData = await this.getUserDataFromDatabase(userId)
        console.log("📊 Datos de agencia obtenidos:", !!agencyData)
      }

      // Generar HTML completo
      const html = await this.generateHTML(itinerary, agencyData)
      console.log("📄 HTML generado, longitud:", html.length)

      // Configurar Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
        ],
      })

      const page = await browser.newPage()

      // Configurar viewport
      await page.setViewport({ width: 1200, height: 800 })

      // Cargar HTML
      await page.setContent(html, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      })

      console.log("🌐 HTML cargado en Puppeteer")

      // Generar PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "15mm",
          right: "15mm",
          bottom: "15mm",
          left: "15mm",
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      })

      console.log("✅ PDF generado exitosamente, tamaño:", pdfBuffer.length)

      return pdfBuffer
    } catch (error) {
      console.error("❌ Error generando PDF con Puppeteer:", error)
      throw new Error(`Error al generar el PDF del itinerario: ${error.message}`)
    } finally {
      if (browser) {
        await browser.close()
        console.log("🔒 Browser cerrado")
      }
    }
  }
}

/**
 * Función de conveniencia para generar PDF de itinerario
 */
export async function generateItineraryPdf(itinerary: JsonItinerary): Promise<void> {
  try {
    console.log("🎯 Iniciando generación de PDF para:", itinerary.title)

    // Obtener el ID del usuario actual
    let userId = null
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        userId = data.user.id
        console.log("👤 ID del usuario obtenido:", userId)
      }
    } catch (error) {
      console.error("⚠️ Error obteniendo ID del usuario:", error)
    }

    // Generar el PDF usando Puppeteer
    const pdfBytes = await PuppeteerPDFService.generateItineraryPDF(itinerary, userId)

    // Crear blob y descargar
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)

    // Crear enlace de descarga
    const link = document.createElement("a")
    link.href = url
    link.download = `${itinerary.title || "Itinerario"}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Limpiar URL
    URL.revokeObjectURL(url)

    console.log("📥 PDF descargado exitosamente")
  } catch (error) {
    console.error("❌ Error en generateItineraryPdf:", error)
    throw error
  }
}
