-- Añadir la columna last_reset_date a la tabla users si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_reset_date DATE;

-- Añadir la columna last_itinerary_date a la tabla users si no existe
-- Esta columna es útil para el diagnóstico y para entender cuándo un usuario creó su último itinerario
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_itinerary_date DATE;

-- Comentario:
-- La columna 'last_reset_date' se utiliza para rastrear cuándo se resetearon por última vez
-- los contadores de 'itineraries_created_today' para un usuario.
-- Esto asegura que el reseteo ocurra solo una vez al día por usuario.

-- La columna 'last_itinerary_date' puede usarse para registrar la fecha
-- del último itinerario creado por el usuario, lo que puede ser útil para
-- análisis de actividad o para futuras funcionalidades.
-- (Actualmente, la lógica de actualización de 'last_itinerary_date' no está
-- implementada en DailyStatsService, pero la columna es referenciada en getDiagnosticInfo)
