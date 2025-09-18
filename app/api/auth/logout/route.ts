import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Eliminar cookie
  response.cookies.delete("session")

  return response
}
