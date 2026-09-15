-- ====================================================================
-- THE ELEGANT PUBLIC SCHOOL - HEALTH RECORD MANAGEMENT SYSTEM (SHRMS)
-- PRODUCTION SUPABASE POSTGRESQL SCHEMA & VERIFIED DATA MIGRATION
-- Project: lnelcfeeuhvyylqmxrhp
-- Generated: 2026-09-14T05:17:20.713Z
-- ====================================================================

-- 1. EXTENSIONS & SCHEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES (Exact Parity with Prisma Schema)

-- Student Table
CREATE TABLE IF NOT EXISTS public."Student" (
    "admissionNumber" TEXT PRIMARY KEY,
    "studentName" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dob" TIMESTAMPTZ NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HealthCheckup Table
CREATE TABLE IF NOT EXISTS public."HealthCheckup" (
    "id" BIGSERIAL PRIMARY KEY,
    "admissionNumber" TEXT NOT NULL REFERENCES public."Student"("admissionNumber") ON DELETE CASCADE,
    "academicYear" TEXT NOT NULL,
    "checkupDate" TIMESTAMPTZ NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "eyesightLeft" TEXT NOT NULL,
    "eyesightRight" TEXT NOT NULL,
    "dentalHealth" TEXT NOT NULL,
    "bloodPressure" TEXT NOT NULL,
    "nutritionalStatus" TEXT NOT NULL,
    "nutritionRemarks" TEXT,
    "entEars" TEXT DEFAULT 'Normal',
    "entNose" TEXT DEFAULT 'Normal',
    "entThroat" TEXT DEFAULT 'Normal',
    "entRemarks" TEXT,
    "doctorName" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "HealthCheckup_admissionNumber_academicYear_key" UNIQUE ("admissionNumber", "academicYear")
);

-- Observation Table
CREATE TABLE IF NOT EXISTS public."Observation" (
    "id" BIGSERIAL PRIMARY KEY,
    "admissionNumber" TEXT NOT NULL REFERENCES public."Student"("admissionNumber") ON DELETE CASCADE,
    "academicYear" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immunization Table
CREATE TABLE IF NOT EXISTS public."Immunization" (
    "id" BIGSERIAL PRIMARY KEY,
    "admissionNumber" TEXT NOT NULL REFERENCES public."Student"("admissionNumber") ON DELETE CASCADE,
    "vaccine" TEXT NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "dose" TEXT NOT NULL,
    "nextDue" TIMESTAMPTZ,
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SpecialNeed Table
CREATE TABLE IF NOT EXISTS public."SpecialNeed" (
    "id" BIGSERIAL PRIMARY KEY,
    "admissionNumber" TEXT UNIQUE NOT NULL REFERENCES public."Student"("admissionNumber") ON DELETE CASCADE,
    "allergies" TEXT,
    "chronicIllness" TEXT,
    "disabilities" TEXT,
    "learningDifficulties" TEXT,
    "medication" TEXT,
    "emergencyNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attachment Table (Exact column uploadedDate)
CREATE TABLE IF NOT EXISTS public."Attachment" (
    "id" BIGSERIAL PRIMARY KEY,
    "admissionNumber" TEXT NOT NULL REFERENCES public."Student"("admissionNumber") ON DELETE CASCADE,
    "filename" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL,
    "uploadedDate" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor Table (Exact column password)
CREATE TABLE IF NOT EXISTS public."Doctor" (
    "id" BIGSERIAL PRIMARY KEY,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'doctor',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ActivityLog Table (Exact columns: actor, role, action, details, createdAt)
CREATE TABLE IF NOT EXISTS public."ActivityLog" (
    "id" BIGSERIAL PRIMARY KEY,
    "actor" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS "Student_studentName_idx" ON public."Student"("studentName");
CREATE INDEX IF NOT EXISTS "Student_class_section_idx" ON public."Student"("class", "section");
CREATE INDEX IF NOT EXISTS "HealthCheckup_academicYear_idx" ON public."HealthCheckup"("academicYear");
CREATE INDEX IF NOT EXISTS "HealthCheckup_admissionNumber_idx" ON public."HealthCheckup"("admissionNumber");
CREATE INDEX IF NOT EXISTS "HealthCheckup_checkupDate_idx" ON public."HealthCheckup"("checkupDate" DESC);
CREATE INDEX IF NOT EXISTS "Observation_admissionNumber_idx" ON public."Observation"("admissionNumber");
CREATE INDEX IF NOT EXISTS "Observation_academicYear_idx" ON public."Observation"("academicYear");
CREATE INDEX IF NOT EXISTS "Immunization_admissionNumber_idx" ON public."Immunization"("admissionNumber");
CREATE INDEX IF NOT EXISTS "Immunization_vaccine_idx" ON public."Immunization"("vaccine");
CREATE INDEX IF NOT EXISTS "Immunization_nextDue_idx" ON public."Immunization"("nextDue") WHERE "nextDue" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Attachment_admissionNumber_idx" ON public."Attachment"("admissionNumber");
CREATE INDEX IF NOT EXISTS "ActivityLog_createdAt_idx" ON public."ActivityLog"("createdAt" DESC);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES & GRANTS (STRICT SECURITY)
ALTER TABLE public."Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."HealthCheckup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Observation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Immunization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SpecialNeed" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Doctor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Public tables: allow SELECT to anon and authenticated
GRANT SELECT ON public."Student" TO anon, authenticated;
GRANT SELECT ON public."HealthCheckup" TO anon, authenticated;
GRANT SELECT ON public."Observation" TO anon, authenticated;
GRANT SELECT ON public."Immunization" TO anon, authenticated;
GRANT SELECT ON public."SpecialNeed" TO anon, authenticated;
GRANT SELECT ON public."Attachment" TO anon, authenticated;

-- Full CRUD for authenticated staff and service role only
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Policies:
DO $$
BEGIN
    -- Read policies for public & parent portal
    DROP POLICY IF EXISTS "Public read students" ON public."Student";
    CREATE POLICY "Public read students" ON public."Student" FOR SELECT TO anon, authenticated, service_role USING (true);

    DROP POLICY IF EXISTS "Public read checkups" ON public."HealthCheckup";
    CREATE POLICY "Public read checkups" ON public."HealthCheckup" FOR SELECT TO anon, authenticated, service_role USING (true);

    DROP POLICY IF EXISTS "Public read observations" ON public."Observation";
    CREATE POLICY "Public read observations" ON public."Observation" FOR SELECT TO anon, authenticated, service_role USING (true);

    DROP POLICY IF EXISTS "Public read immunizations" ON public."Immunization";
    CREATE POLICY "Public read immunizations" ON public."Immunization" FOR SELECT TO anon, authenticated, service_role USING (true);

    DROP POLICY IF EXISTS "Public read special needs" ON public."SpecialNeed";
    CREATE POLICY "Public read special needs" ON public."SpecialNeed" FOR SELECT TO anon, authenticated, service_role USING (true);

    DROP POLICY IF EXISTS "Public read attachments" ON public."Attachment";
    CREATE POLICY "Public read attachments" ON public."Attachment" FOR SELECT TO anon, authenticated, service_role USING (true);

    -- Write policies restricted to authenticated staff and service role (NEVER anon)
    DROP POLICY IF EXISTS "Staff write students" ON public."Student";
    CREATE POLICY "Staff write students" ON public."Student" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff write checkups" ON public."HealthCheckup";
    CREATE POLICY "Staff write checkups" ON public."HealthCheckup" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff write observations" ON public."Observation";
    CREATE POLICY "Staff write observations" ON public."Observation" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff write immunizations" ON public."Immunization";
    CREATE POLICY "Staff write immunizations" ON public."Immunization" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff write special needs" ON public."SpecialNeed";
    CREATE POLICY "Staff write special needs" ON public."SpecialNeed" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff write attachments" ON public."Attachment";
    CREATE POLICY "Staff write attachments" ON public."Attachment" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff write activity" ON public."ActivityLog";
    CREATE POLICY "Staff write activity" ON public."ActivityLog" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Staff manage doctors" ON public."Doctor";
    CREATE POLICY "Staff manage doctors" ON public."Doctor" FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);
END $$;

