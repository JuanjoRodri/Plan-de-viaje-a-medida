"use client"

import { Button } from "@/components/ui/button"

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <Button onClick={handleLogout} variant="outline">
      Cerrar Sesión
    </Button>
  )
}
