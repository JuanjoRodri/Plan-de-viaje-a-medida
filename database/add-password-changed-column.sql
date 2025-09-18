-- Añadir columna para controlar cambio obligatorio de contraseña
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT false;

-- Marcar usuarios existentes como que ya cambiaron contraseña (para no afectarlos)
UPDATE users SET password_changed = true WHERE password_changed IS NULL;

-- Verificar que se añadió correctamente
SELECT id, email, password_changed FROM users LIMIT 5;
