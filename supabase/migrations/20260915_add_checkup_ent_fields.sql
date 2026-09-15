-- Add ENT (Ear, Nose & Throat) columns to HealthCheckup table
ALTER TABLE "HealthCheckup" 
ADD COLUMN IF NOT EXISTS "entEars" TEXT DEFAULT 'Normal',
ADD COLUMN IF NOT EXISTS "entNose" TEXT DEFAULT 'Normal',
ADD COLUMN IF NOT EXISTS "entThroat" TEXT DEFAULT 'Normal',
ADD COLUMN IF NOT EXISTS "entRemarks" TEXT;
