import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Ban, Home, Mail } from "lucide-react"

export default function DeactivatedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <Ban className="h-16 w-16 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace desactivado</h1>
        <p className="text-gray-600 mb-4">
          Este itinerario ha sido desactivado por su propietario y ya no está disponible públicamente.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Si crees que esto es un error, contacta con la persona que compartió este enlace contigo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/info/contacto" className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              Contacto
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
