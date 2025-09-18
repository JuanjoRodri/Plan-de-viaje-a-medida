import { type NextRequest, NextResponse } from "next/server"
import { getPlacePhotos } from "@/app/services/places-photos-service"
import { hasPhotoAccess } from "@/lib/role-utils"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { placeId: string } }) {
  try {
    // 1. Verificar autenticación
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // 2. Verificar permisos de fotos
    if (!hasPhotoAccess(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Photo access not available in your plan. Upgrade to access photos.",
        },
        { status: 403 },
      )
    }

    // 3. Obtener parámetros
    const { placeId } = params
    const { searchParams } = new URL(request.url)
    const googlePlaceId = searchParams.get("googlePlaceId")

    if (!placeId) {
      return NextResponse.json({ success: false, error: "Place ID is required" }, { status: 400 })
    }

    // 4. Obtener fotos
    const result = await getPlacePhotos(placeId, googlePlaceId || undefined)

    // 5. Log para analytics (opcional)
    if (result.success && result.photos.length > 0) {
      console.log(`Photos loaded for place ${placeId} by user ${user.id} (${result.cached ? "cached" : "fresh"})`)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in photos API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        photos: [],
        cached: false,
      },
      { status: 500 },
    )
  }
}
