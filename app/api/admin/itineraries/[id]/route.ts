import { type NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params

    return NextResponse.json({
      success: true,
      itinerary: {
        id,
        title: `Itinerary ${id}`,
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = params

    return NextResponse.json({
      success: true,
      message: `Itinerary ${id} deleted`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
