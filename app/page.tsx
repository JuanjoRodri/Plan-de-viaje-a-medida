import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import ClientHomePage from "./ClientHomePage"

export default function HomePage() {
  // Verificar si hay sesión
  const sessionCookie = cookies().get("session")?.value

  console.log("HOME - Cookie de sesión:", sessionCookie ? "ENCONTRADA" : "NO ENCONTRADA")

  if (!sessionCookie) {
    console.log("HOME - Redirigiendo a login por falta de sesión")
    redirect("/login")
  }

  console.log("HOME - Mostrando página principal")
  // Si hay sesión, mostrar la página principal
  return <ClientHomePage />
}
