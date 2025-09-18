-- Función para agregar estadísticas diarias de itinerarios
CREATE OR REPLACE FUNCTION aggregate_daily_itinerary_stats()
RETURNS void AS $$
DECLARE
    yesterday_date DATE;
    total_count INTEGER;
BEGIN
    -- Calcular la fecha de ayer
    yesterday_date := CURRENT_DATE - INTERVAL '1 day';
    
    -- Sumar todos los itinerarios creados ayer por todos los usuarios
    SELECT COALESCE(SUM(itineraries_created_today), 0) 
    INTO total_count
    FROM users 
    WHERE itineraries_created_today > 0;
    
    -- Insertar o actualizar el registro para ayer
    INSERT INTO daily_itinerary_stats (date, total_itineraries)
    VALUES (yesterday_date, total_count)
    ON CONFLICT (date) 
    DO UPDATE SET 
        total_itineraries = EXCLUDED.total_itineraries,
        created_at = NOW();
    
    -- 🔧 NUEVO: Resetear contadores para el nuevo día
    UPDATE users SET itineraries_created_today = 0;
    
    -- Log del resultado
    RAISE NOTICE 'Agregadas estadísticas para %: % itinerarios. Contadores reseteados.', yesterday_date, total_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error agregando estadísticas diarias: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas combinadas (históricas + día actual)
CREATE OR REPLACE FUNCTION get_combined_daily_stats(start_date DATE, end_date DATE)
RETURNS TABLE(date DATE, count INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH historical_data AS (
        -- Datos históricos de la tabla daily_itinerary_stats
        SELECT 
            dis.date,
            dis.total_itineraries as count
        FROM daily_itinerary_stats dis
        WHERE dis.date >= start_date 
          AND dis.date < CURRENT_DATE
          AND dis.date <= end_date
    ),
    current_day_data AS (
        -- Datos del día actual en tiempo real (ahora siempre correctos)
        SELECT 
            CURRENT_DATE as date,
            COALESCE(SUM(u.itineraries_created_today), 0)::INTEGER as count
        FROM users u
        WHERE CURRENT_DATE >= start_date 
          AND CURRENT_DATE <= end_date
    ),
    all_dates AS (
        -- Generar todas las fechas en el rango
        SELECT generate_series(start_date, end_date, '1 day'::interval)::DATE as date
    )
    SELECT 
        ad.date,
        COALESCE(hd.count, cd.count, 0) as count
    FROM all_dates ad
    LEFT JOIN historical_data hd ON ad.date = hd.date
    LEFT JOIN current_day_data cd ON ad.date = cd.date
    ORDER BY ad.date;
END;
$$ LANGUAGE plpgsql;
