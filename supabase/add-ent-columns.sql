-- Run this SQL in Supabase Dashboard → SQL Editor
-- This adds the ENT columns that were added in a later migration

ALTER TABLE public."HealthCheckup"
  ADD COLUMN IF NOT EXISTS "entEars"   TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS "entNose"   TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS "entThroat" TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS "entRemarks" TEXT;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'HealthCheckup'
ORDER BY ordinal_position;
