import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Shield, X } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Precios | PlanDeViajeAMedida",
  description: "Planes y precios para agencias de viajes",
}

export default function PreciosPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Planes y Precios</h1>
          <p className="text-lg text-muted-foreground">
            Soluciones adaptadas a las necesidades de cada agencia de viajes
          </p>
          <Badge className="mt-4" variant="outline">
            Prueba gratuita sin compromiso
          </Badge>
        </div>

        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">🚀 ¡Oferta Especial para Micro Empresas!</h2>
            <p className="text-lg mb-3">
              <span className="font-bold text-3xl">39€/mes</span> - 15 itinerarios con TODAS las funcionalidades
            </p>
            <p className="text-sm opacity-90">
              Perfecto para agencias pequeñas que quieren acceso completo sin limitaciones
            </p>
            <p className="text-xs opacity-80 mt-2">* IVA no incluido</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="border-green-500 border-2 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">¡Oferta!</Badge>
            <CardHeader className="text-center">
              <CardTitle>Micro Empresas</CardTitle>
              <CardDescription>Todas las funciones, precio especial</CardDescription>
              <div className="text-3xl font-bold mt-4">
                €39<span className="text-sm font-normal">/mes</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">€1.30/día • €2.60/itinerario</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>15 itinerarios mensuales</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>TODAS las funcionalidades incluidas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Verificación automática de lugares</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Análisis de sentimiento de reseñas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Editor visual de itinerarios</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Exportación a PDF personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  <strong>ROI con 1 venta:</strong> Acceso completo sin limitaciones. Precio especial para micro
                  empresas.
                </p>
              </div>
              <Link href="/info/contacto">
                <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">¡Aprovechar Oferta!</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Básico</CardTitle>
              <CardDescription>Perfecto para empezar</CardDescription>
              <div className="text-3xl font-bold mt-4">
                €62<span className="text-sm font-normal">/mes</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">€2.07/día • €1.77/itinerario</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Hasta 35 itinerarios mensuales</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Verificación automática de lugares</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Análisis de sentimiento de reseñas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Editor visual de itinerarios</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Exportación a PDF</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Soporte por email</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  <strong>ROI con 2 ventas:</strong> Excelente relación calidad-precio: €1.77 por itinerario generado.
                </p>
              </div>
              <Link href="/info/contacto">
                <Button className="w-full mt-4 bg-transparent" variant="outline">
                  Solicitar información
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">Más popular</Badge>
            <CardHeader className="text-center">
              <CardTitle>Pro</CardTitle>
              <CardDescription>El más elegido por las agencias</CardDescription>
              <div className="text-3xl font-bold mt-4">
                €99<span className="text-sm font-normal">/mes</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">€3.30/día • €1.24/itinerario</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Hasta 80 itinerarios mensuales</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Verificación automática de lugares</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Análisis de sentimiento de reseñas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Editor visual de itinerarios</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Exportación a PDF</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  <strong>ROI con 3-4 ventas:</strong> Solo €1.24 por itinerario. El más elegido por las agencias.
                </p>
              </div>
              <Link href="/info/contacto">
                <Button className="w-full mt-4">Solicitar información</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Para agencias de alto volumen</CardDescription>
              <div className="text-3xl font-bold mt-4">
                €179<span className="text-sm font-normal">/mes</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">€5.97/día • €0.99/itinerario</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Hasta 180 itinerarios mensuales</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Verificación automática de lugares</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Análisis de sentimiento de reseñas</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Editor visual de itinerarios</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Exportación a PDF</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  <span>Soporte telefónico dedicado</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  <strong>ROI con 5+ ventas:</strong> Solo €0.99 por itinerario. Perfecto para alto volumen de trabajo.
                </p>
              </div>
              <Link href="/info/contacto">
                <Button className="w-full mt-4 bg-transparent" variant="outline">
                  Solicitar información
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-gray-500">* Todos los precios no incluyen IVA</p>
        </div>

        <div className="bg-green-50 p-8 rounded-lg border-2 border-green-200 mb-12">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 mr-3 text-green-600" />
            <h2 className="text-2xl font-bold text-green-800">Sin tarjetas bancarias • Sin cobros automáticos</h2>
          </div>

          <div className="bg-white p-6 rounded-lg border border-green-200 mb-6">
            <h3 className="text-xl font-semibold text-green-800 mb-3">✅ Facturación tradicional y transparente</h3>
            <p className="text-gray-700 mb-4">
              Entendemos que las agencias de viaje necesitan control total sobre sus gastos. Por eso trabajamos con un
              sistema de facturación tradicional, sin sorpresas ni cobros inesperados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <Check className="h-5 w-5 mr-2" />
                Lo que SÍ hacemos:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>Factura mensual por email</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>Transferencia bancaria cuando te convenga</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>Recibo oficial para tu contabilidad</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>Flexibilidad según temporada alta/baja</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  <span>Sin permanencia ni penalizaciones</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center">
                <X className="h-5 w-5 mr-2" />
                Lo que NO hacemos:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-600" />
                  <span>Cobros automáticos con tarjeta</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-600" />
                  <span>Cargos inesperados o ocultos</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-600" />
                  <span>Domiciliaciones bancarias</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-600" />
                  <span>Comisiones por transferencia</span>
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 mr-2 text-red-600" />
                  <span>Contratos de permanencia</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-6">
            <h3 className="font-semibold text-blue-800 mb-3">📋 Proceso simple en 4 pasos:</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                  1
                </div>
                <p>Recibes factura por email a final de mes</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                  2
                </div>
                <p>Realizas transferencia cuando mejor te convenga</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                  3
                </div>
                <p>Te enviamos recibo oficial inmediatamente</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold">
                  4
                </div>
                <p>Sigues usando la plataforma sin interrupciones</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-8 rounded-lg border-2 border-orange-200 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-orange-800 mb-4">🚀 Boosteos de Itinerarios</h2>
            <p className="text-gray-700 mb-6">
              ¿Necesitas más itinerarios este mes? ¡Selecciona la cantidad exacta que necesites!
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="border-orange-300 border-2 bg-white">
              <CardHeader className="text-center">
                <CardTitle className="text-orange-800">Paquetes Boost Fijos</CardTitle>
                <CardDescription>Elige entre 4 paquetes predefinidos</CardDescription>
                <div className="text-2xl font-bold mt-4 text-orange-600">Precios escalonados</div>
                <div className="text-sm text-gray-600 mt-2">Disponible al instante • Sin máximo de boosts</div>
                <div className="text-xs text-gray-500 mt-1">* IVA no incluido</div>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-orange-800 mb-2">Paquetes disponibles:</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      • <span className="font-semibold">Paquete 5:</span> 5 itinerarios a €3.00 c/u ={" "}
                      <span className="font-bold text-orange-600">€15.00</span>
                    </div>
                    <div>
                      • <span className="font-semibold">Paquete 10:</span> 10 itinerarios a €2.90 c/u ={" "}
                      <span className="font-bold text-orange-600">€29.00</span>
                    </div>
                    <div>
                      • <span className="font-semibold">Paquete 15:</span> 15 itinerarios a €2.75 c/u ={" "}
                      <span className="font-bold text-orange-600">€41.25</span>
                    </div>
                    <div>
                      • <span className="font-semibold">Paquete 20:</span> 20 itinerarios a €2.50 c/u ={" "}
                      <span className="font-bold text-orange-600">€50.00</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Hay 4 paquetes disponibles y tú eliges el que necesites.</p>
                </div>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-orange-600" />
                    <span>Se añaden inmediatamente a tu cuenta</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-orange-600" />
                    <span>No caducan (se usan cuando los necesites)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-orange-600" />
                    <span>Compatible con todos los planes</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-orange-600" />
                    <span>Sin límite de boosts mensuales</span>
                  </li>
                </ul>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>Paquetes fijos:</strong> Elige el paquete que mejor se adapte a tus necesidades mensuales.
                  </p>
                </div>
                <Link href="/info/contacto">
                  <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700">Solicitar Boost</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-white p-6 rounded-lg border border-orange-200 max-w-2xl mx-auto">
              <h3 className="font-semibold text-orange-800 mb-3">💡 ¿Cómo funcionan los Boosteos?</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-orange-600">1</span>
                  </div>
                  <p>
                    <strong>Seleccionas</strong>
                    <br />
                    Elige de 1 a 20 itinerarios según tus necesidades
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-orange-600">2</span>
                  </div>
                  <p>
                    <strong>Pagas</strong>
                    <br />
                    Transferencia según precios escalonados
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <span className="font-bold text-orange-600">3</span>
                  </div>
                  <p>
                    <strong>Activamos</strong>
                    <br />
                    Itinerarios disponibles al instante
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-8 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold mb-4">Preguntas frecuentes sobre precios</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">¿Qué incluye la prueba gratuita?</h3>
              <p className="text-sm text-gray-600">
                La prueba gratuita incluye acceso completo a todas las funcionalidades de la plataforma con un número
                limitado de itinerarios para que puedas evaluar el sistema sin compromiso.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Hay algún costo de configuración inicial?</h3>
              <p className="text-sm text-gray-600">
                No, no cobramos ninguna tarifa de configuración. El precio mensual incluye todo lo necesario para
                comenzar a utilizar la plataforma de inmediato.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Qué sucede si supero el límite de itinerarios de mi plan?</h3>
              <p className="text-sm text-gray-600">
                Te notificaremos cuando estés cerca de alcanzar tu límite. Si lo superas, tendrás la opción de comprar
                itinerarios adicionales para continuar trabajando sin interrupciones.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Todos los planes tienen las mismas funcionalidades?</h3>
              <p className="text-sm text-gray-600">
                Sí, todos los planes incluyen las mismas funcionalidades core: verificación de lugares, análisis de
                sentimiento, editor visual, exportación PDF y precios reales. Solo cambia el número de itinerarios y el
                nivel de soporte.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Cómo funcionan los Boosteos de itinerarios adicionales?</h3>
              <p className="text-sm text-gray-600">
                Los Boosteos te permiten elegir entre 4 paquetes fijos: 5 itinerarios (€15), 10 itinerarios (€29), 15
                itinerarios (€41.25) o 20 itinerarios (€50). Se añaden inmediatamente a tu cuenta y están disponibles
                hasta final de mes. Son compatibles con todos los planes y no hay límite en la cantidad de boosts que
                puedes solicitar.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿La oferta de Micro Empresas tiene alguna limitación?</h3>
              <p className="text-sm text-gray-600">
                No, la oferta de Micro Empresas incluye TODAS las funcionalidades de la plataforma: verificación de
                lugares, análisis de sentimiento, editor visual, exportación PDF personalizada y soporte prioritario. Es
                una oferta especial para empresas pequeñas que quieren acceso completo a precio reducido. Solo incluye
                15 itinerarios mensuales en lugar de más.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
