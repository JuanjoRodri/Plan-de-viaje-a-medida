"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, RefreshCw } from "lucide-react"

interface DiagnosticInfo {
  today: string
  yesterday: string
  todayCount: number
  yesterdayCount: number
  recentStats: Array<{ date: string; total_itineraries: number }>
  needsAggregation: boolean
}

export function DailyStatsManager() {
  const [loading, setLoading] = useState(false)
  const [diagnostic, setDiagnostic] = useState<DiagnosticInfo | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  const fetchDiagnostic = async () => {
    try {
      const response = await fetch("/api/admin/daily-aggregation")
      const data = await response.json()
      setDiagnostic(data.diagnostic)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error fetching diagnostic:", error)
    }
  }

  const forceAggregation = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/force-aggregation", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        alert("✅ Agregación ejecutada correctamente")
        await fetchDiagnostic() // Refrescar datos
      } else {
        alert("❌ Error en la agregación: " + data.message)
      }
    } catch (error) {
      console.error("Error forcing aggregation:", error)
      alert("❌ Error ejecutando agregación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Estadísticas Diarias
          </CardTitle>
          <CardDescription>Monitorea y gestiona la agregación de estadísticas diarias de itinerarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={fetchDiagnostic} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Diagnóstico
            </Button>
            <Button onClick={forceAggregation} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              {loading ? "Ejecutando..." : "Forzar Agregación"}
            </Button>
          </div>

          {lastUpdate && <p className="text-sm text-muted-foreground">Última actualización: {lastUpdate}</p>}

          {diagnostic && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{diagnostic.todayCount}</div>
                    <p className="text-xs text-muted-foreground">Itinerarios hoy ({diagnostic.today})</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{diagnostic.yesterdayCount}</div>
                    <p className="text-xs text-muted-foreground">Itinerarios ayer ({diagnostic.yesterday})</p>
                  </CardContent>
                </Card>
              </div>

              {diagnostic.needsAggregation && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    ⚠️ Se necesita agregación para ayer ({diagnostic.yesterday})
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Estadísticas Recientes:</h4>
                <div className="space-y-2">
                  {diagnostic.recentStats.map((stat) => (
                    <div key={stat.date} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{stat.date}</span>
                      <Badge variant="secondary">{stat.total_itineraries} itinerarios</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
