import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Acerca de | Personalizador de Viajes",
  description: "Información sobre la plataforma de personalización de viajes",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Acerca de Personalizador de Viajes</h1>

        <div className="prose max-w-none">
          <p className="lead">
            Personalizador de Viajes es una herramienta profesional diseñada para agencias de viajes y viajeros
            exigentes que desean crear itinerarios personalizados con facilidad.
          </p>

          <h2>Nuestra misión</h2>
          <p>
            Facilitar la creación de itinerarios de viaje detallados y personalizados, adaptados a las necesidades
            específicas de cada viajero, considerando factores como el clima, presupuesto y preferencias personales.
          </p>

          <h2>Características principales</h2>
          <ul>
            <li>Creación de itinerarios personalizados por destino, duración y presupuesto</li>
            <li>Integración de datos climáticos para adaptar las actividades</li>
            <li>Visualización de rutas en mapa interactivo</li>
            <li>Exportación a PDF e impresión de itinerarios</li>
            <li>Guardado y gestión de múltiples itinerarios</li>
            <li>Análisis de sentimiento de opiniones sobre destinos</li>
          </ul>

          <h2>¿Por qué registrarse?</h2>
          <p>Al registrarte en nuestra plataforma, podrás:</p>
          <ul>
            <li>Crear y guardar itinerarios personalizados</li>
            <li>Acceder a tu historial de itinerarios</li>
            <li>Editar y personalizar tus itinerarios existentes</li>
            <li>Exportar tus itinerarios en formato PDF</li>
            <li>Utilizar herramientas avanzadas de análisis y planificación</li>
          </ul>

          <div className="flex gap-4 mt-8">
            <Button asChild>
              <Link href="/register">Registrarse</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
