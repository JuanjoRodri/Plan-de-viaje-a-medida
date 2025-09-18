"use client"

import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomeButton() {
  const router = useRouter()

  const handleHomeClick = () => {
    // Limpiar localStorage
    try {
      localStorage.removeItem("currentItinerary")
    } catch (error) {
      console.error("Error limpiando localStorage:", error)
    }

    // Navegar a inicio y forzar refresh
    router.push("/")
    router.refresh()
  }

  return (
    <Button variant="outline" className="flex items-center gap-2" onClick={handleHomeClick}>
      <Home size={16} />
      Volver a Inicio
    </Button>
  )
}
