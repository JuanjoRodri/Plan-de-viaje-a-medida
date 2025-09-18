"use client"
import type { JsonItinerary } from "@/types/enhanced-database"

/**
 * Función para generar PDF del itinerario desde el cliente
 */
export async function generateItineraryPdfClient(itinerary: JsonItinerary): Promise<void> {
  try {
    console.log("🎯 Iniciando generación de PDF para:", itinerary.title)

    // Obtener el ID del usuario actual
    let userId: string | null = null
    try {
      console.log("👤 Obteniendo información del usuario...")
      const response = await fetch("/api/auth/me")

      if (response.ok) {
        const data = await response.json()
        userId = data.user?.id || null
        console.log("✅ ID del usuario obtenido:", userId)
      } else {
        console.warn("⚠️ No se pudo obtener el usuario:", response.status, response.statusText)
        const errorText = await response.text()
        console.warn("⚠️ Respuesta del servidor:", errorText)
      }
    } catch (error) {
      console.error("❌ Error obteniendo ID del usuario:", error)
    }

    // Verificar que tenemos información de agencia
    if (userId) {
      try {
        console.log("🏢 Verificando información de agencia...")
        const agencyResponse = await fetch("/api/auth/agency-data")
        if (agencyResponse.ok) {
          const agencyData = await agencyResponse.json()
          console.log("✅ Información de agencia verificada:", {
            hasAgencyName: !!agencyData?.agency_name,
            hasAgencyEmail: !!agencyData?.agency_email,
            hasAgencyPhone: !!agencyData?.agency_phone,
          })
        } else {
          console.warn("⚠️ No se pudo obtener información de agencia")
        }
      } catch (error) {
        console.error("❌ Error verificando información de agencia:", error)
      }
    }

    // Generar el PDF usando el endpoint
    console.log("📄 Enviando solicitud de generación de PDF...")
    const pdfResponse = await fetch("/api/itinerary/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itinerary,
        userId,
      }),
    })

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text()
      throw new Error(`Error del servidor: ${pdfResponse.status} - ${errorText}`)
    }

    // Obtener el PDF como blob
    const pdfBlob = await pdfResponse.blob()
    console.log("📦 PDF recibido, tamaño:", pdfBlob.size, "bytes")

    // Crear enlace de descarga
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${itinerary.title || "Itinerario"}.pdf`

    // Añadir al DOM temporalmente y hacer clic
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Limpiar URL
    URL.revokeObjectURL(url)

    console.log("✅ PDF descargado exitosamente")
  } catch (error) {
    console.error("❌ Error en generateItineraryPdfClient:", error)

    // Mostrar error al usuario
    if (error instanceof Error) {
      alert(`Error generando PDF: ${error.message}`)
    } else {
      alert("Error desconocido generando PDF")
    }

    throw error
  }
}
