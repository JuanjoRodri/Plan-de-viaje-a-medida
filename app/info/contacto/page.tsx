import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Mail, Phone, Clock } from "lucide-react"
import ContactForm from "./contact-form"

export const metadata = {
  title: "Contacto | PlanDeViajeAMedida",
  description: "Ponte en contacto con nosotros para más información",
}

export default function ContactoPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Contacto</h1>
          <p className="text-lg text-muted-foreground">¿Tienes alguna pregunta? Estamos aquí para ayudarte</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Formulario de contacto */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Envíanos un mensaje</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Información de contacto */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-sm text-gray-600">Valencia, España</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-600">info@plandeviajeamedida.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-sm text-gray-600">+34 687920394</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Horario de atención</p>
                    <p className="text-sm text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
                    <p className="text-sm text-gray-600">Sábados: 10:00 - 14:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
