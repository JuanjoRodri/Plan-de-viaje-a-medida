"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, MapPin, CalendarDays, TrendingUp } from "lucide-react" // MapPin y CalendarDays son más genéricos
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface DailyItinerary {
  date: string
  count: number
}

interface DashboardAnalytics {
  totalUsers: number
  activeUsers: number // Necesitarías calcular esto
  totalItineraries: number
  itinerariesInSelectedRange: number // Suma de la gráfica para el rango
  avgItinerariesPerUser: string | number
  itinerariesToday: number // Para la tarjeta "Hoy"
  mostPopularDestinations: { destination: string; count: number }[] // Necesitarías calcular esto
  dailyItineraries: DailyItinerary[]
  loading: boolean
  error?: string | null
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalUsers: 0,
    activeUsers: 0,
    totalItineraries: 0,
    itinerariesInSelectedRange: 0,
    avgItinerariesPerUser: "0",
    itinerariesToday: 0,
    mostPopularDestinations: [],
    dailyItineraries: [],
    loading: true,
    error: null,
  })
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">("month")

  const fetchStats = async () => {
    setAnalytics((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch(`/api/admin/dashboard-stats?range=${dateRange}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `Error ${response.status}`)
      }
      const data = await response.json()
      setAnalytics({
        ...data,
        loading: false,
      })
    } catch (error: any) {
      console.error("Error fetching analytics:", error)
      setAnalytics((prev) => ({ ...prev, loading: false, error: error.message }))
    }
  }

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  const getThirdCardTitle = () => {
    switch (dateRange) {
      case "week":
        return "Itinerarios (Últ. 7 Días)"
      case "month":
        return "Itinerarios (Últ. 30 Días)"
      case "year":
        return "Itinerarios (Últ. Año)"
      default:
        return "Itinerarios (Periodo)"
    }
  }

  if (analytics.error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Dashboard de Analytics</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> No se pudieron cargar las estadísticas: {analytics.error}</span>
          <button
            onClick={fetchStats}
            className="ml-4 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Dashboard de Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as "week" | "month" | "year")}
          className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 dark:text-white shadow-sm"
        >
          <option value="week">Últimos 7 días</option>
          <option value="month">Últimos 30 días</option>
          <option value="year">Último año</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics.loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            )}
            {/* <p className="text-xs text-muted-foreground">{analytics.activeUsers} activos</p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Itinerarios (Global)</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics.loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{analytics.totalItineraries}</div>
            )}
            <p className="text-xs text-muted-foreground">{analytics.avgItinerariesPerUser} prom. por usuario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getThirdCardTitle()}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics.loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{analytics.itinerariesInSelectedRange}</div>
            )}
            <p className="text-xs text-muted-foreground">Generados en el periodo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itinerarios Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {analytics.loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">{analytics.itinerariesToday}</div>
            )}
            <p className="text-xs text-muted-foreground">Contador en tiempo real</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          {" "}
          {/* Gráfica ocupa todo el ancho en lg */}
          <CardHeader>
            <CardTitle>Itinerarios Generados por Día</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] sm:h-[400px]">
            {analytics.loading ? (
              <Skeleton className="h-full w-full" />
            ) : analytics.dailyItineraries.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay datos para mostrar en este rango.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyItineraries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value + "T00:00:00").toLocaleDateString("es-ES", { month: "short", day: "numeric" })
                    }
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(label) =>
                      new Date(label + "T00:00:00").toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    }
                    formatter={(value: number) => [value, "Itinerarios"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Itinerarios"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Podrías añadir aquí el gráfico de destinos populares si lo necesitas */}
        {/* <Card> ... </Card> */}
      </div>
    </div>
  )
}
