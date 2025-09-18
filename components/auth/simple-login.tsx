"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimpleLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState("")

  // Función para establecer cookie manualmente desde el cliente
  const setClientCookie = (name: string, value: string, days: number) => {
    let expires = ""
    if (days) {
      const date = new Date()
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
      expires = "; expires=" + date.toUTCString()
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/"
    console.log("CLIENT - Cookie establecida manualmente:", name)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("LOGIN - Enviando solicitud con email:", email)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Importante para incluir cookies
      })

      const data = await response.json()
      console.log("LOGIN - Respuesta recibida:", data)

      if (response.ok) {
        setSuccess(true)
        console.log("LOGIN - Login exitoso")

        // Verificar si necesita cambiar contraseña
        if (data.requirePasswordChange) {
          console.log("LOGIN - Usuario necesita cambiar contraseña, usando sessionStorage")

          // Guardar datos temporales en sessionStorage
          sessionStorage.setItem(
            "tempUser",
            JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              requirePasswordChange: true,
              timestamp: Date.now(),
            }),
          )

          setRedirectUrl("/change-password-required")
        } else {
          // Login normal - establecer cookie de sesión
          setClientCookie("session", JSON.stringify(data.user), 1)
          setRedirectUrl(data.redirectTo || "/")
        }

        // Esperar un momento para asegurar que se guarden los datos
        setTimeout(() => {
          console.log("LOGIN - Redirigiendo a:", data.redirectTo || "/change-password-required")
          window.location.href = data.redirectTo || "/change-password-required"
        }, 1000)
      } else {
        setError(data.error || "Error al iniciar sesión")
      }
    } catch (err) {
      console.error("LOGIN - Error:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Efecto para redirección
  useEffect(() => {
    if (success && redirectUrl) {
      const timer = setTimeout(() => {
        window.location.href = redirectUrl
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [success, redirectUrl])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Login exitoso! Redirigiendo...
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
