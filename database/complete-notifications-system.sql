-- Añadir columnas para controlar el estado de las notificaciones
ALTER TABLE shared_itineraries 
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_notification_check TIMESTAMP DEFAULT NOW();

-- Añadir índices para mejorar el rendimiento de las consultas de notificaciones
CREATE INDEX IF NOT EXISTS idx_shared_itineraries_notifications 
ON shared_itineraries(expires_at, notifications_enabled, notification_sent_at) 
WHERE is_active = true;
