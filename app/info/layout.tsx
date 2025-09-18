import type React from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/info" className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">PlanDeViajeAMedida</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <Link href="/info/caracteristicas" className="text-gray-600 hover:text-blue-600">
                  Características
                </Link>
                <Link href="/info/funcionalidades" className="text-gray-600 hover:text-blue-600">
                  Funcionalidades
                </Link>
                <Link href="/info/precios" className="text-gray-600 hover:text-blue-600">
                  Precios
                </Link>
                <Link href="/info/sobre-nosotros" className="text-gray-600 hover:text-blue-600">
                  Sobre nosotros
                </Link>
                <Link href="/info/contacto" className="text-gray-600 hover:text-blue-600">
                  Contacto
                </Link>
              </nav>
              <Link href="/login">
                <Button>Acceder</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-blue-400 mr-2" />
                <span className="font-bold">PlanDeViajeAMedida</span>
              </div>
              <p className="text-gray-400 text-sm">
                La plataforma de planificación de viajes más avanzada para agencias.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/info/caracteristicas">Características</Link>
                </li>
                <li>
                  <Link href="/info/precios">Precios</Link>
                </li>
                <li>
                  <Link href="/info/funcionalidades">Funcionalidades</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/info/sobre-nosotros">Sobre nosotros</Link>
                </li>
                <li>
                  <Link href="/info/contacto">Contacto</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/info/terminos">Términos de uso</Link>
                </li>
                <li>
                  <Link href="/info/privacidad">Política de privacidad</Link>
                </li>
                <li>
                  <Link href="/info/cookies">Cookies</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 PlanDeViajeAMedida. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
