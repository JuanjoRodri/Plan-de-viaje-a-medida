-- Añadir columna total_price a la tabla boost_requests
ALTER TABLE boost_requests 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- Comentario para documentación
COMMENT ON COLUMN boost_requests.total_price IS 'Precio total de la solicitud de boost';

-- Actualizar registros existentes con precio por defecto (10 * €5 = €50)
UPDATE boost_requests 
SET total_price = itineraries_requested * 5.0 
WHERE total_price IS NULL;
