import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Funcionalidades | PlanDeViajeAMedida",
  description: "Explora las funcionalidades avanzadas de nuestra plataforma para agencias de viajes",
}

export default function FuncionalidadesPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Funcionalidades de PlanDeViajeAMedida</h1>
          <p className="text-lg text-muted-foreground">
            Descubre cómo nuestra plataforma revoluciona la creación de itinerarios personalizados
          </p>
        </div>

        {/* Generación de Itinerarios */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-2">Funcionalidad Principal</Badge>
              <h2 className="text-2xl font-bold mb-4">Generación de Itinerarios con IA</h2>
              <p className="mb-4">
                Nuestra tecnología de Inteligencia Artificial analiza miles de factores para crear itinerarios
                personalizados en cuestión de segundos. El sistema tiene en cuenta:
              </p>
              <ul className="space-y-2 list-disc pl-5 mb-4">
                <li>Preferencias del viajero (cultura, gastronomía, aventura, etc.)</li>
                <li>Duración del viaje y ritmo deseado (relajado o intenso)</li>
                <li>Presupuesto disponible</li>
                <li>Temporada y previsión meteorológica</li>
                <li>Distancias y tiempos de desplazamiento</li>
                <li>Horarios de apertura de atracciones</li>
              </ul>
              <p>
                El resultado es un itinerario día a día completamente personalizado, con tiempos estimados y
                recomendaciones específicas.
              </p>
            </div>
            <div className="relative h-[300px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://i.postimg.cc/Cx80XtTD/ai-travel-planning-png.jpg"
                alt="Generación de itinerarios con IA"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Verificación de Lugares */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-[300px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://i.postimg.cc/V6VHYfXN/tropical-beach-destination-png.jpg"
                alt="Verificación de lugares"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <Badge className="mb-2">Precisión Garantizada</Badge>
              <h2 className="text-2xl font-bold mb-4">Verificación Automática de Lugares</h2>
              <p className="mb-4">
                Cada lugar recomendado en nuestros itinerarios pasa por un riguroso proceso de verificación automática
                que incluye:
              </p>
              <ul className="space-y-2 list-disc pl-5 mb-4">
                <li>Confirmación de existencia mediante APIs de Google Places</li>
                <li>Verificación de coordenadas geográficas exactas</li>
                <li>Comprobación de horarios de apertura actualizados</li>
                <li>Análisis de reseñas y valoraciones recientes</li>
                <li>Estimación de precios y nivel de ocupación</li>
              </ul>
              <p>
                Esta verificación garantiza que tus clientes no se encontrarán con lugares cerrados, inexistentes o con
                información desactualizada.
              </p>
            </div>
          </div>
        </section>

        {/* Análisis de Sentimiento */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-2">Inteligencia Avanzada</Badge>
              <h2 className="text-2xl font-bold mb-4">Análisis de Sentimiento de Reseñas</h2>
              <p className="mb-4">
                Nuestra tecnología de procesamiento de lenguaje natural analiza miles de reseñas para determinar la
                percepción real de los viajeros sobre cada destino, hotel o restaurante:
              </p>
              <ul className="space-y-2 list-disc pl-5 mb-4">
                <li>Evaluación de opiniones en múltiples idiomas</li>
                <li>Detección de tendencias recientes (mejoras o deterioros)</li>
                <li>Identificación de puntos fuertes y débiles específicos</li>
                <li>Clasificación por tipo de viajero (familias, parejas, etc.)</li>
                <li>Alertas sobre problemas recurrentes mencionados</li>
              </ul>
              <p>
                Este análisis te permite recomendar lugares con confianza, conociendo de antemano la experiencia real
                que tendrán tus clientes.
              </p>
            </div>
            <div className="relative h-[300px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://i.postimg.cc/4Nhjx9LR/mountain-landscape-hiking-png.jpg"
                alt="Análisis de sentimiento"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Integración Meteorológica */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative h-[300px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://i.postimg.cc/gJkfzt5g/cultural-heritage-site-png.jpg"
                alt="Integración meteorológica"
                fill
                className="object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <Badge className="mb-2">Planificación Inteligente</Badge>
              <h2 className="text-2xl font-bold mb-4">Integración Meteorológica Avanzada</h2>
              <p className="mb-4">
                Nuestro sistema incorpora datos meteorológicos precisos para optimizar cada itinerario según las
                condiciones climáticas previstas:
              </p>
              <ul className="space-y-2 list-disc pl-5 mb-4">
                <li>Previsión meteorológica para cada día del viaje</li>
                <li>Recomendación automática de actividades interiores en días lluviosos</li>
                <li>Sugerencia de visitas a playas o parques en días soleados</li>
                <li>Alertas sobre condiciones extremas (olas de calor, tormentas)</li>
                <li>Adaptación de horarios según temperaturas (visitas temprano en días calurosos)</li>
              </ul>
              <p>
                Esta funcionalidad garantiza que tus clientes aprovecharán al máximo cada día de su viaje,
                independientemente del clima.
              </p>
            </div>
          </div>
        </section>

        {/* Exportación y Personalización */}
        <section>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-2">Experiencia Profesional</Badge>
              <h2 className="text-2xl font-bold mb-4">Exportación y Personalización de Marca</h2>
              <p className="mb-4">
                Entrega itinerarios con aspecto profesional y personalizados con la identidad visual de tu agencia:
              </p>
              <ul className="space-y-2 list-disc pl-5 mb-4">
                <li>Exportación a PDF con diseño elegante y profesional</li>
                <li>Personalización con tu logo, colores y datos de contacto</li>
                <li>Inclusión de notas personalizadas para cada cliente</li>
                <li>Opción de añadir recomendaciones especiales</li>
                <li>Posibilidad de compartir digitalmente o imprimir</li>
              </ul>
              <p>
                Tus clientes recibirán un documento de alta calidad que refleja la profesionalidad y atención al detalle
                de tu agencia.
              </p>
            </div>
            <div className="relative h-[300px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://i.postimg.cc/nLnW2wHn/european-city-architecture-png.jpg"
                alt="Exportación y personalización"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
