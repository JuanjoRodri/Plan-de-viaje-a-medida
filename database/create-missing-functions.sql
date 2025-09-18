-- Crear función para obtener estadísticas diarias combinadas
CREATE OR REPLACE FUNCTION get_combined_daily_stats(start_date DATE, end_date DATE)
RETURNS TABLE(date DATE, count BIGINT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  ),
  daily_counts AS (
    SELECT 
      DATE(created_at) AS date,
      COUNT(*) AS count
    FROM itineraries 
    WHERE DATE(created_at) BETWEEN start_date AND end_date
    GROUP BY DATE(created_at)
  )
  SELECT 
    ds.date,
    COALESCE(dc.count, 0) AS count
  FROM date_series ds
  LEFT JOIN daily_counts dc ON ds.date = dc.date
  ORDER BY ds.date;
END;
$$;

-- Crear función para agregación diaria si no existe
CREATE OR REPLACE FUNCTION aggregate_daily_itinerary_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  yesterday_date DATE;
  itinerary_count INTEGER;
BEGIN
  -- Calcular la fecha de ayer
  yesterday_date := CURRENT_DATE - INTERVAL '1 day';
  
  -- Verificar si ya existe un registro para ayer
  IF EXISTS (SELECT 1 FROM daily_itinerary_stats WHERE date = yesterday_date) THEN
    RETURN; -- Ya existe, no hacer nada
  END IF;
  
  -- Contar itinerarios de ayer
  SELECT COUNT(*) INTO itinerary_count
  FROM itineraries 
  WHERE DATE(created_at) = yesterday_date;
  
  -- Insertar el registro
  INSERT INTO daily_itinerary_stats (date, count)
  VALUES (yesterday_date, itinerary_count);
  
END;
$$;

-- Crear tabla daily_itinerary_stats si no existe
CREATE TABLE IF NOT EXISTS daily_itinerary_stats (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_daily_itinerary_stats_date ON daily_itinerary_stats(date);
