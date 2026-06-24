-- Migration: Add data_source column to ML dataset tables
ALTER TABLE public.ml_trip_dataset ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE public.ml_budget_dataset ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user' NOT NULL;
ALTER TABLE public.ml_activity_dataset ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'user' NOT NULL;
