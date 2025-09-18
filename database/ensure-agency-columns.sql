-- Asegurar que todas las columnas de información de agencia existen en la tabla users
DO $$ 
BEGIN
    -- Verificar y añadir columna agency_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agency_name') THEN
        ALTER TABLE users ADD COLUMN agency_name TEXT;
        RAISE NOTICE 'Columna agency_name añadida';
    END IF;

    -- Verificar y añadir columna agency_phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agency_phone') THEN
        ALTER TABLE users ADD COLUMN agency_phone TEXT;
        RAISE NOTICE 'Columna agency_phone añadida';
    END IF;

    -- Verificar y añadir columna agency_email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agency_email') THEN
        ALTER TABLE users ADD COLUMN agency_email TEXT;
        RAISE NOTICE 'Columna agency_email añadida';
    END IF;

    -- Verificar y añadir columna agent_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agent_name') THEN
        ALTER TABLE users ADD COLUMN agent_name TEXT;
        RAISE NOTICE 'Columna agent_name añadida';
    END IF;

    -- Verificar y añadir columna agency_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agency_address') THEN
        ALTER TABLE users ADD COLUMN agency_address TEXT;
        RAISE NOTICE 'Columna agency_address añadida';
    END IF;

    -- Verificar y añadir columna agency_website
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agency_website') THEN
        ALTER TABLE users ADD COLUMN agency_website TEXT;
        RAISE NOTICE 'Columna agency_website añadida';
    END IF;

    -- Verificar y añadir columna agency_logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'agency_logo_url') THEN
        ALTER TABLE users ADD COLUMN agency_logo_url TEXT;
        RAISE NOTICE 'Columna agency_logo_url añadida';
    END IF;

    -- Verificar y añadir columna branding_updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'branding_updated_at') THEN
        ALTER TABLE users ADD COLUMN branding_updated_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna branding_updated_at añadida';
    END IF;

END $$;

-- Verificar que las columnas existen
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'agency_name', 
    'agency_phone', 
    'agency_email', 
    'agent_name', 
    'agency_address', 
    'agency_website', 
    'agency_logo_url',
    'branding_updated_at'
)
ORDER BY column_name;
