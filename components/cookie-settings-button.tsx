"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { Card } from "@/components/ui/card"

export function CookieSettingsButton() {
  const [showSettings, setShowSettings] = useState(false)

  const resetCookieConsent = () => {
    localStorage.removeItem("cookie-consent")
    localStorage.removeItem("cookie-consent-date")
    window.location.reload()
  }

  return (
    <>
      <Button
        onClick={() => setShowSettings(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-30 bg-white shadow-lg border-amber-200"
      >
        <Settings className="h-4 w-4 mr-2" />
        Cookies
      </Button>

      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowSettings(false)} />
          <Card className="fixed bottom-20 right-4 z-50 p-4 bg-white shadow-xl max-w-sm">
            <h3 className="font-semibold mb-3">Configuración de Cookies</h3>
            <p className="text-sm text-gray-600 mb-4">
              Puedes cambiar tus preferencias de cookies en cualquier momento.
            </p>
            <div className="space-y-2">
              <Button onClick={resetCookieConsent} variant="outline" size="sm" className="w-full">
                Cambiar preferencias
              </Button>
              <Button onClick={() => setShowSettings(false)} variant="ghost" size="sm" className="w-full">
                Cerrar
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  )
}
