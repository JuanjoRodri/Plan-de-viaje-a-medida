import SimpleLogin from "@/components/auth/simple-login"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  // Si ya hay sesión, redirigir a la página principal
  const sessionCookie = cookies().get("session")?.value

  if (sessionCookie) {
    redirect("/")
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4 px-4 max-w-md mx-auto">
      {/* Sección para nuevos usuarios */}
      <div className="w-full text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">¿Eres nuevo aquí?</h2>
        <p className="text-gray-600">
          Si estás interesado en nuestros servicios de planificación de viajes personalizados, te invitamos a conocer
          más sobre nosotros.
        </p>
        <Link href="/info" className="block">
          <Button className="w-full py-3 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md">
            Visita nuestra web
          </Button>
        </Link>
      </div>

      {/* Divisor */}
      <div className="w-full flex items-center gap-4 my-1">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-500 font-medium">o</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* Sección de login */}
      <div className="w-full bg-white">
        <SimpleLogin />
      </div>

      {/* Sección de ayuda */}
      <div className="w-full text-center mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="font-semibold text-gray-700">¿Problemas para acceder?</h3>
        <p className="text-sm text-gray-600 mb-1">Si ya eres usuario y tienes problemas con el login, contáctanos:</p>
        <a
          href="mailto:info@plandeviajeamedida.com"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
        >
          📧 info@plandeviajeamedida.com
        </a>
      </div>
    </div>
  )
}
