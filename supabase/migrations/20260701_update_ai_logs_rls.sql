-- Migration to allow service_role inserts for AI logs
-- 20260701_update_ai_logs_rls.sql

-- Enable RLS already done

-- Allow service_role to insert into ai_provider_logs without user check
CREATE POLICY "Service role can insert ai provider logs" ON public.ai_provider_logs
FOR INSERT TO service_role WITH CHECK (TRUE);

-- Allow service_role to insert into ai_usage_logs without user check
CREATE POLICY "Service role can insert ai usage logs" ON public.ai_usage_logs
FOR INSERT TO service_role WITH CHECK (TRUE);
