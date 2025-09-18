import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AdminUsersList from "./users-list"
import AdminItinerariesList from "./itineraries-list"
import AdminDashboard from "./dashboard"
import HomeButton from "./client-button"
import AdminSharedLinksList from "./shared-links-list"
import BoostRequestsList from "./boost-requests-list"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  // Verificar si hay sesión
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // Verificar si el usuario es administrador
  if (session.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <HomeButton />
      </div>
      <p className="text-gray-600 mb-6">Bienvenido, {session.name}</p>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="itineraries">Itinerarios</TabsTrigger>
          <TabsTrigger value="shared_links">Enlaces Compartidos</TabsTrigger>
          <TabsTrigger value="boost_requests">Solicitudes Boost</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6">
          <AdminDashboard />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
            <AdminUsersList />
          </div>
        </TabsContent>
        <TabsContent value="itineraries" className="mt-6">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">Gestión de Itinerarios</h2>
            <AdminItinerariesList />
          </div>
        </TabsContent>
        <TabsContent value="shared_links" className="mt-6">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">Gestión de Enlaces Compartidos</h2>
            <AdminSharedLinksList />
          </div>
        </TabsContent>
        <TabsContent value="boost_requests" className="mt-6">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">Solicitudes de Boost</h2>
            <BoostRequestsList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
