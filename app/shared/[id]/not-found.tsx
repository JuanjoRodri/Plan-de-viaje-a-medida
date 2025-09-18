import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Itinerario no encontrado</h1>
        <p className="text-gray-600 mb-6">El itinerario que buscas no existe, ha expirado o ha sido eliminado.</p>
        <Button asChild>
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Ir al inicio
          </Link>
        </Button>
      </Card>
    </div>
  )
}
