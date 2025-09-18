import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, ThermometerSun, FileDown, Save, Edit, BarChart, Map, Users, Euro } from "lucide-react"

export const metadata: Metadata = {
  title: "Características | Personalizador de Viajes",
  description: "Descubre todas las características de nuestra plataforma de personalización de viajes",
}

export default function FeaturesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Características de Personalizador de Viajes</h1>
          <p className="text-lg text-muted-foreground">
            Descubre todas las herramientas que tenemos para hacer de tu viaje una experiencia inolvidable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Itinerarios personalizados
              </CardTitle>
              <CardDescription>Crea rutas adaptadas a tus necesidades</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Genera itinerarios detallados por día, con recomendaciones de lugares para visitar, restaurantes y
                actividades, todo adaptado a tus preferencias.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThermometerSun className="h-5 w-5 text-primary" />
                Integración climática
              </CardTitle>
              <CardDescription>Planifica según el clima previsto</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Nuestros itinerarios se adaptan automáticamente a las condiciones climáticas previstas para cada día de
                tu viaje, sugiriendo actividades adecuadas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Visualización en mapa
              </CardTitle>
              <CardDescription>Ve tu ruta de forma interactiva</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Visualiza todos los puntos de interés de tu itinerario en un mapa interactivo, para entender mejor las
                distancias y planificar tus desplazamientos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-primary" />
                Exportación a PDF
              </CardTitle>
              <CardDescription>Lleva tu itinerario siempre contigo</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Exporta tus itinerarios en formato PDF con un diseño profesional, ideal para imprimir o compartir con
                tus compañeros de viaje.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Guardado de itinerarios
              </CardTitle>
              <CardDescription>Accede a tus planes en cualquier momento</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Guarda todos tus itinerarios y accede a ellos cuando quieras. Mantén un historial de tus planes de viaje
                para futuras referencias.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Análisis de sentimiento
              </CardTitle>
              <CardDescription>Conoce las opiniones sobre los destinos</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Utiliza nuestra herramienta de análisis de sentimiento para evaluar las opiniones sobre destinos,
                hoteles y restaurantes antes de decidir.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Edición personalizada
              </CardTitle>
              <CardDescription>Modifica tus itinerarios a tu gusto</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Edita y personaliza cualquier aspecto de tus itinerarios generados, añadiendo tus propias notas, lugares
                o modificando los horarios.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Adaptación por número de viajeros
              </CardTitle>
              <CardDescription>Itinerarios para individuos o grupos</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Nuestros itinerarios se adaptan al número de viajeros, ajustando recomendaciones y estimaciones de
                costos según el tamaño del grupo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                Presupuesto personalizado
              </CardTitle>
              <CardDescription>Planifica según tu capacidad económica</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Define tu presupuesto y obtén un itinerario adaptado a él, con recomendaciones de actividades y
                alojamientos que se ajusten a tus posibilidades.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">¿Listo para comenzar?</h2>
          <p className="mb-6">
            Regístrate ahora y comienza a crear itinerarios personalizados para tus próximos viajes.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">Registrarse</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
