-- Actualizar tabla shared_itineraries para soportar enriquecimiento de lugares y contenido JSON

-- Añadir columnas para el enriquecimiento si no existen
ALTER TABLE shared_itineraries 
ADD COLUMN IF NOT EXISTS verified_places JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS enrichment_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enrichment_stats JSONB DEFAULT NULL;

-- AÑADIR COLUMNA PARA EL CONTENIDO JSON DEL ITINERARIO
ALTER TABLE shared_itineraries
ADD COLUMN IF NOT EXISTS json_content JSONB DEFAULT NULL;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN shared_itineraries.verified_places IS 'Array de lugares verificados con Google Places API, extraídos del JSON';
COMMENT ON COLUMN shared_itineraries.enrichment_completed IS 'Indica si el itinerario ha sido enriquecido con enlaces oficiales (basado en JSON)';
COMMENT ON COLUMN shared_itineraries.enrichment_stats IS 'Estadísticas del proceso de enriquecimiento del JSON';
COMMENT ON COLUMN shared_itineraries.json_content IS 'El itinerario completo en formato JSON';

-- Considerar hacer html_content opcional si json_content es la fuente principal
-- ALTER TABLE shared_itineraries ALTER COLUMN html_content DROP NOT NULL; -- (Descomentar si se decide)

-- Índices existentes (revisar si son necesarios para json_content si se hacen búsquedas sobre él)
CREATE INDEX IF NOT EXISTS idx_shared_itineraries_enrichment_completed 
ON shared_itineraries(enrichment_completed);

CREATE INDEX IF NOT EXISTS idx_shared_itineraries_destination 
ON shared_itineraries(destination);
