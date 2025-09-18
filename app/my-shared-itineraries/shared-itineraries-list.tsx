"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Calendar,
  Copy,
  Eye,
  Trash2,
  Clock,
  ExternalLink,
  Search,
  List,
  LayoutGrid,
  MoreVertical,
  Pencil,
  UserCircle,
  Mail,
  Settings,
  Bell,
  BellOff,
  Repeat2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface SharedItinerary {
  id: string
  title: string
  reference_note?: string | null
  created_at: string
  expires_at: string | null
  view_count: number
  is_active: boolean
  notifications_enabled: boolean
  notification_sent_at?: string | null
}

interface UserNotificationSettings {
  email_notifications_enabled: boolean
  notification_hours_before: number
  notification_email?: string
}

export default function SharedItinerariesList({ userId }: { userId: string }) {
  const router = useRouter()
  const [sharedItineraries, setSharedItineraries] = useState<SharedItinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItinerary, setSelectedItinerary] = useState<SharedItinerary | null>(null)
  const [editExpirationDialogOpen, setEditExpirationDialogOpen] = useState(false)
  const [expirationDays, setExpirationDays] = useState(30)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isResettingNotification, setIsResettingNotification] = useState<string | null>(null)

  // Estados para configuración de notificaciones
  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>({
    email_notifications_enabled: false,
    notification_hours_before: 12,
    notification_email: "",
  })
  const [showNotificationSettingsDialog, setShowNotificationSettingsDialog] = useState(false)
  const [updatingNotifications, setUpdatingNotifications] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        if (!userId) {
          setError("No se pudo identificar al usuario")
          setLoading(false)
          return
        }

        // Cargar itinerarios compartidos (ahora incluimos notification_sent_at)
        const { data: itinerariesData, error: fetchError } = await supabase
          .from("shared_itineraries")
          .select(
            "id, title, reference_note, created_at, expires_at, view_count, is_active, notifications_enabled, notification_sent_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (fetchError) throw fetchError
        setSharedItineraries(itinerariesData || [])

        // Cargar configuración de notificaciones del usuario
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("email_notifications_enabled, notification_hours_before, notification_email, email")
          .eq("id", userId)
          .single()

        if (userError) {
          console.error("Error cargando configuración de usuario:", userError)
        } else {
          setNotificationSettings({
            email_notifications_enabled: userData.email_notifications_enabled || false,
            notification_hours_before: userData.notification_hours_before || 12,
            notification_email: userData.notification_email || userData.email || "",
          })
        }
      } catch (err: any) {
        console.error("Error al cargar datos:", err)
        setError(err.message || "No se pudo cargar los datos")
      } finally {
        setLoading(false)
      }
    }
    if (userId) {
      loadData()
    } else {
      setError("UserID no proporcionado.")
      setLoading(false)
    }
  }, [userId, supabase])

  const updateNotificationSettings = async () => {
    setUpdatingNotifications(true)
    try {
      const response = await fetch("/api/auth/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_notifications_enabled: notificationSettings.email_notifications_enabled,
          notification_hours_before: notificationSettings.notification_hours_before,
        }),
      })

      if (response.ok) {
        toast.success("Configuración de notificaciones actualizada")
        setShowNotificationSettingsDialog(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar configuración")
      }
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar la configuración")
    } finally {
      setUpdatingNotifications(false)
    }
  }

  const toggleNotificationsForLink = async (itinerary: SharedItinerary) => {
    try {
      const newStatus = !itinerary.notifications_enabled

      // Actualizar en la base de datos
      const { error } = await supabase
        .from("shared_itineraries")
        .update({ notifications_enabled: newStatus })
        .eq("id", itinerary.id)
        .eq("user_id", userId) // Verificación de seguridad

      if (error) throw error

      // Actualizar estado local
      setSharedItineraries(
        sharedItineraries.map((item) =>
          item.id === itinerary.id ? { ...item, notifications_enabled: newStatus } : item,
        ),
      )

      toast.success(`Notificaciones ${newStatus ? "activadas" : "desactivadas"} para este enlace`)
    } catch (err: any) {
      toast.error(err.message || "No se pudo cambiar el estado de las notificaciones")
    }
  }

  const getDaysRemaining = (expiresAt: string | null): { days: number; hours: number; expired: boolean } => {
    if (!expiresAt) return { days: Number.POSITIVE_INFINITY, hours: 0, expired: false }
    const now = new Date()
    const expDate = new Date(expiresAt)
    const diffTime = expDate.getTime() - now.getTime()

    if (diffTime <= 0) {
      return { days: 0, hours: 0, expired: true }
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return { days, hours, expired: false }
  }

  const getExpirationStatus = (itinerary: SharedItinerary) => {
    if (!itinerary.is_active) return { label: "Desactivado", color: "default", textColor: "text-gray-500" }
    if (!itinerary.expires_at) return { label: "No expira", color: "green", textColor: "text-green-700" }

    const timeRemaining = getDaysRemaining(itinerary.expires_at)

    if (timeRemaining.expired) {
      return { label: "Expirado", color: "destructive", textColor: "text-red-700" }
    }

    if (timeRemaining.days === 0) {
      if (timeRemaining.hours <= 6) {
        return { label: `${timeRemaining.hours}h restantes`, color: "red", textColor: "text-red-600" }
      } else {
        return { label: `${timeRemaining.hours}h restantes`, color: "orange", textColor: "text-orange-600" }
      }
    }

    return { label: `${timeRemaining.days}d restantes`, color: "green", textColor: "text-green-700" }
  }

  const getNotificationStatus = (itinerary: SharedItinerary) => {
    // Verificar primero si las notificaciones están deshabilitadas para este enlace específico
    if (!itinerary.notifications_enabled) {
      return { willNotify: false, reason: "Notificaciones desactivadas para este enlace" }
    }

    // Verificar configuración global
    if (!notificationSettings.email_notifications_enabled) {
      return { willNotify: false, reason: "Notificaciones globales deshabilitadas" }
    }

    if (!itinerary.is_active) {
      return { willNotify: false, reason: "Enlace desactivado" }
    }

    if (!itinerary.expires_at) {
      return { willNotify: false, reason: "Sin fecha de expiración" }
    }

    const timeRemaining = getDaysRemaining(itinerary.expires_at)
    if (timeRemaining.expired) {
      return { willNotify: false, reason: "Ya expirado" }
    }

    const totalHoursRemaining = timeRemaining.days * 24 + timeRemaining.hours
    if (totalHoursRemaining <= notificationSettings.notification_hours_before) {
      return { willNotify: false, reason: "Ya debería haber sido notificado" }
    }

    const notificationDate = new Date(itinerary.expires_at)
    notificationDate.setHours(notificationDate.getHours() - notificationSettings.notification_hours_before)

    return {
      willNotify: true,
      notificationDate: notificationDate,
      reason: `Se enviará ${notificationSettings.notification_hours_before}h antes`,
    }
  }

  const openEditExpirationDialog = (itinerary: SharedItinerary) => {
    setSelectedItinerary(itinerary)
    const timeRemaining = getDaysRemaining(itinerary.expires_at)
    const daysLeft = timeRemaining.days > 0 && timeRemaining.days !== Number.POSITIVE_INFINITY ? timeRemaining.days : 30
    setExpirationDays(daysLeft)
    setEditExpirationDialogOpen(true)
  }

  const copyShareLink = (id: string) => {
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/share/${id}`
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success("Enlace copiado al portapapeles"))
      .catch(() => toast.error("No se pudo copiar el enlace"))
  }

  const handleDeleteConfirm = async () => {
    if (!selectedItinerary) return
    try {
      const { error } = await supabase.from("shared_itineraries").delete().eq("id", selectedItinerary.id)
      if (error) throw error
      setSharedItineraries(sharedItineraries.filter((item) => item.id !== selectedItinerary.id))
      toast.success("Itinerario compartido eliminado correctamente")
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar el itinerario compartido")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedItinerary(null)
    }
  }

  const handleEditExpirationConfirm = async () => {
    if (!selectedItinerary) return

    setIsUpdating(true)
    try {
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + expirationDays)

      const { data: updateData, error: updateError } = await supabase
        .from("shared_itineraries")
        .update({
          expires_at: newExpiresAt.toISOString(),
          is_active: true,
        })
        .eq("id", selectedItinerary.id)
        .select()

      if (updateError) {
        throw new Error("Error al actualizar: " + updateError.message)
      }

      if (!updateData || updateData.length === 0) {
        throw new Error("No se pudo actualizar el itinerario.")
      }

      setSharedItineraries(
        sharedItineraries.map((item) =>
          item.id === selectedItinerary.id
            ? {
                ...item,
                expires_at: newExpiresAt.toISOString(),
                is_active: true,
              }
            : item,
        ),
      )

      toast.success(`La expiración del enlace se ha actualizado correctamente`)
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar la expiración")
    } finally {
      setIsUpdating(false)
      setEditExpirationDialogOpen(false)
      setSelectedItinerary(null)
    }
  }

  const toggleActiveStatus = async (itinerary: SharedItinerary) => {
    console.log("Intentando cambiar estado del enlace:", itinerary.id, "Estado actual:", itinerary.is_active)

    // Añadir estado de carga
    setUpdatingStatus(itinerary.id)

    try {
      const newStatus = !itinerary.is_active
      console.log("Nuevo estado que se aplicará:", newStatus)

      // Verificar que tenemos los datos necesarios
      if (!itinerary.id || !userId) {
        throw new Error("Faltan datos necesarios para la actualización")
      }

      const updatePayload = { is_active: newStatus }
      console.log("Payload de actualización:", updatePayload)

      const { data, error } = await supabase
        .from("shared_itineraries")
        .update(updatePayload)
        .eq("id", itinerary.id)
        .eq("user_id", userId)
        .select() // Añadir select para obtener los datos actualizados

      console.log("Respuesta de Supabase:", { data, error })

      if (error) {
        console.error("Error de Supabase:", error)
        throw new Error(`Error de base de datos: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.error("No se encontró el registro para actualizar")
        throw new Error("No se pudo encontrar el enlace para actualizar. Verifica que tienes permisos.")
      }

      // Actualizar el estado local inmediatamente con los datos reales de la base de datos
      setSharedItineraries((prevItineraries) =>
        prevItineraries.map((item) =>
          item.id === itinerary.id
            ? { ...item, is_active: data[0].is_active } // Usar el valor real de la BD
            : item,
        ),
      )

      console.log("Estado local actualizado correctamente")
      toast.success(`Enlace ${newStatus ? "activado" : "desactivado"} correctamente`)

      // Forzar re-render después de un pequeño delay para asegurar que se vea el cambio
      setTimeout(() => {
        setSharedItineraries((prevItineraries) => [...prevItineraries])
      }, 100)
    } catch (err: any) {
      console.error("Error completo en toggleActiveStatus:", err)
      toast.error(err.message || "No se pudo cambiar el estado del enlace")
    } finally {
      // Limpiar estado de carga
      setUpdatingStatus(null)
    }
  }

  const handleResetNotification = async (itinerary: SharedItinerary) => {
    setIsResettingNotification(itinerary.id)
    try {
      const response = await fetch(`/api/shared-itineraries/${itinerary.id}/reset-notification`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al resetear la notificación")
      }

      // Actualizar el estado local para reflejar que la notificación ha sido reseteada
      setSharedItineraries((prevItineraries) =>
        prevItineraries.map((item) =>
          item.id === itinerary.id
            ? { ...item, notification_sent_at: null } // Resetear a null
            : item,
        ),
      )
      toast.success("Notificación reseteada. Se enviará de nuevo si las condiciones se cumplen.")
    } catch (err: any) {
      toast.error(err.message || "No se pudo resetear la notificación.")
    } finally {
      setIsResettingNotification(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Fecha inválida"
    }
  }

  const filteredItineraries = sharedItineraries.filter(
    (itinerary) =>
      itinerary.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.reference_note?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditItinerary = (itinerary: SharedItinerary) => {
    router.push(`/edit-shared-itinerary/${itinerary.id}`)
  }

  const ListView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Título / Referencia</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notificaciones</TableHead>
            <TableHead className="text-center">Visitas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItineraries.map((itinerary) => {
            const expStatus = getExpirationStatus(itinerary)
            const notificationStatus = getNotificationStatus(itinerary)
            return (
              <TableRow key={itinerary.id} className={`${!itinerary.is_active ? "opacity-60" : ""}`}>
                <TableCell className="font-medium py-3">
                  <div className="flex flex-col">
                    <span className="truncate block font-semibold" title={itinerary.title || "Sin título"}>
                      {itinerary.title || "Sin título"}
                    </span>
                    {itinerary.reference_note && (
                      <span
                        className="text-xs text-muted-foreground truncate block flex items-center mt-0.5"
                        title={itinerary.reference_note}
                      >
                        <UserCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                        {itinerary.reference_note}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{formatDate(itinerary.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{formatDate(itinerary.expires_at)}</TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <Badge variant={expStatus.color as any} className={`font-medium ${expStatus.textColor}`}>
                      {expStatus.label}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEditExpirationDialog(itinerary)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar expiración</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={itinerary.notifications_enabled}
                      onCheckedChange={() => toggleNotificationsForLink(itinerary)}
                      aria-label="Activar/desactivar notificaciones para este enlace"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            {notificationStatus.willNotify ? (
                              <Bell className="h-4 w-4 text-green-600" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p>{notificationStatus.reason}</p>
                            {notificationStatus.notificationDate && (
                              <p className="mt-1">
                                Notificación: {formatDate(notificationStatus.notificationDate.toISOString())}
                              </p>
                            )}
                            {notificationSettings.notification_email && (
                              <p className="mt-1">Email: {notificationSettings.notification_email}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 ${
                              itinerary.notification_sent_at
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }`}
                            onClick={() => handleResetNotification(itinerary)}
                            disabled={isResettingNotification === itinerary.id}
                          >
                            {isResettingNotification === itinerary.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                            ) : (
                              <Repeat2 className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            {itinerary.notification_sent_at ? (
                              <>
                                <p>Notificación enviada</p>
                                <p className="mt-1">Enviada: {formatDate(itinerary.notification_sent_at)}</p>
                                <p className="mt-1 font-medium">Click para resetear y permitir reenvío</p>
                              </>
                            ) : (
                              <>
                                <p>Notificación no enviada</p>
                                <p className="mt-1 font-medium">Click para forzar reset (opcional)</p>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground py-3">{itinerary.view_count}</TableCell>
                <TableCell className="text-right py-3">
                  <TooltipProvider>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyShareLink(itinerary.id)}
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar enlace</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/share/${itinerary.id}`, "_blank")}
                            className="h-8 w-8"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver enlace</TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => toggleActiveStatus(itinerary)}
                            disabled={updatingStatus === itinerary.id}
                          >
                            {updatingStatus === itinerary.id ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                {itinerary.is_active ? "Desactivando..." : "Activando..."}
                              </>
                            ) : (
                              `${itinerary.is_active ? "Desactivar" : "Activar"} enlace`
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditExpirationDialog(itinerary)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar Expiración
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditItinerary(itinerary)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar Itinerario
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedItinerary(itinerary)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )

  const GridView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredItineraries.map((itinerary) => {
        const expStatus = getExpirationStatus(itinerary)
        const notificationStatus = getNotificationStatus(itinerary)
        return (
          <Card key={itinerary.id} className={`overflow-hidden ${!itinerary.is_active ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <CardTitle className="text-lg line-clamp-2" title={itinerary.title || "Sin título"}>
                    {itinerary.title || "Sin título"}
                  </CardTitle>
                  {itinerary.reference_note && (
                    <p
                      className="text-xs text-muted-foreground truncate flex items-center mt-0.5"
                      title={itinerary.reference_note}
                    >
                      <UserCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                      {itinerary.reference_note}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => toggleActiveStatus(itinerary)}
                      disabled={updatingStatus === itinerary.id}
                    >
                      {updatingStatus === itinerary.id ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          {itinerary.is_active ? "Desactivando..." : "Activando..."}
                        </>
                      ) : (
                        `${itinerary.is_active ? "Desactivar" : "Activar"} enlace`
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditExpirationDialog(itinerary)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar Expiración
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditItinerary(itinerary)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar Itinerario
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedItinerary(itinerary)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> Creado: {formatDate(itinerary.created_at)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1.5 h-3.5 w-3.5" /> Expira: {formatDate(itinerary.expires_at)}
              </div>
              <div className="flex items-center justify-between text-sm">
                <Badge variant={expStatus.color as any} className={`font-medium ${expStatus.textColor}`}>
                  {expStatus.label}
                </Badge>
                <div className="flex items-center text-muted-foreground">
                  <Eye className="mr-1 h-4 w-4" /> {itinerary.view_count}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  {notificationStatus.willNotify ? (
                    <Bell className="h-3 w-3 text-green-600" />
                  ) : (
                    <BellOff className="h-3 w-3 text-gray-400" />
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-5 w-5 ${
                            itinerary.notification_sent_at
                              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                              : "text-green-600 hover:text-green-700 hover:bg-green-50"
                          }`}
                          onClick={() => handleResetNotification(itinerary)}
                          disabled={isResettingNotification === itinerary.id}
                        >
                          {isResettingNotification === itinerary.id ? (
                            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                          ) : (
                            <Repeat2 className="h-2.5 w-2.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          {itinerary.notification_sent_at ? (
                            <>
                              <p>Notificación enviada</p>
                              <p className="mt-1">Enviada: {formatDate(itinerary.notification_sent_at)}</p>
                              <p className="mt-1 font-medium">Click para resetear</p>
                            </>
                          ) : (
                            <>
                              <p>Notificación no enviada</p>
                              <p className="mt-1 font-medium">Click para forzar reset</p>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>Notificaciones:</span>
                </div>
                <Switch
                  checked={itinerary.notifications_enabled}
                  onCheckedChange={() => toggleNotificationsForLink(itinerary)}
                  aria-label="Activar/desactivar notificaciones para este enlace"
                  className="ml-2"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-3 pb-3">
              <Button variant="outline" size="sm" onClick={() => copyShareLink(itinerary.id)}>
                <Copy className="mr-1.5 h-4 w-4" /> Copiar
              </Button>
              <Button size="sm" onClick={() => window.open(`/share/${itinerary.id}`, "_blank")}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Ver
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o referencia..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "list" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista de Lista</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista de Cuadrícula</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button onClick={() => router.push("/")} className="shrink-0">
            Crear Nuevo Itinerario
          </Button>
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("Estado actual de itinerarios:", sharedItineraries)
                console.log("Usuario ID:", userId)
                console.log("Configuración de Supabase:", supabase)
              }}
            >
              Debug Info
            </Button>
          )}
        </div>
      </div>

      {/* Información de configuración actual */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {notificationSettings.email_notifications_enabled ? (
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
            ) : (
              <Mail className="h-5 w-5 text-gray-500 mr-2" />
            )}
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Notificaciones por Email:{" "}
                {notificationSettings.email_notifications_enabled ? "Habilitadas" : "Deshabilitadas"}
              </p>
              {notificationSettings.email_notifications_enabled && (
                <>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Se enviará aviso {notificationSettings.notification_hours_before} horas antes de que expiren los
                    enlaces
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Email de notificaciones: <strong>{notificationSettings.notification_email}</strong>
                  </p>
                </>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowNotificationSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" /> Configurar
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando itinerarios...</p>
        </div>
      )}
      {!loading && error && (
        <Card>
          <CardContent className="p-6 text-center text-red-600">
            <p>Error al cargar itinerarios: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}
      {!loading && !error && filteredItineraries.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          {sharedItineraries.length > 0
            ? "No se encontraron itinerarios que coincidan con tu búsqueda."
            : "No has compartido ningún itinerario todavía."}
        </p>
      )}
      {!loading && !error && filteredItineraries.length > 0 && (viewMode === "list" ? <ListView /> : <GridView />)}

      {/* Dialog para eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar itinerario compartido?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El enlace dejará de funcionar y se perderán las estadísticas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar expiración */}
      <Dialog open={editExpirationDialogOpen} onOpenChange={setEditExpirationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Expiración del Enlace</DialogTitle>
            <DialogDescription>
              Establece una nueva fecha de expiración para este enlace, calculada a partir de hoy.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="expiration-days" className="text-sm font-medium mb-2 block">
              Días de validez (1-365)
            </label>
            <Input
              id="expiration-days"
              type="number"
              min="1"
              max="365"
              value={expirationDays}
              onChange={(e) => {
                const days = Math.max(1, Math.min(365, Number.parseInt(e.target.value) || 30))
                setExpirationDays(days)
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">El enlace expirará {expirationDays} días desde hoy.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExpirationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditExpirationConfirm} disabled={isUpdating}>
              {isUpdating ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para configurar notificaciones */}
      <Dialog open={showNotificationSettingsDialog} onOpenChange={setShowNotificationSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Notificaciones</DialogTitle>
            <DialogDescription>
              Configura cuándo quieres recibir avisos por email sobre enlaces próximos a expirar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Habilitar notificaciones por email</label>
                <p className="text-xs text-muted-foreground">
                  Recibirás un email cuando tus enlaces estén próximos a expirar
                </p>
              </div>
              <Switch
                checked={notificationSettings.email_notifications_enabled}
                onCheckedChange={(checked) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    email_notifications_enabled: checked,
                  })
                }
              />
            </div>

            {notificationSettings.email_notifications_enabled && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Avisar con antelación</label>
                  <select
                    value={notificationSettings.notification_hours_before}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        notification_hours_before: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  >
                    <option value={6}>6 horas antes</option>
                    <option value={12}>12 horas antes</option>
                    <option value={24}>24 horas antes</option>
                    <option value={48}>48 horas antes</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email para notificaciones</label>
                  <Input
                    type="email"
                    value={notificationSettings.notification_email || ""}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        notification_email: e.target.value,
                      })
                    }
                    placeholder="tu@email.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si no especificas un email, se usará tu email de registro
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationSettingsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={updateNotificationSettings} disabled={updatingNotifications}>
              {updatingNotifications ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
