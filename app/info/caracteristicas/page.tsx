import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  Star,
  Clock,
  MapPin,
  FileDown,
  Save,
  Edit,
  BarChart,
  Map,
  Users,
  Euro,
  ThermometerSun,
} from "lucide-react"

export const metadata = {
  title: "Características | PlanDeViajeAMedida",
  description: "Descubre todas las características de nuestra plataforma de personalización de viajes",
}

export default function CaracteristicasPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Características de PlanDeViajeAMedida</h1>
          <p className="text-lg text-muted-foreground">
            Descubre todas las herramientas que tenemos para hacer de tu agencia de viajes un referente en el sector
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Itinerarios personalizados
              </CardTitle>
              <CardDescription>Crea rutas adaptadas a las necesidades de tus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Genera itinerarios detallados por día, con recomendaciones de lugares para visitar, restaurantes y
                actividades, todo adaptado a las preferencias específicas de cada cliente.
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
                Nuestros itinerarios se adaptan automáticamente a las condiciones climáticas previstas para cada día del
                viaje, sugiriendo actividades adecuadas según el tiempo.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Visualización en mapa
              </CardTitle>
              <CardDescription>Muestra la ruta de forma interactiva</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Visualiza todos los puntos de interés del itinerario en un mapa interactivo, para entender mejor las
                distancias y planificar los desplazamientos de manera eficiente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileDown className="h-5 w-5 text-primary" />
                Exportación a PDF
              </CardTitle>
              <CardDescription>Entrega documentos profesionales a tus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Exporta los itinerarios en formato PDF con un diseño profesional y personalizado con tu marca, ideal
                para entregar a tus clientes o compartir digitalmente.
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
                para futuras referencias o para reutilizar ideas.
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
                hoteles y restaurantes antes de incluirlos en tus recomendaciones.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Edición personalizada
              </CardTitle>
              <CardDescription>Modifica los itinerarios a tu gusto</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Edita y personaliza cualquier aspecto de los itinerarios generados, añadiendo tus propias notas, lugares
                o modificando los horarios según tu experiencia profesional.
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
                costos según el tamaño del grupo, desde viajeros solitarios hasta grandes grupos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                Presupuesto personalizado
              </CardTitle>
              <CardDescription>Planifica según el presupuesto del cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Define el presupuesto del cliente y obtén un itinerario adaptado a él, con recomendaciones de
                actividades y alojamientos que se ajusten a sus posibilidades económicas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Generación con IA
              </CardTitle>
              <CardDescription>Tecnología de vanguardia</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Utilizamos los modelos de IA más avanzados para generar itinerarios que no solo son precisos, sino que
                también tienen en cuenta factores sutiles como el estilo de viaje y preferencias culturales.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Verificación de lugares
              </CardTitle>
              <CardDescription>Garantía de calidad</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Todos los lugares recomendados son verificados automáticamente para confirmar su existencia, ubicación
                exacta y disponibilidad, evitando sorpresas desagradables durante el viaje.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Optimización de tiempos
              </CardTitle>
              <CardDescription>Itinerarios eficientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Nuestro algoritmo calcula los tiempos de desplazamiento entre puntos de interés para crear itinerarios
                realistas y bien equilibrados, maximizando la experiencia del viajero.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
