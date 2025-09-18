-- Añadir columna expired a la tabla boost_requests
ALTER TABLE boost_requests 
ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT FALSE;

-- Añadir columna expired_at para timestamp de expiración
ALTER TABLE boost_requests 
ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP;

-- Comentarios para documentación
COMMENT ON COLUMN boost_requests.expired IS 'Indica si el boost ha expirado (true) o está activo (false)';
COMMENT ON COLUMN boost_requests.expired_at IS 'Timestamp de cuando el boost fue marcado como expirado';

-- Marcar como expirados todos los boosts aprobados de meses anteriores
UPDATE boost_requests 
SET 
  expired = TRUE,
  expired_at = NOW()
WHERE 
  status = 'approved' 
  AND created_at < DATE_TRUNC('month', NOW())
  AND expired IS NULL;

-- Crear índice para mejorar performance en consultas
CREATE INDEX IF NOT EXISTS idx_boost_requests_expired ON boost_requests(expired);
CREATE INDEX IF NOT EXISTS idx_boost_requests_status_expired ON boost_requests(status, expired);
