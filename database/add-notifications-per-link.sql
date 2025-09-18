-- Añadir columna para controlar notificaciones por enlace individual
ALTER TABLE shared_itineraries 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Actualizar enlaces existentes para que tengan notificaciones habilitadas por defecto
UPDATE shared_itineraries 
SET notifications_enabled = true 
WHERE notifications_enabled IS NULL;

-- Añadir comentario para documentar la columna
COMMENT ON COLUMN shared_itineraries.notifications_enabled IS 'Controla si este enlace específico enviará notificaciones de expiración';
