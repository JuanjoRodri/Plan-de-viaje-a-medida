"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Rocket, CheckCircle, XCircle, Clock } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface BoostRequest {
  id: string
  status: "pending" | "approved" | "rejected"
  itineraries_requested: number
  created_at: string
  admin_notes?: string
  total_price?: number
}

interface BoostRequestSectionProps {
  user: {
    id: string
    email: string
    name: string
    monthly_itinerary_limit: number
    itineraries_created_this_month: number
  }
}

// Definir los paquetes fijos disponibles
const BOOST_PACKAGES = [
  { quantity: 5, pricePerUnit: 3.0, total: 15.0 },
  { quantity: 10, pricePerUnit: 2.9, total: 29.0 },
  { quantity: 15, pricePerUnit: 2.75, total: 41.25 },
  { quantity: 20, pricePerUnit: 2.5, total: 50.0 },
]

export default function BoostRequestSection({ user }: BoostRequestSectionProps) {
  const [requests, setRequests] = useState<BoostRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [selectedPackageIndex, setSelectedPackageIndex] = useState([1]) // Default paquete 10 (índice 1)

  const used = user.itineraries_created_this_month || 0
  const limit = user.monthly_itinerary_limit || 50
  const percentage = Math.round((used / limit) * 100)
  const canRequest = percentage >= 80

  // Debug logs
  console.log("🔍 Boost Debug:", {
    user,
    used,
    limit,
    percentage,
    canRequest,
  })

  const pendingRequest = requests.find((r) => r.status === "pending")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/boost-requests")
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

  const getCurrentPackage = () => {
    return BOOST_PACKAGES[selectedPackageIndex[0]]
  }

  const handleRequestBoost = async () => {
    try {
      setRequesting(true)
      const currentPackage = getCurrentPackage()
      const response = await fetch("/api/boost-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: currentPackage.quantity,
          totalPrice: currentPackage.total,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("¡Solicitud enviada! Te notificaremos cuando sea procesada.")
        fetchRequests()
      } else {
        alert(data.error || "Error al enviar solicitud")
      }
    } catch (error) {
      console.error("Error requesting boost:", error)
      alert("Error al enviar solicitud")
    } finally {
      setRequesting(false)
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

  const currentPackage = getCurrentPackage()

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Paquete Boost
          </CardTitle>
          <CardDescription>Solicita itinerarios adicionales cuando estés cerca del límite</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Uso actual:</span>
            <span className="font-semibold">
              {used}/{limit} ({percentage}%)
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${percentage >= 95 ? "bg-red-500" : percentage >= 80 ? "bg-yellow-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {canRequest && !pendingRequest ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Paquete seleccionado:</span>
                  <span className="font-bold text-lg">{currentPackage.quantity} itinerarios</span>
                </div>

                <Slider
                  value={selectedPackageIndex}
                  onValueChange={setSelectedPackageIndex}
                  max={3} // 0-3 para los 4 paquetes
                  min={0}
                  step={1}
                  className="w-full"
                />

                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    • <strong>Paquete 5:</strong> 5 itinerarios a €3.00 c/u = €15.00
                  </div>
                  <div>
                    • <strong>Paquete 10:</strong> 10 itinerarios a €2.90 c/u = €29.00
                  </div>
                  <div>
                    • <strong>Paquete 15:</strong> 15 itinerarios a €2.75 c/u = €41.25
                  </div>
                  <div>
                    • <strong>Paquete 20:</strong> 20 itinerarios a €2.50 c/u = €50.00
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Precio por itinerario:</span>
                    <span className="font-semibold">€{currentPackage.pricePerUnit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total a pagar:</span>
                    <span className="font-bold text-lg">€{currentPackage.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleRequestBoost} disabled={requesting} className="w-full">
                {requesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Solicitar Paquete de {currentPackage.quantity} Itinerarios (€{currentPackage.total.toFixed(2)})
                  </>
                )}
              </Button>
            </div>
          ) : !canRequest ? (
            <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">
              Podrás solicitar itinerarios adicionales cuando hayas usado el 80% o más de tu límite mensual.
            </div>
          ) : (
            <div className="text-sm text-center p-4 bg-blue-50 rounded-lg">
              Ya tienes una solicitud pendiente. Te notificaremos cuando sea procesada.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de solicitudes */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">+{request.itineraries_requested} itinerarios</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                        {request.total_price && <span> • €{request.total_price.toFixed(2)}</span>}
                      </div>
                      {request.admin_notes && (
                        <div className="text-sm text-muted-foreground mt-1">Nota: {request.admin_notes}</div>
                      )}
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
