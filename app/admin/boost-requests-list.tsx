"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle, XCircle, Clock, User, Calendar } from "lucide-react"

interface BoostRequest {
  id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  itineraries_requested: number
  total_price?: number
  current_used: number
  current_limit: number
  admin_notes?: string
  created_at: string
  processed_at?: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function BoostRequestsList() {
  const [requests, setRequests] = useState<BoostRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [notes, setNotes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/boost-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = async (requestId: string, action: "approve" | "reject") => {
    try {
      setProcessing(requestId)
      const response = await fetch(`/api/admin/boost-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          notes: notes[requestId] || "",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        fetchRequests()
        setNotes((prev) => ({ ...prev, [requestId]: "" }))
      } else {
        alert(data.error || "Error al procesar solicitud")
      }
    } catch (error) {
      console.error("Error processing request:", error)
      alert("Error al procesar solicitud")
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Aprobada
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rechazada
          </Badge>
        )
      default:
        return null
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const processedRequests = requests.filter((r) => r.status !== "pending")

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "approved").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitudes pendientes */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Pendientes</CardTitle>
            <CardDescription>Solicitudes que requieren tu atención</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{request.user.name}</span>
                      <span className="text-muted-foreground">({request.user.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(request.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Uso actual:</span> {request.current_used}/{request.current_limit} (
                      {Math.round((request.current_used / request.current_limit) * 100)}%)
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Solicita:</span> +{request.itineraries_requested} itinerarios
                      {request.total_price && <span> por €{request.total_price.toFixed(2)}</span>}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Precio solicitado:</span> €
                      {request.total_price?.toFixed(2) || "No disponible"}
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <Textarea
                  placeholder="Notas del administrador (opcional)"
                  value={notes[request.id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                  className="min-h-[80px]"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleProcess(request.id, "approve")}
                    disabled={processing === request.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === request.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Aprobar
                  </Button>
                  <Button
                    onClick={() => handleProcess(request.id, "reject")}
                    disabled={processing === request.id}
                    variant="destructive"
                  >
                    {processing === request.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Solicitudes</CardTitle>
            <CardDescription>Solicitudes procesadas anteriormente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{request.user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      +{request.itineraries_requested} itinerarios • {new Date(request.created_at).toLocaleDateString()}
                      • €{request.total_price?.toFixed(2) || "N/A"}
                    </div>
                    {request.admin_notes && (
                      <div className="text-sm text-muted-foreground mt-1">Nota: {request.admin_notes}</div>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No hay solicitudes de boost aún.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
