-- Limpiar funciones problemáticas
DROP FUNCTION IF EXISTS get_combined_daily_stats(date,date);
DROP FUNCTION IF EXISTS aggregate_daily_itinerary_stats();

-- Crear tabla simple si no existe
CREATE TABLE IF NOT EXISTS daily_itinerary_stats (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
