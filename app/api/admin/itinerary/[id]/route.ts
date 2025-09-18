import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  return NextResponse.json({
    id,
    title: "Test Itinerary",
    status: "active",
  })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  return NextResponse.json({
    success: true,
    deleted: id,
  })
}
