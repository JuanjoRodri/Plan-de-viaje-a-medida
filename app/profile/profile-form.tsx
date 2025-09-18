"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"

export default function ProfileForm() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validaciones básicas
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: "error", text: "Todos los campos son obligatorios" })
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas nuevas no coinciden" })
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres" })
      setLoading(false)
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: "error", text: "La nueva contraseña debe ser diferente a la actual" })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Contraseña cambiada exitosamente" })
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setMessage({ type: "error", text: data.error || "Error al cambiar la contraseña" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error de conexión. Inténtalo de nuevo." })
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Contraseña Actual</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPasswords.current ? "text" : "password"}
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            placeholder="Ingresa tu contraseña actual"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility("current")}
          >
            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">Nueva Contraseña</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            placeholder="Ingresa tu nueva contraseña"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility("new")}
          >
            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Mínimo 6 caracteres</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirma tu nueva contraseña"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility("confirm")}
          >
            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Cambiando..." : "Cambiar Contraseña"}
      </Button>
    </form>
  )
}
