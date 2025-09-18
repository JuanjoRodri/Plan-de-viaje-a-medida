-- Tabla para cache de fotos de lugares
CREATE TABLE IF NOT EXISTS place_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id VARCHAR(255) NOT NULL,
  google_place_id VARCHAR(255),
  photo_reference VARCHAR(500),
  photo_url VARCHAR(1000),
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_place_photos_place_id ON place_photos(place_id);
CREATE INDEX IF NOT EXISTS idx_place_photos_google_place_id ON place_photos(google_place_id);
CREATE INDEX IF NOT EXISTS idx_place_photos_created_at ON place_photos(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_place_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_place_photos_updated_at ON place_photos;
CREATE TRIGGER update_place_photos_updated_at
    BEFORE UPDATE ON place_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_place_photos_updated_at();
