-- Función auxiliar para ejecutar SQL dinámico desde la API
-- Necesaria para poder agregar columnas desde el código

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos necesarios (ajustar según tu configuración)
-- GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;
