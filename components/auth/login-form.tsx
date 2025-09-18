"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  // Cuenta regresiva para la redirección
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      window.location.href = "/"
    }
  }, [success, countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("Enviando solicitud de login...")
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Importante para las cookies
      })

      const data = await response.json()
      console.log("Respuesta recibida:", data)

      if (!response.ok) {
        setError(data.error || "Error al iniciar sesión")
        setLoading(false)
        return
      }

      console.log("Login exitoso, redirigiendo...")
      setSuccess(true)
      setLoading(false)

      // La redirección se maneja por el useEffect
    } catch (err) {
      console.error("Error en la solicitud:", err)
      setError("Error de conexión")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
            <AlertDescription>Login exitoso! Redirigiendo en {countdown} segundos...</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={success}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={success}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || success}>
            {loading ? "Iniciando sesión..." : success ? `Redirigiendo en ${countdown}s...` : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
