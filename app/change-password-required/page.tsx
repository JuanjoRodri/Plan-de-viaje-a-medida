"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, AlertTriangle } from "lucide-react"

interface TempUser {
  id: string
  email: string
  name: string
  requirePasswordChange: boolean
  timestamp: number
}

export default function ChangePasswordRequiredPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tempUser, setTempUser] = useState<TempUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Verificar sessionStorage al cargar la página
    const tempUserData = sessionStorage.getItem("tempUser")

    if (!tempUserData) {
      console.log("No temp user data found, redirecting to login")
      router.push("/login")
      return
    }

    try {
      const userData: TempUser = JSON.parse(tempUserData)

      // Verificar que los datos sean válidos y no muy antiguos (30 minutos)
      const isExpired = Date.now() - userData.timestamp > 30 * 60 * 1000

      if (!userData.requirePasswordChange || isExpired) {
        console.log("Invalid or expired temp user data, redirecting to login")
        sessionStorage.removeItem("tempUser")
        router.push("/login")
        return
      }

      setTempUser(userData)
      console.log("Temp user data loaded:", userData.email)
    } catch (error) {
      console.error("Error parsing temp user data:", error)
      sessionStorage.removeItem("tempUser")
      router.push("/login")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!tempUser) {
      setError("Sesión expirada. Por favor, inicia sesión nuevamente.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/change-password-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
          userId: tempUser.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("Password changed successfully")

        // Limpiar sessionStorage
        sessionStorage.removeItem("tempUser")

        // Establecer cookie de sesión normal
        const sessionData = {
          id: tempUser.id,
          email: tempUser.email,
          name: tempUser.name,
          role: data.user?.role || "user",
        }

        // Establecer cookie manualmente
        const expires = new Date()
        expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000) // 24 horas
        document.cookie = `session=${JSON.stringify(sessionData)}; expires=${expires.toUTCString()}; path=/`

        // Redirigir a la página principal
        router.push("/")
      } else {
        setError(data.error || "Error al cambiar la contraseña")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras se verifica sessionStorage
  if (!tempUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Lock className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Cambio de Contraseña Obligatorio</CardTitle>
          <CardDescription>
            Hola {tempUser.name}, por seguridad debes cambiar tu contraseña antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Lock className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando contraseña...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Esta es una medida de seguridad obligatoria.</p>
            <p>No podrás acceder a la aplicación hasta cambiar tu contraseña.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
