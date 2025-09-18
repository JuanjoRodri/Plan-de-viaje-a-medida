import type { ItineraryDay } from "./day-editor"
import type { Activity } from "./activity-editor"
import type { WeatherData } from "@/app/services/weather-service"

interface ItineraryMetadata {
  destination: string
  days: string
  nights: string
  hotel: string
  travelers: string
  arrivalTime: string
  departureTime: string
  weatherData?: WeatherData | null
}

export function generateItineraryHtml(days: ItineraryDay[], metadata: ItineraryMetadata): string {
  let html = ""

  // Generar HTML para cada día
  days.forEach((day) => {
    html += `<h2>Día ${day.dayNumber}: ${day.title}</h2>\n\n`

    // Agrupar actividades por período del día
    const morningActivities: Activity[] = []
    const noonActivities: Activity[] = []
    const afternoonActivities: Activity[] = []
    const eveningActivities: Activity[] = []

    day.activities.forEach((activity) => {
      const hour = Number.parseInt(activity.startTime.split(":")[0], 10)

      if (hour < 12) {
        morningActivities.push(activity)
      } else if (hour >= 12 && hour < 14) {
        noonActivities.push(activity)
      } else if (hour >= 14 && hour < 19) {
        afternoonActivities.push(activity)
      } else {
        eveningActivities.push(activity)
      }
    })

    // Generar secciones para cada período del día
    if (morningActivities.length > 0) {
      html += generateDaySection("Mañana", morningActivities, metadata)
    }

    if (noonActivities.length > 0) {
      html += generateDaySection("Mediodía", noonActivities, metadata)
    }

    if (afternoonActivities.length > 0) {
      html += generateDaySection("Tarde", afternoonActivities, metadata)
    }

    if (eveningActivities.length > 0) {
      html += generateDaySection("Noche", eveningActivities, metadata)
    }

    // Añadir presupuesto diario estimado
    const dailyBudget = calculateDailyBudget(day.activities)
    html += `
<div class="daily-budget">
  <p><strong>Presupuesto estimado para el Día ${day.dayNumber}:</strong> ${dailyBudget} para ${metadata.travelers} ${Number(metadata.travelers) === 1 ? "persona" : "personas"} (incluyendo comidas, entradas y transporte local)</p>
</div>
`
  })

  // Añadir resumen de presupuesto al final
  const totalBudget = calculateTotalBudget(days)
  html += `
<div class="budget-summary">
  <h3>Presupuesto Estimado Total (para ${metadata.travelers} ${Number(metadata.travelers) === 1 ? "persona" : "personas"})</h3>
  <table>
    <tr>
      <th>Categoría</th>
      <th>Costo Estimado</th>
    </tr>
    <tr>
      <td>Atracciones y actividades</td>
      <td>${totalBudget.activities}</td>
    </tr>
    <tr>
      <td>Comidas (desayunos, almuerzos y cenas)</td>
      <td>${totalBudget.meals}</td>
    </tr>
    <tr>
      <td>Transporte local</td>
      <td>${totalBudget.transport}</td>
    </tr>
    <tr>
      <td>Gastos varios</td>
      <td>${totalBudget.misc}</td>
    </tr>
    <tr class="total">
      <td>TOTAL ESTIMADO</td>
      <td>${totalBudget.total}</td>
    </tr>
  </table>
</div>
`

  return html
}

function generateDaySection(title: string, activities: Activity[], metadata: ItineraryMetadata): string {
  if (activities.length === 0) return ""

  let html = `<h3>${title} (horario aproximado)</h3>\n<ul>\n`

  // Ordenar actividades por hora de inicio
  activities.sort((a, b) => {
    const timeA = a.startTime.split(":").map(Number)
    const timeB = b.startTime.split(":").map(Number)
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
  })

  activities.forEach((activity) => {
    html += `  <li><strong>${activity.startTime} - ${activity.endTime}</strong> - ${activity.title}`

    if (activity.location) {
      // Crear enlace a Google Maps para la ubicación
      const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(activity.location)}+${encodeURIComponent(metadata.destination)}`
      html += `\n    <br>Ubicación: <a href="${mapUrl}" target="_blank">${activity.location} (Ver en mapa)</a>`
    }

    if (activity.price) {
      html += `\n    <br>Precio: <strong>${activity.price} para ${metadata.travelers} ${Number(metadata.travelers) === 1 ? "persona" : "personas"}</strong>`
    }

    if (activity.description) {
      const descriptionLines = activity.description.split("\n")
      descriptionLines.forEach((line) => {
        if (line.trim()) {
          html += `\n    <br>${line}`
        }
      })
    }

    html += `\n  </li>\n`
  })

  html += `</ul>\n\n`
  return html
}

function calculateDailyBudget(activities: Activity[]): string {
  let total = 0

  activities.forEach((activity) => {
    if (activity.price) {
      // Extraer números del precio
      const priceMatch = activity.price.match(/(\d+[.,]?\d*)/)
      if (priceMatch) {
        const price = Number.parseFloat(priceMatch[1].replace(",", "."))
        if (!isNaN(price)) {
          total += price
        }
      }
    }
  })

  // Añadir un margen del 20% para gastos imprevistos
  const withMargin = total * 1.2

  // Redondear a un número "amigable"
  const rounded = Math.ceil(withMargin / 10) * 10

  return `${rounded}€ - ${rounded + 50}€`
}

function calculateTotalBudget(days: ItineraryDay[]): {
  activities: string
  meals: string
  transport: string
  misc: string
  total: string
} {
  let activitiesTotal = 0
  let mealsTotal = 0
  let transportTotal = 0

  days.forEach((day) => {
    day.activities.forEach((activity) => {
      if (!activity.price) return

      const priceMatch = activity.price.match(/(\d+[.,]?\d*)/)
      if (!priceMatch) return

      const price = Number.parseFloat(priceMatch[1].replace(",", "."))
      if (isNaN(price)) return

      if (activity.type === "meal") {
        mealsTotal += price
      } else if (activity.type === "transport") {
        transportTotal += price
      } else if (activity.type === "activity") {
        activitiesTotal += price
      }
    })
  })

  // Calcular gastos varios (20% del total)
  const subtotal = activitiesTotal + mealsTotal + transportTotal
  const miscTotal = subtotal * 0.2

  // Calcular total
  const total = subtotal + miscTotal

  // Redondear a números "amigables"
  const roundedActivities = Math.ceil(activitiesTotal / 10) * 10
  const roundedMeals = Math.ceil(mealsTotal / 10) * 10
  const roundedTransport = Math.ceil(transportTotal / 10) * 10
  const roundedMisc = Math.ceil(miscTotal / 10) * 10
  const roundedTotal = Math.ceil(total / 10) * 10

  return {
    activities: `${roundedActivities}€`,
    meals: `${roundedMeals}€`,
    transport: `${roundedTransport}€`,
    misc: `${roundedMisc}€`,
    total: `${roundedTotal}€`,
  }
}
