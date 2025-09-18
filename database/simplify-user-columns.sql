-- 🎯 SIMPLIFICAR TABLA USERS - Solo las columnas esenciales para conteo
-- Eliminar columnas innecesarias y mantener solo lo esencial

-- Verificar si las columnas existen antes de añadirlas
DO $$ 
BEGIN
    -- Añadir columnas esenciales si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'itineraries_created_this_month') THEN
        ALTER TABLE users ADD COLUMN itineraries_created_this_month INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'itineraries_created_today') THEN
        ALTER TABLE users ADD COLUMN itineraries_created_today INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_month_reset') THEN
        ALTER TABLE users ADD COLUMN last_month_reset VARCHAR(7); -- "2024-01"
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'monthly_itinerary_limit') THEN
        ALTER TABLE users ADD COLUMN monthly_itinerary_limit INTEGER DEFAULT 50;
    END IF;
END $$;

-- Limpiar datos inconsistentes y establecer valores por defecto
UPDATE users SET 
    itineraries_created_this_month = 0 WHERE itineraries_created_this_month IS NULL;
UPDATE users SET 
    itineraries_created_today = 0 WHERE itineraries_created_today IS NULL;
UPDATE users SET 
    monthly_itinerary_limit = 50 WHERE monthly_itinerary_limit IS NULL;

-- Opcional: Eliminar columnas innecesarias (descomenta si quieres limpiar)
-- ALTER TABLE users DROP COLUMN IF EXISTS last_reset_date;
-- ALTER TABLE users DROP COLUMN IF EXISTS last_itinerary_month;
-- ALTER TABLE users DROP COLUMN IF EXISTS daily_itinerary_limit;

COMMENT ON COLUMN users.itineraries_created_this_month IS 'Contador mensual de itinerarios creados';
COMMENT ON COLUMN users.itineraries_created_today IS 'Contador diario de itinerarios creados';
COMMENT ON COLUMN users.last_month_reset IS 'Último mes en que se reseteó el contador (formato YYYY-MM)';
COMMENT ON COLUMN users.monthly_itinerary_limit IS 'Límite mensual de itinerarios configurado por admin';
