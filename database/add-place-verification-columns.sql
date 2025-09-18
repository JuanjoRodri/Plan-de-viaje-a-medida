-- Añadir columnas faltantes a la tabla place_verifications
-- Ejecutar este script para añadir los campos adicionales de Google Places

ALTER TABLE place_verifications 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS user_ratings_total INTEGER,
ADD COLUMN IF NOT EXISTS opening_hours TEXT,
ADD COLUMN IF NOT EXISTS open_now BOOLEAN,
ADD COLUMN IF NOT EXISTS place_types TEXT[];

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_place_verifications_phone ON place_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_place_verifications_website ON place_verifications(website);
CREATE INDEX IF NOT EXISTS idx_place_verifications_rating ON place_verifications(rating);
CREATE INDEX IF NOT EXISTS idx_place_verifications_place_types ON place_verifications USING GIN(place_types);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN place_verifications.phone_number IS 'Número de teléfono formateado del lugar';
COMMENT ON COLUMN place_verifications.website IS 'Sitio web oficial del lugar';
COMMENT ON COLUMN place_verifications.user_ratings_total IS 'Número total de reseñas del lugar';
COMMENT ON COLUMN place_verifications.opening_hours IS 'Horarios de apertura concatenados';
COMMENT ON COLUMN place_verifications.open_now IS 'Si el lugar está abierto actualmente';
COMMENT ON COLUMN place_verifications.place_types IS 'Tipos de lugar de Google Places (array)';
