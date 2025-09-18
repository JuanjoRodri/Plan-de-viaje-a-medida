"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Settings, Shield, BarChart3, Zap } from "lucide-react"
import Link from "next/link"

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  functional: boolean
  marketing: boolean
}

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: false,
    marketing: false,
  })

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
      marketing: true,
    }
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)

    // Activar Google Analytics si se acepta
    if (allAccepted.analytics && typeof window !== "undefined") {
      // @ts-ignore
      window.gtag?.("consent", "update", {
        analytics_storage: "granted",
      })
    }
  }

  const acceptSelected = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
    setShowSettings(false)

    // Configurar Google Analytics según preferencias
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.gtag?.("consent", "update", {
        analytics_storage: preferences.analytics ? "granted" : "denied",
      })
    }
  }

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
    }
    localStorage.setItem("cookie-consent", JSON.stringify(onlyNecessary))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
        <Card className="max-w-4xl mx-auto bg-white border-amber-200 shadow-2xl">
          <div className="p-6">
            {!showSettings ? (
              // Banner principal
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Respetamos tu privacidad</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar el contenido.
                      Puedes elegir qué cookies aceptar o{" "}
                      <Link href="/info/cookies" className="text-amber-600 hover:underline">
                        leer nuestra política completa
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button onClick={acceptAll} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Aceptar todas
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Personalizar
                  </Button>
                  <Button onClick={rejectAll} variant="ghost" className="text-gray-600 hover:bg-gray-100">
                    Solo necesarias
                  </Button>
                </div>
              </div>
            ) : (
              // Panel de configuración
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Configuración de Cookies</h3>
                  <Button onClick={() => setShowSettings(false)} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Cookies Necesarias */}
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Cookies Necesarias</h4>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Siempre activas</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Esenciales para el funcionamiento básico del sitio web, autenticación y seguridad.
                      </p>
                    </div>
                  </div>

                  {/* Cookies Analíticas */}
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Cookies Analíticas</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.analytics}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                analytics: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Google Analytics para entender cómo usas el sitio y mejorarlo.
                      </p>
                    </div>
                  </div>

                  {/* Cookies Funcionales */}
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Cookies Funcionales</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.functional}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                functional: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Recordar preferencias de idioma, configuración de interfaz y formularios.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button onClick={acceptSelected} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Guardar preferencias
                  </Button>
                  <Button
                    onClick={acceptAll}
                    variant="outline"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    Aceptar todas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
