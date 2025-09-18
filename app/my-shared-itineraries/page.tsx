import { getUser } from "@/lib/auth"
import SharedItinerariesList from "./shared-itineraries-list"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MySharedItinerariesPage() {
  const user = await getUser()

  console.log("Usuario obtenido en MySharedItinerariesPage:", user)

  if (!user) {
    redirect("/login?redirect_to=/my-shared-itineraries")
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mis Itinerarios Compartidos</h1>
        <Link href="/" className="mt-4 sm:mt-0">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Volver al Inicio
          </Button>
        </Link>
      </div>
      <SharedItinerariesList userId={user.id} />
    </div>
  )
}
