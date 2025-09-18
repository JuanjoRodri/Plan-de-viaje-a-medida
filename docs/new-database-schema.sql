-- NUEVA ESTRUCTURA COMPLETA PARA MIGRACIÓN A SUPABASE
-- Basada en auditoría de localStorage vs estructura actual

-- 1. AMPLIAR TABLA ITINERARIES EXISTENTE
ALTER TABLE itineraries 
ADD COLUMN IF NOT EXISTS nights INTEGER,
ADD COLUMN IF NOT EXISTS hotel TEXT,
ADD COLUMN IF NOT EXISTS arrival_time TEXT,
ADD COLUMN IF NOT EXISTS departure_time TEXT,
ADD COLUMN IF NOT EXISTS weather_data JSONB,
ADD COLUMN IF NOT EXISTS budget_details JSONB,
ADD COLUMN IF NOT EXISTS transport_info JSONB,
ADD COLUMN IF NOT EXISTS board_type TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,

-- Campos para gestión de historial y estado
ADD COLUMN IF NOT EXISTS is_history BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS auto_saved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generation_params JSONB,

-- Campos para metadatos adicionales
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS shared_with UUID[],
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES users(id);

-- 2. CREAR ÍNDICES PARA OPTIMIZAR CONSULTAS
CREATE INDEX IF NOT EXISTS idx_itineraries_user_history ON itineraries(user_id, is_history);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_current ON itineraries(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_itineraries_last_viewed ON itineraries(user_id, last_viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries(destination);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON itineraries(created_at DESC);

-- 3. CREAR TABLA PARA CONFIGURACIONES DE USUARIO
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  max_history_items INTEGER DEFAULT 20,
  auto_save_enabled BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  default_budget_type TEXT DEFAULT 'medio',
  default_board_type TEXT DEFAULT 'desayuno',
  preferred_destinations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. CREAR TABLA PARA ACTIVIDAD/LOGS
CREATE TABLE IF NOT EXISTS itinerary_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'created', 'viewed', 'edited', 'shared', 'deleted'
  action_details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_activity ENABLE ROW LEVEL SECURITY;

-- Política para itineraries: usuarios solo ven sus propios itinerarios
CREATE POLICY IF NOT EXISTS "Users can view own itineraries" ON itineraries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can insert own itineraries" ON itineraries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update own itineraries" ON itineraries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete own itineraries" ON itineraries
  FOR DELETE USING (user_id = auth.uid());

-- Política para user_preferences
CREATE POLICY IF NOT EXISTS "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Política para itinerary_activity
CREATE POLICY IF NOT EXISTS "Users can view own activity" ON itinerary_activity
  FOR SELECT USING (user_id = auth.uid());

-- 6. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_itineraries_updated_at 
  BEFORE UPDATE ON itineraries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. FUNCIÓN PARA LIMPIAR HISTORIAL ANTIGUO
CREATE OR REPLACE FUNCTION cleanup_old_history()
RETURNS void AS $$
BEGIN
  -- Eliminar historial más antiguo si un usuario tiene más de max_history_items
  WITH user_limits AS (
    SELECT 
      u.id as user_id,
      COALESCE(up.max_history_items, 20) as max_items
    FROM users u
    LEFT JOIN user_preferences up ON u.id = up.user_id
  ),
  ranked_history AS (
    SELECT 
      i.id,
      i.user_id,
      ROW_NUMBER() OVER (PARTITION BY i.user_id ORDER BY i.last_viewed_at DESC) as rn,
      ul.max_items
    FROM itineraries i
    JOIN user_limits ul ON i.user_id = ul.user_id
    WHERE i.is_history = true
  )
  DELETE FROM itineraries 
  WHERE id IN (
    SELECT id FROM ranked_history WHERE rn > max_items
  );
END;
$$ LANGUAGE plpgsql;

-- 8. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON COLUMN itineraries.is_history IS 'Marca si el itinerario es parte del historial automático';
COMMENT ON COLUMN itineraries.is_current IS 'Marca si es el itinerario actualmente mostrado';
COMMENT ON COLUMN itineraries.is_favorite IS 'Marca si el usuario lo marcó como favorito';
COMMENT ON COLUMN itineraries.auto_saved IS 'Indica si se guardó automáticamente o manualmente';
COMMENT ON COLUMN itineraries.generation_params IS 'Parámetros usados para generar el itinerario (JSON)';
COMMENT ON COLUMN itineraries.weather_data IS 'Datos del clima en formato JSON';
COMMENT ON COLUMN itineraries.budget_details IS 'Detalles del presupuesto en formato JSON';
COMMENT ON COLUMN itineraries.transport_info IS 'Información de transporte en formato JSON';
