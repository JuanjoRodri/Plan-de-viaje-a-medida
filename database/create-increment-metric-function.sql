-- Crear función para incrementar métricas de forma segura
CREATE OR REPLACE FUNCTION increment_metric(metric_name_param TEXT, increment_value INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.metrics
  SET metric_value = metric_value + increment_value
  WHERE metric_name = metric_name_param;
  
  -- Si no se actualizó ninguna fila, insertar una nueva
  IF NOT FOUND THEN
    INSERT INTO public.metrics (metric_name, metric_value)
    VALUES (metric_name_param, increment_value);
  END IF;
END;
$$;
