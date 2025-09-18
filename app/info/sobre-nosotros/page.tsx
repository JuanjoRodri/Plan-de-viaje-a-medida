import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export const metadata = {
  title: "Sobre Nosotros | PlanDeViajeAMedida",
  description: "Conoce al equipo detrás de PlanDeViajeAMedida",
}

export default function SobreNosotrosPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Sobre Nosotros</h1>
          <p className="text-lg text-muted-foreground">
            Conoce al equipo detrás de PlanDeViajeAMedida y nuestra historia
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Nuestra Historia</h2>
          <div className="prose max-w-none">
            <p>
              PlanDeViajeAMedida nació en 2023 en Valencia, fruto de la pasión por los viajes y la tecnología de sus
              fundadores, Juanjo y Angela. Tras años trabajando en el sector turístico, identificaron un problema común:
              las agencias de viajes invertían demasiado tiempo creando itinerarios personalizados, un proceso que podía
              automatizarse con la tecnología adecuada.
            </p>
            <p className="mt-4">
              Combinando la experiencia en viajes de Angela con los conocimientos técnicos de Juanjo en inteligencia
              artificial, desarrollaron una plataforma capaz de generar itinerarios detallados y personalizados en
              cuestión de segundos, permitiendo a las agencias de viajes ofrecer un servicio de mayor calidad en menos
              tiempo.
            </p>
            <p className="mt-4">
              Lo que comenzó como un proyecto entre dos apasionados del turismo y la tecnología, se ha convertido en una
              herramienta indispensable para agencias de viajes que buscan diferenciarse en un mercado cada vez más
              competitivo.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Nuestro Equipo</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image src="https://www.freepik.es/fotos-vectores-gratis/avatar-moreno" alt="Juanjo - Co-fundador" fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-2">Juanjo</h3>
                <p className="text-blue-600 font-medium mb-3">Co-fundador & CTO</p>
                <p className="text-sm text-gray-600 mb-4">
                  Ingeniero especializado en inteligencia artificial y machine learning. Con más de 8 años de
                  experiencia en desarrollo de software, Juanjo lidera el desarrollo técnico de la plataforma y se
                  encarga de que la IA funcione de manera óptima para crear los mejores itinerarios.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Especialidades: IA, Machine Learning, APIs</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image src="https://www.freepik.es/fotos-vectores-gratis/avatar-mujer-morena/5" alt="Angela - Co-fundadora" fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-2">Angela</h3>
                <p className="text-blue-600 font-medium mb-3">Co-fundadora & CEO</p>
                <p className="text-sm text-gray-600 mb-4">
                  Licenciada en Turismo con más de 10 años de experiencia en agencias de viajes. Angela aporta el
                  conocimiento del sector y se encarga de las relaciones comerciales, asegurándose de que la plataforma
                  realmente resuelva las necesidades de las agencias de viajes.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Especialidades: Turismo, Ventas, Atención al cliente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Nuestra Misión</h2>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <p className="text-lg">
              <strong>Democratizar la creación de itinerarios personalizados</strong> para que cualquier agencia de
              viajes, independientemente de su tamaño, pueda ofrecer a sus clientes experiencias de viaje únicas y
              perfectamente adaptadas a sus necesidades.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Nuestros Valores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-bold mb-2">Precisión</h3>
              <p className="text-sm text-gray-600">
                Cada itinerario debe ser preciso, verificado y realista para garantizar la mejor experiencia al viajero.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-bold mb-2">Innovación</h3>
              <p className="text-sm text-gray-600">
                Utilizamos la tecnología más avanzada para mantenernos a la vanguardia del sector turístico.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-bold mb-2">Cercanía</h3>
              <p className="text-sm text-gray-600">
                Mantenemos una relación cercana y personal con nuestros clientes, entendiendo sus necesidades
                específicas.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-6">¿Por qué Valencia?</h2>
          <div className="flex items-start gap-4">
            <MapPin className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <div className="mb-6">
                <img
                  src="https://www.spain.info/export/sites/segtur/.content/imagenes/cabeceras-grandes/valencia/ciudad-artes-ciencias-valencia-c-luca-bravo-u-UyUjtbu5vj4.jpg"
                  alt="Vista de Valencia, España"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <p className="mb-4">
                Valencia no es solo nuestra ciudad natal, sino también un punto estratégico perfecto para entender el
                turismo mediterráneo. Desde aquí, hemos podido estudiar de primera mano los patrones de viaje de
                millones de turistas que visitan la Comunidad Valenciana cada año.
              </p>
              <p>
                La rica diversidad turística de Valencia - desde playas hasta montañas, pasando por patrimonio histórico
                y gastronomía de primer nivel - nos ha proporcionado el laboratorio perfecto para desarrollar y probar
                nuestra tecnología de creación de itinerarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
