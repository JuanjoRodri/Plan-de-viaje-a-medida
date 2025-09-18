import { NextResponse, type NextRequest } from "next/server"
import { PDFGeneratorService } from "@/app/services/pdf-generator-service"
import type { JsonItinerary } from "@/types/enhanced-database"

export async function POST(req: NextRequest) {
  try {
    const { itinerary, userId, itineraryId } = (await req.json()) as {
      itinerary: JsonItinerary
      userId?: string | null
      itineraryId?: string | null
    }

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerario no proporcionado" }, { status: 400 })
    }

    const pdfBuffer = await PDFGeneratorService.generateItineraryPDF(
      itinerary,
      userId ?? undefined,
      itineraryId ?? undefined,
    )

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          (itinerary.title || "itinerario") + ".pdf",
        )}"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    })
  } catch (err: any) {
    console.error("❌ Error en /api/itinerary/pdf:", err)
    return NextResponse.json({ error: "Error generando PDF: " + err.message }, { status: 500 })
  }
}
