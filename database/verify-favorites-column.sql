-- Verificar si la columna is_favorite existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'itineraries' 
AND column_name = 'is_favorite';

-- Ver la estructura completa de la tabla itineraries
\d itineraries;

-- Verificar si el índice se creó
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'itineraries' 
AND indexname = 'idx_itineraries_user_favorite';
