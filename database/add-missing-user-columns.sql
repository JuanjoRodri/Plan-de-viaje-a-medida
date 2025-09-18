-- Agregar columnas faltantes a la tabla users para el sistema de contadores diarios
-- Ejecutar este script para corregir el error "column users.itineraries_created_today does not exist"

-- 1. Agregar columna para contar itinerarios creados hoy
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS itineraries_created_today INTEGER DEFAULT 0;

-- 2. Agregar columna para rastrear la última fecha de reset
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_reset_date DATE;

-- 3. Agregar columna para rastrear la última fecha de creación de itinerario
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_itinerary_date DATE;

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_itineraries_created_today 
ON users(itineraries_created_today) 
WHERE itineraries_created_today > 0;

CREATE INDEX IF NOT EXISTS idx_users_last_reset_date 
ON users(last_reset_date);

-- 5. Inicializar valores para usuarios existentes
UPDATE users 
SET 
  itineraries_created_today = 0,
  last_reset_date = CURRENT_DATE,
  last_itinerary_date = NULL
WHERE itineraries_created_today IS NULL;

-- 6. Verificar que las columnas se crearon correctamente
DO $$
BEGIN
  -- Verificar itineraries_created_today
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'itineraries_created_today'
  ) THEN
    RAISE EXCEPTION 'Error: columna itineraries_created_today no se creó correctamente';
  END IF;
  
  -- Verificar last_reset_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_reset_date'
  ) THEN
    RAISE EXCEPTION 'Error: columna last_reset_date no se creó correctamente';
  END IF;
  
  -- Verificar last_itinerary_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_itinerary_date'
  ) THEN
    RAISE EXCEPTION 'Error: columna last_itinerary_date no se creó correctamente';
  END IF;
  
  RAISE NOTICE 'Todas las columnas se crearon correctamente';
END $$;

-- 7. Mostrar estadísticas finales
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE itineraries_created_today > 0) as users_with_itineraries_today,
  COUNT(*) FILTER (WHERE last_reset_date = CURRENT_DATE) as users_reset_today
FROM users;
