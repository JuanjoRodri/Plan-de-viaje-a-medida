"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Menu, Briefcase, UserCircle, LogOut, Settings, ListChecks, Calendar } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  name: string
  role: string
  monthly_itinerary_limit: number
  monthly_itineraries_used: number
  remaining_itineraries: number
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true)
      try {
        const userRes = await fetch("/api/auth/me")
        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.user)
          setIsAdmin(userData.user?.role === "admin")
        } else {
          setUser(null)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        setUser(null)
        setIsAdmin(false)
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUser()
  }, [pathname])

  // Función para refrescar los datos del usuario (útil después de crear un itinerario)
  const refreshUserData = async () => {
    try {
      const userRes = await fetch("/api/auth/me")
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
    }
  }

  // Exponer la función globalmente para que otros componentes puedan usarla
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).refreshNavbarUserData = refreshUserData
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      setIsAdmin(false)
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      router.push("/login")
      router.refresh()
      if (isSheetOpen) closeSheet()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const navLinks = [
    { href: "/", label: "Inicio", icon: Briefcase },
    { href: "/my-shared-itineraries", label: "Mis Itinerarios Compartidos", icon: ListChecks, authRequired: true },
  ]

  const adminLinks = [{ href: "/admin", label: "Admin", icon: Settings, authRequired: true, adminRequired: true }]

  const closeSheet = () => setIsSheetOpen(false)

  const renderNavLink = (link: any, isMobile = false) => {
    if (link.authRequired && !user) return null
    if (link.adminRequired && !isAdmin) return null

    const isActive = pathname === link.href
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
       ${
         isActive
           ? "bg-primary text-primary-foreground"
           : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
       }
       ${isMobile ? "w-full justify-start" : ""}`}
        onClick={isMobile ? closeSheet : undefined}
      >
        <link.icon className="h-4 w-4" />
        {link.label}
      </Link>
    )
  }

  const renderItineraryCounter = (isMobile = false) => {
    if (!user) return null

    const isLowRemaining = user.remaining_itineraries <= 2
    const isNoRemaining = user.remaining_itineraries === 0

    return (
      <div className={`flex items-center gap-2 ${isMobile ? "px-3 py-2" : ""}`}>
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">Este mes:</span>
          <Badge variant={isNoRemaining ? "destructive" : isLowRemaining ? "secondary" : "outline"} className="text-xs">
            {user.monthly_itineraries_used}/{user.monthly_itinerary_limit}
          </Badge>
          {user.remaining_itineraries > 0 && (
            <span className="text-xs text-muted-foreground">({user.remaining_itineraries} restantes)</span>
          )}
          {user.remaining_itineraries === 0 && (
            <span className="text-xs text-destructive font-medium">(límite alcanzado)</span>
          )}
        </div>
      </div>
    )
  }

  if (isLoadingUser) {
    return (
      <nav className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse md:hidden"></div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div></div>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => renderNavLink(link))}
            {adminLinks.map((link) => renderNavLink(link))}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                {renderItineraryCounter()}
                <div className="flex items-center gap-2">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      {user.name?.split(" ")[0] || user.email?.split("@")[0] || "Usuario"}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <LogOut className="h-4 w-4" />
                    Salir
                  </Button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="hidden md:block">
                <Button variant="outline" size="sm">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xs">
                <div className="p-4">
                  <div className="mb-6"></div>

                  {user && <div className="mb-4 p-3 bg-muted rounded-lg">{renderItineraryCounter(true)}</div>}

                  <div className="space-y-1">
                    {navLinks.map((link) => renderNavLink(link, true))}
                    {adminLinks.map((link) => renderNavLink(link, true))}
                    {user && (
                      <>
                        <hr className="my-2" />
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full justify-start"
                          onClick={closeSheet}
                        >
                          <UserCircle className="h-4 w-4" />
                          Mi Perfil ({user.name?.split(" ")[0] || user.email?.split("@")[0] || "Usuario"})
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full justify-start"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
                        </Button>
                      </>
                    )}
                    {!user && (
                      <Link
                        href="/login"
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full justify-start"
                        onClick={closeSheet}
                      >
                        <UserCircle className="h-4 w-4" />
                        Iniciar Sesión
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
