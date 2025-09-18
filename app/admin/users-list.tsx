"use client"

import { DialogFooter } from "@/components/ui/dialog"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, Trash2, Plus, RefreshCw, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { ROLE_LABELS, ROLE_COLORS, type UserRole, getDefaultItineraryLimit } from "@/lib/role-utils"

interface User {
  id: string
  name: string
  email: string
  role: string
  monthly_itinerary_limit: number
  monthly_itineraries_used: number
  last_itinerary_month: string
  created_at: string
  updated_at: string
  itineraries_created_this_month: number
  itineraries_created_today: number
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    monthly_itinerary_limit: 50,
    password: "",
  })
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    monthly_itinerary_limit: 50,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Usuarios obtenidos:", data.users)
        setUsers(data.users)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los usuarios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshUsers = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Usuarios actualizados:", data.users)
        setUsers(data.users)
        toast({
          title: "Actualizado",
          description: "La lista de usuarios se ha actualizado correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudieron actualizar los usuarios.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error refreshing users:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar los usuarios.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      monthly_itinerary_limit: user.monthly_itinerary_limit,
      password: "",
    })
    setEditDialogOpen(true)
  }

  const handleCreateUser = () => {
    setCreateFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      monthly_itinerary_limit: 50,
    })
    setCreateDialogOpen(true)
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setUsers(users.filter((user) => user.id !== id))
          toast({
            title: "Usuario eliminado",
            description: "El usuario ha sido eliminado correctamente.",
          })
        } else {
          toast({
            title: "Error",
            description: "No se pudo eliminar el usuario.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al eliminar el usuario.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "monthly_itinerary_limit" ? Number.parseInt(value, 10) : value,
    }))
  }

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCreateFormData((prev) => ({
      ...prev,
      [name]: name === "monthly_itinerary_limit" ? Number.parseInt(value, 10) : value,
    }))
  }

  const handleRoleChange = (value: string) => {
    const defaultLimit = getDefaultItineraryLimit(value as UserRole)

    setFormData((prev) => ({
      ...prev,
      role: value,
      monthly_itinerary_limit: defaultLimit,
    }))
  }

  const handleCreateRoleChange = (value: string) => {
    const defaultLimit = getDefaultItineraryLimit(value as UserRole)

    setCreateFormData((prev) => ({
      ...prev,
      role: value,
      monthly_itinerary_limit: defaultLimit,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const { user } = await response.json()
        setUsers(users.map((u) => (u.id === selectedUser.id ? { ...u, ...user } : u)))
        setEditDialogOpen(false)
        toast({
          title: "Usuario actualizado",
          description: "Los cambios han sido guardados correctamente.",
        })
        await refreshUsers()
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el usuario.",
        variant: "destructive",
      })
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createFormData.name || !createFormData.email || !createFormData.password) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createFormData),
      })

      if (response.ok) {
        const { user } = await response.json()
        setUsers([user, ...users])
        setCreateDialogOpen(false)
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado correctamente.",
        })
        await refreshUsers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "No se pudo crear el usuario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el usuario.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleBadge = (role: string) => {
    const roleKey = role as UserRole
    const colorClass = ROLE_COLORS[roleKey] || "bg-gray-100 text-gray-800"
    const label = ROLE_LABELS[roleKey] || role

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar usuarios..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateUser} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
          <Button onClick={refreshUsers} variant="outline" disabled={refreshing}>
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Límite mensual</TableHead>
                <TableHead>Usados hoy</TableHead>
                <TableHead>Usados este mes</TableHead>
                <TableHead>Último mes</TableHead>
                <TableHead>Fecha registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{user.monthly_itinerary_limit}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          (user.itineraries_created_today || 0) > 5
                            ? "text-red-600"
                            : (user.itineraries_created_today || 0) > 2
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        {user.itineraries_created_today || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">{user.itineraries_created_this_month || 0}</span>
                    </TableCell>
                    <TableCell>{user.last_itinerary_month ? formatDate(user.last_itinerary_month) : "Nunca"}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de edición de usuario */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los detalles del usuario. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleFormChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={handleFormChange}
                  placeholder="Dejar vacío para mantener la actual"
                />
                <p className="text-sm text-muted-foreground">
                  Solo completa este campo si quieres cambiar la contraseña del usuario
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Plan</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">
                      <div className="flex flex-col">
                        <span>Micro</span>
                        <span className="text-xs text-muted-foreground">10 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="prueba">
                      <div className="flex flex-col">
                        <span>Prueba</span>
                        <span className="text-xs text-muted-foreground">25 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex flex-col">
                        <span>Usuario</span>
                        <span className="text-xs text-muted-foreground">50 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div className="flex flex-col">
                        <span>Pro</span>
                        <span className="text-xs text-muted-foreground">125 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex flex-col">
                        <span>Enterprise</span>
                        <span className="text-xs text-muted-foreground">300 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span>Administrador</span>
                        <span className="text-xs text-muted-foreground">Sin límites</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="monthly_itinerary_limit">Límite mensual personalizado</Label>
                <Input
                  id="monthly_itinerary_limit"
                  name="monthly_itinerary_limit"
                  type="number"
                  min="1"
                  max="9999"
                  value={formData.monthly_itinerary_limit}
                  onChange={handleFormChange}
                />
                <p className="text-xs text-muted-foreground">Deja el valor por defecto del plan o personalízalo</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de creación de usuario */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingresa los detalles del nuevo usuario. Todos los campos son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="create-name">Nombre</Label>
                <Input
                  id="create-name"
                  name="name"
                  value={createFormData.name}
                  onChange={handleCreateFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  name="email"
                  type="email"
                  value={createFormData.email}
                  onChange={handleCreateFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-password">Contraseña</Label>
                <Input
                  id="create-password"
                  name="password"
                  type="password"
                  value={createFormData.password}
                  onChange={handleCreateFormChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-role">Plan</Label>
                <Select value={createFormData.role} onValueChange={handleCreateRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">
                      <div className="flex flex-col">
                        <span>Micro</span>
                        <span className="text-xs text-muted-foreground">10 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="prueba">
                      <div className="flex flex-col">
                        <span>Prueba</span>
                        <span className="text-xs text-muted-foreground">25 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex flex-col">
                        <span>Usuario</span>
                        <span className="text-xs text-muted-foreground">50 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pro">
                      <div className="flex flex-col">
                        <span>Pro</span>
                        <span className="text-xs text-muted-foreground">125 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex flex-col">
                        <span>Enterprise</span>
                        <span className="text-xs text-muted-foreground">300 itinerarios/mes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex flex-col">
                        <span>Administrador</span>
                        <span className="text-xs text-muted-foreground">Sin límites</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-monthly-limit">Límite mensual personalizado</Label>
                <Input
                  id="create-monthly-limit"
                  name="monthly_itinerary_limit"
                  type="number"
                  min="1"
                  max="9999"
                  value={createFormData.monthly_itinerary_limit}
                  onChange={handleCreateFormChange}
                />
                <p className="text-xs text-muted-foreground">Se aplicará el límite por defecto del plan seleccionado</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Crear Usuario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
