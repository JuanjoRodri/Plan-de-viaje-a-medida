// Utilidades para manejo de roles
export const ROLES = {
  USER: "user",
  PRUEBA: "prueba",
  MICRO: "micro",
  PRO: "pro",
  ENTERPRISE: "enterprise",
  ADMIN: "admin",
  // Roles con addon de fotos
  USER_FOTO: "user_foto",
  PRUEBA_FOTO: "prueba_foto",
  MICRO_FOTO: "micro_foto",
  PRO_FOTO: "pro_foto",
  ENTERPRISE_FOTO: "enterprise_foto",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Usuario",
  prueba: "Prueba",
  micro: "Micro",
  pro: "Pro",
  enterprise: "Enterprise",
  admin: "Administrador",
  user_foto: "Usuario + Fotos",
  prueba_foto: "Prueba + Fotos",
  micro_foto: "Micro + Fotos",
  pro_foto: "Pro + Fotos",
  enterprise_foto: "Enterprise + Fotos",
}

export const ROLE_COLORS: Record<UserRole, string> = {
  user: "bg-gray-100 text-gray-800",
  prueba: "bg-green-100 text-green-800",
  micro: "bg-purple-100 text-purple-800",
  pro: "bg-orange-100 text-orange-800",
  enterprise: "bg-red-100 text-red-800",
  admin: "bg-blue-100 text-blue-800",
  user_foto: "bg-gray-100 text-gray-800 border-2 border-yellow-400",
  prueba_foto: "bg-green-100 text-green-800 border-2 border-yellow-400",
  micro_foto: "bg-purple-100 text-purple-800 border-2 border-yellow-400",
  pro_foto: "bg-orange-100 text-orange-800 border-2 border-yellow-400",
  enterprise_foto: "bg-red-100 text-red-800 border-2 border-yellow-400",
}

// Nueva función para verificar acceso a fotos
export function hasPhotoAccess(role: UserRole): boolean {
  return role.endsWith("_foto") || role === ROLES.ADMIN
}

// Verificar si un rol tiene acceso a funcionalidades generales
export function hasGeneralAccess(role: UserRole): boolean {
  return [
    ROLES.USER,
    ROLES.PRUEBA,
    ROLES.MICRO,
    ROLES.PRO,
    ROLES.ENTERPRISE,
    ROLES.ADMIN,
    ROLES.USER_FOTO,
    ROLES.PRUEBA_FOTO,
    ROLES.MICRO_FOTO,
    ROLES.PRO_FOTO,
    ROLES.ENTERPRISE_FOTO,
  ].includes(role)
}

// Verificar si un rol tiene acceso de administrador
export function hasAdminAccess(role: UserRole): boolean {
  return role === ROLES.ADMIN
}

// Verificar si un rol es premium (pro o enterprise)
export function isPremiumRole(role: UserRole): boolean {
  return [ROLES.PRO, ROLES.ENTERPRISE, ROLES.PRO_FOTO, ROLES.ENTERPRISE_FOTO].includes(role)
}

// Obtener el rol base sin el addon de fotos
export function getBaseRole(role: UserRole): UserRole {
  if (role.endsWith("_foto")) {
    return role.replace("_foto", "") as UserRole
  }
  return role
}

// Obtener límite de itinerarios por rol (basado en el rol base)
export function getDefaultItineraryLimit(role: UserRole): number {
  const baseRole = getBaseRole(role)
  switch (baseRole) {
    case ROLES.PRUEBA:
      return 3 // Límite de prueba
    case ROLES.MICRO:
      return 10 // Límite básico para micro
    case ROLES.USER:
      return 50 // Límite estándar
    case ROLES.PRO:
      return 125 // Límite profesional
    case ROLES.ENTERPRISE:
      return 300 // Límite empresarial
    case ROLES.ADMIN:
      return 9999 // Sin límite para admin
    default:
      return 50
  }
}

// Obtener descripción del plan
export function getRoleDescription(role: UserRole): string {
  const baseRole = getBaseRole(role)
  const hasPhotos = hasPhotoAccess(role)

  let description = ""
  switch (baseRole) {
    case ROLES.MICRO:
      description = "Plan básico - 10 itinerarios/mes"
      break
    case ROLES.PRUEBA:
      description = "Plan de prueba - 3 itinerarios/mes"
      break
    case ROLES.USER:
      description = "Plan estándar - 50 itinerarios/mes"
      break
    case ROLES.PRO:
      description = "Plan profesional - 125 itinerarios/mes"
      break
    case ROLES.ENTERPRISE:
      description = "Plan empresarial - 300 itinerarios/mes"
      break
    case ROLES.ADMIN:
      description = "Administrador - Sin límites"
      break
    default:
      description = "Plan desconocido"
  }

  if (hasPhotos && role !== ROLES.ADMIN) {
    description += " + Acceso a fotos"
  }

  return description
}

// Obtener orden de prioridad del rol (para mostrar en listas)
export function getRolePriority(role: UserRole): number {
  const baseRole = getBaseRole(role)
  const hasPhotos = hasPhotoAccess(role)

  let priority = 0
  switch (baseRole) {
    case ROLES.ADMIN:
      priority = 6
      break
    case ROLES.ENTERPRISE:
      priority = 5
      break
    case ROLES.PRO:
      priority = 4
      break
    case ROLES.USER:
      priority = 3
      break
    case ROLES.MICRO:
      priority = 2
      break
    case ROLES.PRUEBA:
      priority = 1
      break
    default:
      priority = 0
  }

  // Los roles con fotos tienen ligeramente más prioridad
  if (hasPhotos && role !== ROLES.ADMIN) {
    priority += 0.1
  }

  return priority
}
