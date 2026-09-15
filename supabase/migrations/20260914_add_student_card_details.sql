-- ====================================================================
-- THE ELEGANT PUBLIC SCHOOL - HEALTH RECORD MANAGEMENT SYSTEM (SHRMS)
-- MIGRATION: Add Student Card Details (Aadhaar, Address, Marks, Contact)
-- ====================================================================

ALTER TABLE public."Student" ADD COLUMN IF NOT EXISTS "aadhaarNumber" TEXT;
ALTER TABLE public."Student" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE public."Student" ADD COLUMN IF NOT EXISTS "identificationMarks" TEXT;
ALTER TABLE public."Student" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
