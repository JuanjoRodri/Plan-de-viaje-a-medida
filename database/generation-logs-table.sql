-- Crear tabla para logs de generación de itinerarios
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    destination TEXT NOT NULL,
    days INTEGER NOT NULL,
    total_attempts INTEGER NOT NULL,
    final_success BOOLEAN NOT NULL,
    total_duration INTEGER NOT NULL, -- en milisegundos
    attempts_detail JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_logs_success ON generation_logs(final_success);
CREATE INDEX IF NOT EXISTS idx_generation_logs_destination ON generation_logs(destination);

-- Comentarios para documentación
COMMENT ON TABLE generation_logs IS 'Logs de generación de itinerarios para análisis de calidad';
COMMENT ON COLUMN generation_logs.destination IS 'Destino del itinerario generado';
COMMENT ON COLUMN generation_logs.days IS 'Número de días del itinerario';
COMMENT ON COLUMN generation_logs.total_attempts IS 'Número total de intentos realizados';
COMMENT ON COLUMN generation_logs.final_success IS 'Si la generación fue exitosa finalmente';
COMMENT ON COLUMN generation_logs.total_duration IS 'Duración total en milisegundos';
COMMENT ON COLUMN generation_logs.attempts_detail IS 'Detalles de cada intento en formato JSON';
