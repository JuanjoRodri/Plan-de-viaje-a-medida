-- Añadir columna para tracking de notificaciones de límite
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS limit_warning_sent_this_month BOOLEAN DEFAULT FALSE;

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_limit_warning 
ON users(limit_warning_sent_this_month, last_month_reset);

-- Comentario para documentación
COMMENT ON COLUMN users.limit_warning_sent_this_month IS 'Indica si ya se envió la notificación de límite este mes';
