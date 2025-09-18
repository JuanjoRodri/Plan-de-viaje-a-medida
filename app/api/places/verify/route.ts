import { type NextRequest, NextResponse } from "next/server"
import { verifyPlace } from "@/app/services/place-verification-service"

export async function POST(request: NextRequest) {
  try {
    const { placeName, destinationName } = await request.json()

    if (!placeName || !destinationName) {
      return NextResponse.json({ error: "placeName and destinationName are required" }, { status: 400 })
    }

    console.log(`🔍 [API] Verificando lugar: "${placeName}" en "${destinationName}"`)

    const result = await verifyPlace(placeName, destinationName)

    console.log(`🔍 [API] Resultado: existe=${result.exists}, similitud=${result.similarity}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in places verification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
