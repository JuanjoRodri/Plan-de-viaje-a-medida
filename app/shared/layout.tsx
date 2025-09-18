import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Itinerario Compartido - Plan de Viaje a Medida",
  description: "Visualiza tu itinerario personalizado de viaje",
}

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-white">{children}</div>
}
