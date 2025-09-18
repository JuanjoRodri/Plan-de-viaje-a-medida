-- Añadir columna simple para notificaciones por enlace
ALTER TABLE shared_itineraries 
ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
