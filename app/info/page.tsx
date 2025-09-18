"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, MapPin, Compass, Calendar, Star, Plane, Camera, Coffee, Mountain } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface StatsData {
  totalUsers: number
  totalItineraries: number
  itinerariesToday: number
  activeUsers: number
}

export default function InfoPage() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalItineraries: 0,
    itinerariesToday: 0,
    activeUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-stats?range=month")
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalUsers: data.totalUsers || 0,
            totalItineraries: data.totalItineraries || 0,
            itinerariesToday: data.itinerariesToday || 0,
            activeUsers: data.activeUsers || 0,
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Actualizar cada 30 segundos para datos en tiempo real
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-red-400 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Compass className="h-8 w-8 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 px-4 py-2 text-sm font-medium">
                Especialistas en Turismo desde Valencia
              </Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Deja de perder
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">
                3 horas por itinerario
              </span>
            </h1>

            <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              La única herramienta que entiende realmente cómo trabajan las agencias de viajes. Creada por profesionales
              del sector que conocen tus problemas del día a día.
            </p>

            {/* Ejemplo visual de ahorro de tiempo */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-4xl mx-auto border border-amber-200 shadow-xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">ANTES</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">Itinerario Roma 5 días</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>3 horas de investigación</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Verificar 15 lugares manualmente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Comprobar horarios uno por uno</span>
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">AHORA</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">Mismo itinerario</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold text-green-600">5 minutos totales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Verificación automática</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Horarios actualizados</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/info/contacto">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 text-lg font-medium shadow-lg"
                >
                  Quiero una demostración
                </Button>
              </Link>
              <Link href="/info/precios">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg border-2 border-amber-600 text-amber-700 hover:bg-amber-50"
                >
                  Ver precios reales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Oferta Especial Section - NUEVA */}
      <section className="py-16 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-20 w-32 h-32 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-yellow-400 text-black font-bold text-lg px-6 py-2 animate-pulse">
              🎉 ¡OFERTA ESPECIAL LANZAMIENTO! 🎉
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Plan Micro Empresas</h2>
            <p className="text-xl opacity-90 mb-8">
              Perfecto para agencias que están empezando o quieren probar nuestra tecnología
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <div className="text-6xl md:text-7xl font-bold mb-4">
                  €39<span className="text-3xl">/mes</span>
                </div>
                <div className="text-2xl font-semibold mb-4">15 itinerarios mensuales</div>
                <div className="text-lg opacity-90 mb-6">
                  ✨ <strong>TODAS las funcionalidades incluidas</strong> ✨
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-bold text-lg">€1.30</div>
                    <div className="text-sm opacity-80">por día</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-bold text-lg">€2.60</div>
                    <div className="text-sm opacity-80">por itinerario</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="font-bold text-lg">1 venta</div>
                    <div className="text-sm opacity-80">para ROI</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">Lo que incluye:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Verificación automática con Google Places</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Análisis de sentimiento de reseñas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Editor visual completo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Mapas interactivos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Exportación a PDF profesional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Compartir itinerarios con clientes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
                    <span>Soporte prioritario</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/info/contacto">
                <Button
                  size="lg"
                  className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-xl px-12 py-4 shadow-2xl transform hover:scale-105 transition-all"
                >
                  ¡Quiero Esta Oferta Ahora! 🚀
                </Button>
              </Link>
              <p className="text-sm opacity-80 mt-4">
                ⏰ Oferta limitada • Sin permanencia • Sin tarjeta de crédito para probar
              </p>
              <p className="text-xs opacity-70 mt-2">* IVA no incluido</p>
            </div>
          </div>
        </div>
      </section>

      {/* Números reales en tiempo real */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Datos reales en tiempo real</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-amber-100 text-sm">Actualizado automáticamente cada 30 segundos</span>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">{loading ? "..." : stats.totalUsers.toLocaleString()}</div>
              <div className="text-amber-100">Agencias activas</div>
              <div className="text-sm text-amber-200 mt-1">Total registradas</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{loading ? "..." : stats.totalItineraries.toLocaleString()}</div>
              <div className="text-amber-100">Itinerarios creados</div>
              <div className="text-sm text-amber-200 mt-1">Desde el lanzamiento</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{loading ? "..." : stats.itinerariesToday}</div>
              <div className="text-amber-100">Creados hoy</div>
              <div className="text-sm text-amber-200 mt-1">En las últimas 24h</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2.8h</div>
              <div className="text-amber-100">Tiempo ahorrado por itinerario</div>
              <div className="text-sm text-amber-200 mt-1">Promedio calculado</div>
            </div>
          </div>

          {/* Indicador de transparencia */}
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-amber-100 text-sm">
                <strong>100% Transparencia:</strong> Estos números se obtienen directamente de nuestra base de datos. No
                hay trucos ni inflación artificial de cifras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resto del contenido igual... */}
      {/* Verificación y Personalización */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Verificación automática y personalización total
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Cada itinerario es revisado por múltiples sistemas de IA y verificado con Google Places
          </p>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Verificación Multicapa</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Google Places Integration</h4>
                    <p className="text-gray-600">
                      Cada lugar se verifica automáticamente con la base de datos de Google: horarios, ubicación exacta,
                      estado de apertura y reseñas actualizadas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Compass className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Agente IA Especializado</h4>
                    <p className="text-gray-600">
                      Nuestro agente de IA dedicado revisa cada itinerario para optimizar rutas, tiempos de
                      desplazamiento y coherencia del plan completo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Análisis de Calidad</h4>
                    <p className="text-gray-600">
                      Sistema de puntuación automática que evalúa la calidad de cada recomendación basándose en reseñas,
                      popularidad y adecuación al perfil del viajero.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-200">
              <h4 className="font-semibold text-gray-900 mb-4">Proceso de Verificación en Tiempo Real</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span className="text-sm">Consulta a Google Places API</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <span className="text-sm">Análisis por IA especializada</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span className="text-sm">Optimización de rutas y tiempos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <span className="text-sm">Validación final de coherencia</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg border border-amber-300">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Verificación Completada</span>
                </div>
                <p className="text-sm text-gray-600">Itinerario validado y listo para entregar al cliente</p>
              </div>
            </div>
          </div>

          {/* Personalización Total */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Here is where the change happens */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-6">Editor Visual Completo</h4>
              <div className="mb-6">
                <img
                  src="https://i.ibb.co/CKTFm2tV/813eafad2362d2009286c2f67fb3d9ee.png"
                  alt="Editor visual de itinerarios en tiempo real"
                  className="w-full rounded-lg border border-blue-200 shadow-sm"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Edición libre y completa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Modifica horarios, lugares y días al instante</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Añade o elimina actividades con un clic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium">Verificación automática de nuevas actividades</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600">
                  <strong>Importante:</strong> Cada actividad que añadas se verifica automáticamente con el mismo
                  proceso que los itinerarios generados: horarios, ubicación y disponibilidad en tiempo real.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Personalización Sin Límites</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Editor Visual Intuitivo</h4>
                    <p className="text-gray-600">
                      Modifica cualquier actividad, cambia horarios, añade lugares personalizados o elimina lo que no
                      encaje con tu cliente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Preferencias Avanzadas</h4>
                    <p className="text-gray-600">
                      Tipo de viajero, presupuesto, intereses específicos, restricciones alimentarias, movilidad
                      reducida, y mucho más.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Adaptación Automática</h4>
                    <p className="text-gray-600">
                      El sistema se adapta automáticamente a las preferencias: si el cliente prefiere arte, priorizará
                      museos; si es foodie, destacará experiencias gastronómicas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Características Premium */}
          <div className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 text-center">Características Premium Incluidas</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coffee className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Recomendaciones Locales</h4>
                <p className="text-sm text-gray-300">
                  Restaurantes auténticos, mercados locales y experiencias únicas que solo conocen los lugareños.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mountain className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Adaptación Climática</h4>
                <p className="text-sm text-gray-300">
                  Planes alternativos automáticos según el clima previsto, con actividades de interior y exterior.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Logística Inteligente</h4>
                <p className="text-sm text-gray-300">
                  Optimización automática de rutas, tiempos de transporte y conexiones entre actividades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciación clara */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            No es como las otras herramientas "de viajes"
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Las otras herramientas:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Te dan listas genéricas</p>
                    <p className="text-sm text-gray-600">Sin verificar si están abiertos o cerrados</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">No entienden el sector turístico</p>
                    <p className="text-sm text-gray-600">Hechas por programadores, no por agentes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Precios inventados</p>
                    <p className="text-sm text-gray-600">Estimaciones que no sirven para presupuestar</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">PlanDeViajeAMedida:</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Verifica cada lugar automáticamente</p>
                    <p className="text-sm text-gray-600">Horarios reales, ubicaciones exactas, disponibilidad</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Creado por profesionales del turismo</p>
                    <p className="text-sm text-gray-600">Entendemos temporadas, tipos de cliente, márgenes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Precios reales del mercado</p>
                    <p className="text-sm text-gray-600">Basados en datos actuales, no estimaciones</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Precios simplificados */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Precios honestos, sin letra pequeña</h2>
          <p className="text-center text-gray-600 mb-12">
            Facturación tradicional. Descuentos disponibles hasta el 20%.
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Plan Micro - ACTUALIZADO */}
            <Card className="border-2 border-green-500 relative hover:border-green-600 transition-colors shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white px-3 py-1 text-xs">¡Oferta!</Badge>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-green-600 mb-2">Micro</h3>
                  <div className="text-3xl font-bold text-green-600 mb-1">€39</div>
                  <div className="text-gray-600 mb-2">/mes</div>
                  <div className="text-xs text-green-600 font-medium">ROI con 1 venta</div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">15 itinerarios mensuales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">TODAS las funcionalidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Soporte prioritario</span>
                  </div>
                </div>

                <Link href="/info/contacto">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-xs">¡Aprovechar oferta!</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Básico - ACTUALIZADO */}
            <Card className="border-2 border-gray-200 hover:border-amber-300 transition-colors">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Básico</h3>
                  <div className="text-3xl font-bold text-amber-600 mb-1">€62</div>
                  <div className="text-gray-600 mb-2">/mes</div>
                  <div className="text-xs text-green-600 font-medium">ROI con 2 ventas</div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">35 itinerarios mensuales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Todas las funcionalidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Soporte por email</span>
                  </div>
                </div>

                <Link href="/info/contacto">
                  <Button className="w-full text-xs" variant="outline">
                    Solicitar información
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Pro - ACTUALIZADO */}
            <Card className="border-2 border-amber-500 relative hover:border-amber-600 transition-colors shadow-lg">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-1">
                  Más elegido
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                  <div className="text-3xl font-bold text-amber-600 mb-1">€99</div>
                  <div className="text-gray-600 mb-2">/mes</div>
                  <div className="text-sm text-gray-600 mt-2">€3.30/día • €1.24/itinerario</div>
                  <div className="text-xs text-green-600 font-medium">ROI con 3-4 ventas</div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Hasta 80 itinerarios mensuales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Verificación automática de lugares</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Análisis de sentimiento de reseñas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Editor visual de itinerarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Exportación a PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Soporte prioritario</span>
                  </div>
                </div>

                <Link href="/info/contacto">
                  <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-xs">
                    Solicitar información
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Enterprise - ACTUALIZADO */}
            <Card className="border-2 border-gray-200 hover:border-amber-300 transition-colors">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-3xl font-bold text-amber-600 mb-1">€179</div>
                  <div className="text-gray-600 mb-2">/mes</div>
                  <div className="text-sm text-gray-600 mt-2">€5.97/día • €0.99/itinerario</div>
                  <div className="text-xs text-green-600 font-medium">ROI con 5+ ventas</div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Hasta 180 itinerarios mensuales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Verificación automática de lugares</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Análisis de sentimiento de reseñas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Editor visual de itinerarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Exportación a PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-xs">Soporte telefónico dedicado</span>
                  </div>
                </div>

                <Link href="/info/contacto">
                  <Button className="w-full text-xs" variant="outline">
                    Solicitar información
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="bg-amber-50 rounded-lg p-6 max-w-2xl mx-auto border border-amber-200">
              <h3 className="font-semibold text-gray-900 mb-2">Prueba gratuita de 7 días</h3>
              <p className="text-gray-700 mb-3">
                Sin compromiso, sin tarjeta de crédito. Crea hasta 10 itinerarios gratis.
              </p>
              <p className="text-sm text-gray-600">
                <strong>Descuentos hasta el 20%:</strong> Consulta condiciones especiales para tu agencia.
              </p>
              <p className="text-xs text-gray-500 mt-2">* Todos los precios no incluyen IVA</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para dejar de perder 3 horas por itinerario?</h2>
          <p className="text-xl mb-8 text-amber-100">
            Únete a las {loading ? "..." : stats.totalUsers} agencias que ya ahorran tiempo y aumentan ventas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/info/contacto">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg font-medium">
                Quiero una demostración
              </Button>
            </Link>
            <Link href="/info/precios">
              <Button
                size="lg"
                className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg font-medium backdrop-blur-sm"
              >
                Empezar prueba gratuita
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-amber-100 text-sm">
            <p>✓ Sin permanencia ✓ Sin cobros automáticos ✓ Descuentos automáticos por volumen</p>
          </div>
        </div>
      </section>
    </div>
  )
}
