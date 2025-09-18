import type { NextRequest } from "next/server"

export async function trackPageView(request: NextRequest) {
  try {
    // Solo rastrear vistas de página para rutas reales (no API, estáticos, etc.)
    if (
      request.nextUrl.pathname.startsWith("/api/") ||
      request.nextUrl.pathname.startsWith("/_next/") ||
      request.nextUrl.pathname.includes(".")
    ) {
      return
    }

    // Obtener información de la sesión
    const session = request.cookies.get("session")
    let userId = null

    if (session) {
      try {
        const sessionData = JSON.parse(session.value)
        userId = sessionData.id
      } catch (e) {
        console.error("Error parsing session cookie:", e)
      }
    }

    // Obtener información de la solicitud
    const url = request.nextUrl.pathname
    const referrer = request.headers.get("referer") || null
    const userAgent = request.headers.get("user-agent") || null
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || null

    // Enviar evento de analytics
    const analyticsData = {
      event_type: "page_view",
      user_id: userId,
      event_data: { path: url },
      ip_address: ip,
      user_agent: userAgent,
      page_url: url,
      referrer: referrer,
    }

    // Enviar de forma no bloqueante
    fetch(`${request.nextUrl.origin}/api/analytics/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(analyticsData),
    }).catch((error) => {
      console.error("Error tracking page view:", error)
    })
  } catch (error) {
    console.error("Error in trackPageView:", error)
  }
}
