# AUDITORÍA COMPLETA - MIGRACIÓN A SUPABASE

## 📊 ESTRUCTURA ACTUAL DE SUPABASE

### Tabla `itineraries`:
\`\`\`sql
- id: uuid (PK, auto-generated)
- user_id: uuid (FK to users)
- title: varchar (required)
- destination: varchar (required) 
- days: integer (required)
- travelers: integer (required)
- budget_type: varchar (optional)
- html_content: text (optional)
- created_at: timestamp (auto)
- updated_at: timestamp (auto)
\`\`\`

## 📱 ESTRUCTURA ACTUAL DE LOCALSTORAGE

### 1. `savedItineraries` (SavedItinerary[]):
\`\`\`typescript
interface SavedItinerary {
  id: string                    // ✅ Compatible con Supabase
  destination: string           // ✅ Compatible
  days: string                  // ❌ Diferencia: string vs integer
  nights: string                // ❌ Falta en Supabase
  hotel: string                 // ❌ Falta en Supabase
  travelers: string             // ❌ Diferencia: string vs integer
  arrivalTime: string           // ❌ Falta en Supabase
  budget?: string               // ✅ Similar a budget_type
  customBudget?: string         // ❌ Falta en Supabase
  html: string                  // ✅ Similar a html_content
  savedAt: number               // ✅ Similar a created_at
}
\`\`\`

### 2. `itineraryHistory` (ItineraryHistoryItem[]):
\`\`\`typescript
interface ItineraryHistoryItem {
  id: string                    // ✅ Compatible
  destination: string           // ✅ Compatible
  days: string                  // ❌ Diferencia: string vs integer
  nights: string                // ❌ Falta en Supabase
  hotel: string                 // ❌ Falta en Supabase
  travelers: string             // ❌ Diferencia: string vs integer
  arrivalTime: string           // ❌ Falta en Supabase
  budget?: string               // ✅ Similar a budget_type
  customBudget?: string         // ❌ Falta en Supabase
  html: string                  // ✅ Similar a html_content
  savedAt: number               // ✅ Similar a created_at
  lastViewed: number            // ❌ Falta en Supabase
  type: "history"               // ❌ Falta en Supabase
}
\`\`\`

### 3. `currentItinerary`:
\`\`\`typescript
interface CurrentItinerary {
  html: string                  // ✅ Compatible
  destination: string           // ✅ Compatible
  days: string                  // ❌ Diferencia: string vs integer
  nights: string                // ❌ Falta en Supabase
  hotel: string                 // ❌ Falta en Supabase
  travelers: string             // ❌ Diferencia: string vs integer
  arrivalTime: string           // ❌ Falta en Supabase
  departureTime: string         // ❌ Falta en Supabase
  weatherData?: WeatherData     // ❌ Falta en Supabase
  budget?: string               // ✅ Similar a budget_type
  customBudget?: string         // ❌ Falta en Supabase
  id?: string                   // ✅ Compatible
}
\`\`\`

## 🔍 COMPONENTES QUE USAN LOCALSTORAGE

### 1. `SavedItinerariesModal`:
- **Lee:** `localStorage.getItem("savedItineraries")`
- **Escribe:** `localStorage.setItem("savedItineraries")`
- **Función:** Mostrar y cargar itinerarios guardados manualmente

### 2. `ItineraryHistoryModal`:
- **Lee:** `localStorage.getItem("itineraryHistory")`
- **Escribe:** `localStorage.setItem("itineraryHistory")`
- **Función:** Mostrar historial automático de itinerarios generados

### 3. `ClientHomePage`:
- **Lee:** `localStorage.getItem("currentItinerary")`
- **Escribe:** `localStorage.setItem("currentItinerary")`
- **Función:** Persistir itinerario actual entre sesiones

### 4. Funciones de guardado automático:
- **`saveToHistory()`:** Guarda automáticamente cada itinerario generado
- **`handleSaveItinerary()`:** Guarda manualmente itinerarios seleccionados

## ❌ CAMPOS FALTANTES EN SUPABASE

Para migración completa necesitamos añadir:

\`\`\`sql
ALTER TABLE itineraries ADD COLUMN:
- nights VARCHAR                    -- Noches de estancia
- hotel VARCHAR                     -- Hotel seleccionado
- arrival_time VARCHAR              -- Hora de llegada
- departure_time VARCHAR            -- Hora de salida
- custom_budget VARCHAR             -- Presupuesto personalizado
- weather_data JSONB                -- Datos meteorológicos
- last_viewed_at TIMESTAMP          -- Última visualización
- is_history BOOLEAN DEFAULT false  -- Es del historial automático
- is_current BOOLEAN DEFAULT false  -- Es el itinerario actual
- auto_saved BOOLEAN DEFAULT false  -- Guardado automáticamente
\`\`\`

## 🔄 DIFERENCIAS DE TIPOS

### Conversiones necesarias:
- `days: string` → `days: integer`
- `travelers: string` → `travelers: integer`
- `savedAt: number` → `created_at: timestamp`
- `lastViewed: number` → `last_viewed_at: timestamp`

## 📈 ESTADÍSTICAS ACTUALES

### Límites localStorage:
- **Historial:** Máximo 20 itinerarios
- **Guardados:** Sin límite aparente
- **Tamaño:** ~5-10MB por usuario típico

### Ventajas migración a Supabase:
- ✅ Sincronización entre dispositivos
- ✅ Backup automático
- ✅ Historial ilimitado
- ✅ Búsqueda y filtrado avanzado
- ✅ Compartir entre usuarios
- ✅ Métricas y analytics

## 🎯 PRÓXIMOS PASOS

1. **Diseñar nueva estructura de BBDD** (Fase 1.2)
2. **Crear script de migración de datos**
3. **Actualizar tipos TypeScript**
4. **Modificar componentes para usar APIs**
5. **Implementar migración automática**
