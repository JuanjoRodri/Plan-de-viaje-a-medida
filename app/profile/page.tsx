import { Suspense } from "react"
import { getAuthUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProfileForm from "./profile-form"
import BusinessInfoForm from "./business-info-form"
import LogoUploadSection from "./logo-upload-section"
import BoostRequestSection from "./boost-request-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SimpleItineraryCounter } from "@/app/services/simple-itinerary-counter"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

async function ProfileContent() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  // Obtener el estado detallado y corregido del usuario
  const userStatus = await SimpleItineraryCounter.getUserStatus(user.id)

  const boostUserData = {
    id: user.id,
    email: user.email,
    name: user.name,
    monthly_itinerary_limit: userStatus.totalAvailable,
    itineraries_created_this_month: userStatus.used,
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Inicio
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground mt-2">Gestiona tu cuenta y preferencias</p>
          </div>
          <div className="w-[120px]"></div> {/* Spacer para centrar el título */}
        </div>

        {/* Información de uso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Uso de Itinerarios
              <Badge variant={userStatus.percentage > 95 ? "destructive" : "secondary"}>
                {userStatus.used} / {userStatus.totalAvailable}
              </Badge>
            </CardTitle>
            <CardDescription>Tu consumo total sobre el total de itinerarios disponibles este mes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progreso total del mes</span>
                <span>{userStatus.percentage}%</span>
              </div>
              <Progress value={userStatus.percentage} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold text-lg">
                  {Math.min(userStatus.used, userStatus.baseLimit)}/{userStatus.baseLimit}
                </div>
                <div className="text-muted-foreground">Plan Base</div>
              </div>

              {userStatus.hasActiveBoosts && (
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/50 rounded-lg">
                  <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {Math.max(0, Math.min(userStatus.used - userStatus.baseLimit, userStatus.boostAmount))}/
                    {userStatus.boostAmount}
                  </div>
                  <div className="text-green-600 dark:text-green-500 text-xs">Boosts Activos</div>
                </div>
              )}

              {userStatus.initialSaved > 0 && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                  <div className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                    {userStatus.consumedFromSaved}/{userStatus.initialSaved}
                  </div>
                  <div className="text-blue-600 dark:text-blue-500 text-xs">Itinerarios Guardados</div>
                </div>
              )}
            </div>

            {userStatus.initialSaved > 0 && (
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/50 p-2 rounded">
                💾 Tienes <strong>{userStatus.remainingSaved} itinerarios guardados</strong> restantes del mes anterior.
                Se consumen después de tu plan mensual.
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="business">Negocio</TabsTrigger>
            <TabsTrigger value="boost">Boost</TabsTrigger>
            <TabsTrigger value="logo">Logo</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información personal y preferencias de cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Negocio</CardTitle>
                <CardDescription>Configura la información de tu agencia de viajes</CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessInfoForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boost" className="space-y-6">
            <BoostRequestSection user={boostUserData} />
          </TabsContent>

          <TabsContent value="logo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo de la Empresa</CardTitle>
                <CardDescription>Sube el logo de tu agencia para personalizar los itinerarios</CardDescription>
              </CardHeader>
              <CardContent>
                <LogoUploadSection user={user} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Cargando perfil...</div>}>
      <ProfileContent />
    </Suspense>
  )
}
