-- Añadir columna last_reset_date a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE;

-- Inicializar la columna con la fecha actual para usuarios existentes
-- Esto evita que se reseteen inmediatamente todos los contadores existentes
UPDATE users
SET last_reset_date = CURRENT_DATE
WHERE last_reset_date IS NULL;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_users_last_reset_date ON users(last_reset_date);

-- Verificar que la columna se añadió correctamente (opcional, puedes ejecutar esto para confirmar)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'last_reset_date';
