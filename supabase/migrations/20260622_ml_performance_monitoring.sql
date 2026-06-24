-- Migration: Create ML performance monitoring tables
CREATE TABLE IF NOT EXISTS public.ml_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  training_dataset_version TEXT,
  hyperparameters JSONB,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(model_name, model_version)
);

CREATE TABLE IF NOT EXISTS public.ml_model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC(12, 6) NOT NULL,
  timeframe TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ml_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  prediction_id UUID,
  model_version TEXT NOT NULL,
  rule_output JSONB NOT NULL,
  ml_output JSONB NOT NULL,
  actual_output JSONB,
  difference JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ml_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  user_id UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ml_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_user_feedback ENABLE ROW LEVEL SECURITY;

-- Create public insert/select policies
CREATE POLICY "Allow public access to ml_model_versions" ON public.ml_model_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to ml_model_metrics" ON public.ml_model_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to ml_model_performance" ON public.ml_model_performance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to ml_user_feedback" ON public.ml_user_feedback FOR ALL USING (true) WITH CHECK (true);
