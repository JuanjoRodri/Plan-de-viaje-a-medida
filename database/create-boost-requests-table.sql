-- Crear tabla para solicitudes de boost
CREATE TABLE IF NOT EXISTS boost_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  itineraries_requested INTEGER DEFAULT 10,
  current_used INTEGER NOT NULL,
  current_limit INTEGER NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_boost_requests_user_id ON boost_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_boost_requests_status ON boost_requests(status);
CREATE INDEX IF NOT EXISTS idx_boost_requests_created_at ON boost_requests(created_at);

-- Comentarios para documentación
COMMENT ON TABLE boost_requests IS 'Solicitudes de itinerarios adicionales (boost) de los usuarios';
COMMENT ON COLUMN boost_requests.status IS 'Estado de la solicitud: pending, approved, rejected';
COMMENT ON COLUMN boost_requests.itineraries_requested IS 'Número de itinerarios solicitados (por defecto 10)';
COMMENT ON COLUMN boost_requests.current_used IS 'Itinerarios usados al momento de la solicitud';
COMMENT ON COLUMN boost_requests.current_limit IS 'Límite de itinerarios al momento de la solicitud';
