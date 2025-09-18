import { redirect } from "next/navigation"
import { Sparkles } from "lucide-react"
import { getUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const RoadmapPage = async () => {
  const user = await getUser()

  // Verificar que el usuario esté autenticado y sea admin
  if (!user || user.role !== "admin") {
    redirect("/")
  }

  const implementedFeatures = [
    {
      name: "Formulario de viaje",
      description: "Interfaz para recopilar preferencias de viaje del usuario",
      tags: ["UI", "UX", "Formulario"],
    },
    {
      name: "Generación de itinerarios con IA",
      description: "Creación de itinerarios personalizados usando GPT-4o",
      tags: ["IA", "OpenAI", "Generación de contenido"],
    },
    {
      name: "Verificación de lugares con Google Places",
      description: "Verificación de la existencia y ubicación de lugares recomendados",
      tags: ["Google Places API", "Verificación", "Geolocalización"],
    },
    {
      name: "Integración con API del clima",
      description: "Obtención y visualización de pronósticos del tiempo para el destino",
      tags: ["OpenWeather API", "Clima", "Datos externos"],
    },
    {
      name: "Estimación de precios",
      description: "Cálculo aproximado de costos para restaurantes y atracciones",
      tags: ["Precios", "Estimación", "Presupuesto"],
    },
    {
      name: "Verificación de hoteles",
      description: "Validación de la existencia y ubicación de alojamientos",
      tags: ["Google Places API", "Hoteles", "Verificación"],
    },
    {
      name: "Enlaces a Google Maps",
      description: "Generación automática de enlaces a ubicaciones en Google Maps",
      tags: ["Google Maps", "Enlaces", "Navegación"],
    },
    {
      name: "Indicadores visuales de verificación",
      description: "Badges y estilos para distinguir lugares verificados y no verificados",
      tags: ["UI", "UX", "Feedback visual"],
    },
    {
      name: "Filtro de distancia básico",
      description: "Configuración de distancia máxima desde el alojamiento",
      tags: ["Filtros", "Distancia", "Personalización"],
    },
    {
      name: "Sistema de caché para Google Places",
      description: "Almacenamiento temporal de resultados para reducir llamadas a la API",
      tags: ["Optimización", "Caché", "Rendimiento"],
    },
    {
      name: "Análisis de sentimiento de lugares",
      description: "Evaluación de opiniones y reseñas para determinar la percepción general",
      tags: ["IA", "Análisis", "Reseñas"],
    },
    {
      name: "Vista de mapa de itinerario",
      description: "Visualización básica de los lugares del itinerario en un mapa",
      tags: ["Google Maps", "Visualización", "Geolocalización"],
    },
    {
      name: "Optimización de prompts de IA",
      description: "Mejora y estructuración de prompts para generar itinerarios más precisos",
      tags: ["IA", "Prompts", "Calidad"],
    },
    {
      name: "Adaptación por tipo de viaje",
      description: "Prompts y recomendaciones específicas según el tipo de viaje (familiar, romántico, aventura, etc.)",
      tags: ["IA", "Personalización", "Prompts"],
    },
    {
      name: "Sistema de autenticación",
      description: "Login y gestión de usuarios con roles (admin/usuario)",
      tags: ["Autenticación", "Seguridad", "Roles"],
    },
    {
      name: "Panel de administración",
      description: "Interfaz para gestionar usuarios e itinerarios",
      tags: ["Admin", "Gestión", "Dashboard"],
    },
  ]

  const inProgressFeatures = [
    {
      name: "Mejora de verificación de lugares",
      description: "Refinamiento del algoritmo de verificación para mayor precisión",
      tags: ["Google Places API", "Algoritmos", "Precisión"],
    },
    {
      name: "Manejo mejorado de errores",
      description: "Sistema robusto para gestionar fallos en APIs externas",
      tags: ["Errores", "Robustez", "UX"],
    },
    {
      name: "Mapa interactivo avanzado",
      description: "Mejora de la visualización con rutas y filtros interactivos",
      tags: ["Google Maps", "Interactividad", "UX"],
    },
    {
      name: "Caché de geocodificación",
      description: "Almacenamiento de coordenadas para reducir llamadas a la API",
      tags: ["Optimización", "Caché", "Geocodificación"],
    },
  ]

  const plannedFeatures = [
    {
      name: "Verificación en tiempo real",
      description: "Validación de lugares mientras el usuario escribe en el formulario",
      tags: ["UX", "Tiempo real", "Validación"],
      priority: "Alta",
    },
    {
      name: "Modo offline",
      description: "Funcionamiento básico sin conexión usando datos en caché",
      tags: ["Offline", "PWA", "Accesibilidad"],
      priority: "Baja",
    },
    {
      name: "Sistema de feedback",
      description: "Recopilación de opiniones de usuarios sobre los itinerarios generados",
      tags: ["Feedback", "UX", "Mejora continua"],
      priority: "Media",
    },
    {
      name: "Optimización para dispositivos móviles",
      description: "Mejora de la experiencia en smartphones y tablets",
      tags: ["Responsive", "Móvil", "UX"],
      priority: "Alta",
    },
    {
      name: "Exportación de itinerarios",
      description: "Opciones para exportar a PDF, calendario o compartir por email",
      tags: ["Exportación", "PDF", "Compartir"],
      priority: "Media",
    },
    {
      name: "Recomendaciones personalizadas",
      description: "Sugerencias basadas en preferencias y comportamiento del usuario",
      tags: ["IA", "Personalización", "Recomendaciones"],
      priority: "Alta",
    },
    {
      name: "Instrucciones para casos especiales",
      description:
        "Manejo de situaciones particulares como viajes con niños, movilidad reducida o restricciones alimentarias",
      tags: ["Accesibilidad", "Inclusión", "UX"],
      priority: "Media",
    },
    {
      name: "Sistema de retroalimentación para prompts",
      description: "Mecanismo para incorporar feedback de usuarios en la mejora continua de prompts de IA",
      tags: ["IA", "Feedback", "Mejora continua"],
      priority: "Alta",
    },
    {
      name: "Integración con redes sociales",
      description: "Compartir itinerarios en redes sociales y obtener recomendaciones de amigos",
      tags: ["Social", "Compartir", "Integración"],
      priority: "Baja",
    },
  ]

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Roadmap del Proyecto</h1>
        <p className="text-muted-foreground">Estado actual y planificación futura del Personalizador de Viajes</p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-600">✅ Implementadas</h2>
        <div className="grid gap-4">
          {implementedFeatures.map((feature, index) => (
            <div key={index} className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold">{feature.name}</h3>
              </div>
              <p className="text-gray-700 mb-2">{feature.description}</p>
              <div className="flex flex-wrap gap-1">
                {feature.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">🔄 En Progreso</h2>
        <div className="grid gap-4">
          {inProgressFeatures.map((feature, index) => (
            <div key={index} className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold">{feature.name}</h3>
              </div>
              <p className="text-gray-700 mb-2">{feature.description}</p>
              <div className="flex flex-wrap gap-1">
                {feature.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-orange-600">📋 Planificadas</h2>
        <div className="grid gap-4">
          {plannedFeatures.map((feature, index) => (
            <div key={index} className="border rounded-lg p-4 bg-orange-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Sparkles className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold">{feature.name}</h3>
                </div>
                {feature.priority && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      feature.priority === "Alta"
                        ? "bg-red-100 text-red-800"
                        : feature.priority === "Media"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Prioridad {feature.priority}
                  </span>
                )}
              </div>
              <p className="text-gray-700 mb-2">{feature.description}</p>
              <div className="flex flex-wrap gap-1">
                {feature.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default RoadmapPage
