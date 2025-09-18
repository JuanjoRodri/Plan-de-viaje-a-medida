import { type NextRequest, NextResponse } from "next/server"
import { cleanupExpiredPhotos } from "@/app/services/places-photos-service"

export async function POST(request: NextRequest) {
  try {
    // Verificar que la petición viene de Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting cleanup of expired photos...")
    const result = await cleanupExpiredPhotos()

    console.log(`Cleanup completed: ${result.deleted} photos deleted`)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed: ${result.deleted} photos deleted`,
      deleted: result.deleted,
    })
  } catch (error) {
    console.error("Error in photo cleanup cron:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
