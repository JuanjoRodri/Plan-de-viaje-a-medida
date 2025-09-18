"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Copy,
  Eye,
  Clock,
  ExternalLink,
  Search,
  List,
  LayoutGrid,
  MoreVertical,
  Pencil,
  UserCircle,
  Power,
  PowerOff,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SharedLink {
  id: string
  title: string | null
  reference_note?: string | null
  created_at: string
  expires_at: string | null
  view_count: number
  is_active: boolean
  user_id: string
  user_email: string | null
  itinerary_title: string | null
}

export default function AdminSharedLinksList() {
  const router = useRouter()
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [linkToEditExpiration, setLinkToEditExpiration] = useState<SharedLink | null>(null)
  const [expirationDays, setExpirationDays] = useState(30)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchSharedLinks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/shared-links")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar los enlaces compartidos")
      }
      const data = await response.json()
      setSharedLinks(data.sharedLinks || [])
    } catch (err: any) {
      console.error("Error al cargar enlaces compartidos:", err)
      setError(err.message || "No se pudo cargar los enlaces compartidos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSharedLinks()
  }, [fetchSharedLinks])

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

  const getExpirationStatus = (link: SharedLink) => {
    if (!link.is_active) return { label: "Desactivado", color: "default", textColor: "text-gray-500" }
    if (!link.expires_at) return { label: "No expira", color: "green", textColor: "text-green-700" }

    const timeRemaining = getDaysRemaining(link.expires_at)

    if (timeRemaining.expired) {
      return { label: "Expirado", color: "destructive", textColor: "text-red-700" }
    }

    if (timeRemaining.days === 0) {
      // Menos de 24 horas - mostrar horas
      if (timeRemaining.hours <= 6) {
        return { label: `${timeRemaining.hours}h restantes`, color: "red", textColor: "text-red-600" }
      } else {
        return { label: `${timeRemaining.hours}h restantes`, color: "orange", textColor: "text-orange-600" }
      }
    }

    // 1 o más días - siempre verde
    return { label: `${timeRemaining.days}d restantes`, color: "green", textColor: "text-green-700" }
  }

  const openEditExpirationDialog = (link: SharedLink) => {
    const timeRemaining = getDaysRemaining(link.expires_at)
    const daysLeft = timeRemaining.days > 0 && timeRemaining.days !== Number.POSITIVE_INFINITY ? timeRemaining.days : 30
    setExpirationDays(daysLeft)
    setLinkToEditExpiration(link)
  }

  const copyShareLink = (id: string) => {
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/share/${id}`
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => toast.success("Enlace copiado al portapapeles"))
      .catch(() => toast.error("No se pudo copiar el enlace"))
  }

  const handleEditExpirationConfirm = async () => {
    if (!linkToEditExpiration) return
    setIsUpdating(true)
    try {
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + expirationDays)

      const response = await fetch(`/api/admin/shared-links/${linkToEditExpiration.id}/update-expiration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expires_at: newExpiresAt.toISOString() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar la expiración")
      }
      toast.success(`La expiración del enlace se ha actualizado correctamente`)
      fetchSharedLinks()
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar la expiración")
    } finally {
      setIsUpdating(false)
      setLinkToEditExpiration(null)
    }
  }

  const toggleActiveStatus = async (link: SharedLink) => {
    setIsUpdating(true)
    try {
      const newStatus = !link.is_active
      const response = await fetch(`/api/admin/shared-links/${link.id}/toggle-active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cambiar el estado")
      }
      toast.success(`Enlace ${newStatus ? "activado" : "desactivado"}`)
      fetchSharedLinks()
    } catch (err: any) {
      toast.error(err.message || "No se pudo cambiar el estado del enlace")
    } finally {
      setIsUpdating(false)
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

  const filteredLinks = sharedLinks.filter(
    (link) =>
      (link.title || link.itinerary_title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.reference_note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const ListView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Título / Referencia</TableHead>
            <TableHead>Propietario</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead>Expira</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-center">Visitas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLinks.map((link) => {
            const expStatus = getExpirationStatus(link)
            return (
              <TableRow key={link.id} className={`${!link.is_active ? "opacity-60" : ""}`}>
                <TableCell className="font-medium py-3">
                  <div className="flex flex-col">
                    <span
                      className="truncate block font-semibold"
                      title={link.title || link.itinerary_title || "Sin título"}
                    >
                      {link.title || link.itinerary_title || "Sin título"}
                    </span>
                    {link.reference_note && (
                      <span
                        className="text-xs text-muted-foreground truncate block flex items-center mt-0.5"
                        title={link.reference_note}
                      >
                        <Pencil className="h-3 w-3 mr-1 flex-shrink-0" />
                        {link.reference_note}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">
                  <div className="flex items-center" title={link.user_email || "Desconocido"}>
                    <UserCircle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{link.user_email || "Desconocido"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{formatDate(link.created_at)}</TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{formatDate(link.expires_at)}</TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <Badge variant={expStatus.color as any} className={`font-medium ${expStatus.textColor}`}>
                      {expStatus.label}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground py-3">{link.view_count}</TableCell>
                <TableCell className="text-right py-3">
                  <TooltipProvider>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyShareLink(link.id)}
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
                            onClick={() => window.open(`/share/${link.id}`, "_blank")}
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
                          <DropdownMenuItem onClick={() => toggleActiveStatus(link)}>
                            {link.is_active ? (
                              <PowerOff className="mr-2 h-4 w-4" />
                            ) : (
                              <Power className="mr-2 h-4 w-4" />
                            )}
                            {link.is_active ? "Desactivar" : "Activar"} enlace
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditExpirationDialog(link)}>
                            <Clock className="mr-2 h-4 w-4" /> Editar Expiración
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredLinks.map((link) => {
        const expStatus = getExpirationStatus(link)
        return (
          <Card key={link.id} className={`overflow-hidden flex flex-col ${!link.is_active ? "opacity-60" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-grow min-w-0">
                  <CardTitle
                    className="text-lg line-clamp-2"
                    title={link.title || link.itinerary_title || "Sin título"}
                  >
                    {link.title || link.itinerary_title || "Sin título"}
                  </CardTitle>
                  {link.reference_note && (
                    <p
                      className="text-xs text-muted-foreground truncate flex items-center mt-0.5"
                      title={link.reference_note}
                    >
                      <Pencil className="h-3 w-3 mr-1 flex-shrink-0" />
                      {link.reference_note}
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
                    <DropdownMenuItem onClick={() => toggleActiveStatus(link)}>
                      {link.is_active ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                      {link.is_active ? "Desactivar" : "Activar"} enlace
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditExpirationDialog(link)}>
                      <Clock className="mr-2 h-4 w-4" /> Editar Expiración
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pb-3 space-y-2 flex-grow">
              <div className="flex items-center text-xs text-muted-foreground" title={link.user_email || "Desconocido"}>
                <UserCircle className="mr-1.5 h-3.5 w-3.5" /> Propietario:{" "}
                <span className="truncate ml-1 font-medium">{link.user_email || "Desconocido"}</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1.5 h-3.5 w-3.5" /> Creado: {formatDate(link.created_at)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="mr-1.5 h-3.5 w-3.5" /> Expira: {formatDate(link.expires_at)}
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <Badge variant={expStatus.color as any} className={`font-medium ${expStatus.textColor}`}>
                  {expStatus.label}
                </Badge>
                <div className="flex items-center text-muted-foreground">
                  <Eye className="mr-1 h-4 w-4" /> {link.view_count}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-3 pb-3 border-t mt-auto">
              <Button variant="outline" size="sm" onClick={() => copyShareLink(link.id)}>
                <Copy className="mr-1.5 h-4 w-4" /> Copiar
              </Button>
              <Button size="sm" onClick={() => window.open(`/share/${link.id}`, "_blank")}>
                <ExternalLink className="mr-1.5 h-4 w-4" /> Ver
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        {viewMode === "list" ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          <p>Error al cargar enlaces: {error}</p>
          <Button onClick={fetchSharedLinks} className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, referencia, email propietario..."
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
                  aria-label="Vista de Lista"
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
                  aria-label="Vista de Cuadrícula"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Vista de Cuadrícula</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {!loading && !error && filteredLinks.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          {sharedLinks.length > 0
            ? "No se encontraron enlaces que coincidan con tu búsqueda."
            : "No hay enlaces compartidos en la plataforma todavía."}
        </p>
      )}
      {!loading && !error && filteredLinks.length > 0 && (viewMode === "list" ? <ListView /> : <GridView />)}

      <Dialog open={!!linkToEditExpiration} onOpenChange={(isOpen) => !isOpen && setLinkToEditExpiration(null)}>
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
            <Button variant="outline" onClick={() => setLinkToEditExpiration(null)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleEditExpirationConfirm} disabled={isUpdating}>
              {isUpdating ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
