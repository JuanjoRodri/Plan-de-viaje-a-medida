-- Agregar campo para itinerarios de boost guardados
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS boost_itineraries_saved INTEGER DEFAULT 0;

-- Comentario para verificar
COMMENT ON COLUMN users.boost_itineraries_saved IS 'Itinerarios de boost guardados del mes anterior';
