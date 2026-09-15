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

-- 5. DATA POPULATION (52 students, 187 checkups, 24 observations)

-- 5.1 Students
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM001', 'Aarav Sharma', 'VI', 'A', 'Male', '2013-05-14T00:00:00.000Z', 'O+', 'Rajesh Sharma', '+91 98765 43210', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM002', 'Ananya Iyer', 'I', 'B', 'Female', '2020-09-08T00:00:00.000Z', 'A+', 'Sunita Iyer', '+91 98111 22334', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM003', 'Vihaan Patel', 'I', 'A', 'Male', '2020-11-02T00:00:00.000Z', 'B+', 'Kiran Patel', '+91 98220 31415', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM004', 'Diya Reddy', 'I', 'C', 'Female', '2020-07-19T00:00:00.000Z', 'AB+', 'Srinivas Reddy', '+91 98334 45667', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM005', 'Arjun Nair', 'II', 'A', 'Male', '2019-04-03T00:00:00.000Z', 'O-', 'Meera Nair', '+91 98445 56778', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM006', 'Saanvi Gupta', 'II', 'B', 'Female', '2019-10-30T00:00:00.000Z', 'A-', 'Pankaj Gupta', '+91 98556 67889', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM007', 'Kabir Singh', 'II', 'A', 'Male', '2019-06-21T00:00:00.000Z', 'B-', 'Harpreet Singh', '+91 98667 78990', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM008', 'Isha Chatterjee', 'II', 'C', 'Female', '2019-12-05T00:00:00.000Z', 'O+', 'Debjani Chatterjee', '+91 98778 89001', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM009', 'Aditya Verma', 'III', 'A', 'Male', '2018-09-14T00:00:00.000Z', 'A+', 'Sanjay Verma', '+91 98889 90112', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM010', 'Myra Kapoor', 'III', 'B', 'Female', '2018-05-27T00:00:00.000Z', 'AB-', 'Rohit Kapoor', '+91 98990 01223', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM011', 'Rehan Khan', 'III', 'A', 'Male', '2018-03-15T00:00:00.000Z', 'B+', 'Imran Khan', '+91 99110 12334', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM012', 'Pooja Hegde', 'III', 'C', 'Female', '2018-11-08T00:00:00.000Z', 'O+', 'Ramesh Hegde', '+91 99220 23445', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM013', 'Rohan Deshmukh', 'IV', 'A', 'Male', '2017-02-18T00:00:00.000Z', 'A+', 'Milind Deshmukh', '+91 99331 34556', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM014', 'Tanvi Kulkarni', 'IV', 'B', 'Female', '2017-06-25T00:00:00.000Z', 'B+', 'Sachin Kulkarni', '+91 99442 45667', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM015', 'Siddharth Rao', 'IV', 'A', 'Male', '2017-08-12T00:00:00.000Z', 'O+', 'Venkat Rao', '+91 99553 56778', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM016', 'Meera Nambiar', 'IV', 'C', 'Female', '2017-10-04T00:00:00.000Z', 'AB+', 'Gopal Nambiar', '+91 99664 67889', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM017', 'Aryan Joshi', 'V', 'A', 'Male', '2016-01-22T00:00:00.000Z', 'B-', 'Mahesh Joshi', '+91 99775 78990', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM018', 'Riya Sen', 'V', 'B', 'Female', '2016-04-16T00:00:00.000Z', 'O-', 'Alok Sen', '+91 99886 89001', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM019', 'Devansh Bhatt', 'V', 'A', 'Male', '2016-07-29T00:00:00.000Z', 'A-', 'Chetan Bhatt', '+91 99997 90112', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM020', 'Shreya Das', 'V', 'C', 'Female', '2016-12-11T00:00:00.000Z', 'A+', 'Subhash Das', '+91 98112 01223', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM021', 'Neil Mukherjee', 'VI', 'A', 'Male', '2015-03-09T00:00:00.000Z', 'O+', 'Soumitra Mukherjee', '+91 98223 12334', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM022', 'Avani Pillai', 'VI', 'B', 'Female', '2015-05-30T00:00:00.000Z', 'B+', 'Unnikrishnan Pillai', '+91 98334 23445', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM023', 'Yashwant Chauhan', 'VI', 'A', 'Male', '2015-09-14T00:00:00.000Z', 'AB-', 'Vikram Chauhan', '+91 98445 34556', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM024', 'Kripa Menon', 'VI', 'C', 'Female', '2015-11-20T00:00:00.000Z', 'A+', 'Radhika Menon', '+91 98556 45667', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM025', 'Pranav Goel', 'VII', 'A', 'Male', '2014-02-14T00:00:00.000Z', 'O-', 'Ashok Goel', '+91 98667 56778', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM026', 'Sneha Bhatnagar', 'VII', 'B', 'Female', '2014-06-08T00:00:00.000Z', 'B-', 'Praveen Bhatnagar', '+91 98778 67889', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM027', 'Farhan Zaidi', 'VII', 'A', 'Male', '2014-08-27T00:00:00.000Z', 'A+', 'Naveed Zaidi', '+91 98889 78990', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM028', 'Natasha Roy', 'VII', 'C', 'Female', '2014-10-15T00:00:00.000Z', 'AB+', 'Sandip Roy', '+91 98990 89001', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM029', 'Harsh Vardhan', 'VIII', 'A', 'Male', '2013-01-19T00:00:00.000Z', 'B+', 'Rajiv Vardhan', '+91 99111 90112', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM030', 'Lavanya Sundaram', 'VIII', 'B', 'Female', '2013-04-24T00:00:00.000Z', 'O+', 'Sundaram Raman', '+91 99222 01223', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM031', 'Chirag Sethi', 'VIII', 'A', 'Male', '2013-07-11T00:00:00.000Z', 'A-', 'Varun Sethi', '+91 99333 12334', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM032', 'Anvi Saxena', 'VIII', 'C', 'Female', '2013-11-03T00:00:00.000Z', 'O-', 'Gaurav Saxena', '+91 99444 23445', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM033', 'Dhruv Singhal', 'IX', 'A', 'Male', '2012-02-05T00:00:00.000Z', 'AB-', 'Deepak Singhal', '+91 99555 34556', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM034', 'Tara Swaminathan', 'IX', 'B', 'Female', '2012-05-19T00:00:00.000Z', 'A+', 'Swaminathan Krishnan', '+91 99666 45667', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM035', 'Manav Bajaj', 'IX', 'A', 'Male', '2012-08-22T00:00:00.000Z', 'B+', 'Sunil Bajaj', '+91 99777 56778', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM036', 'Kritika Bansal', 'IX', 'C', 'Female', '2012-10-31T00:00:00.000Z', 'O+', 'Anil Bansal', '+91 99888 67889', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM037', 'Samar Malhotra', 'X', 'A', 'Male', '2011-03-12T00:00:00.000Z', 'O+', 'Ajay Malhotra', '+91 99999 78990', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM038', 'Ishita Bose', 'X', 'B', 'Female', '2011-06-17T00:00:00.000Z', 'B-', 'Subrata Bose', '+91 98111 89001', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM039', 'Varun Chawla', 'X', 'A', 'Male', '2011-09-09T00:00:00.000Z', 'A+', 'Vivek Chawla', '+91 98222 90112', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM040', 'Pallavi Dixit', 'X', 'C', 'Female', '2011-12-28T00:00:00.000Z', 'AB+', 'Manoj Dixit', '+91 98333 01223', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM041', 'Nikhil Tandon', 'XI', 'A', 'Male', '2010-01-25T00:00:00.000Z', 'B+', 'Pawan Tandon', '+91 98444 12334', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM042', 'Sanjana Mehra', 'XI', 'B', 'Female', '2010-04-14T00:00:00.000Z', 'O-', 'Rajan Mehra', '+91 98555 23445', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM043', 'Ayush Agrawal', 'XI', 'A', 'Male', '2010-07-07T00:00:00.000Z', 'A-', 'Mukesh Agrawal', '+91 98666 34556', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM044', 'Divya Somani', 'XI', 'C', 'Female', '2010-11-18T00:00:00.000Z', 'A+', 'Naval Somani', '+91 98777 45667', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM045', 'Ritwik Ghosh', 'XII', 'A', 'Male', '2009-02-28T00:00:00.000Z', 'AB-', 'Prabir Ghosh', '+91 98888 56778', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM046', 'Mehak Chhabra', 'XII', 'B', 'Female', '2009-05-15T00:00:00.000Z', 'B+', 'Inderjit Chhabra', '+91 98999 67889', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM047', 'Tejas Pandita', 'XII', 'A', 'Male', '2009-08-20T00:00:00.000Z', 'O+', 'Kuldeep Pandita', '+91 99112 78990', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM048', 'Gauri Nanda', 'XII', 'C', 'Female', '2009-12-04T00:00:00.000Z', 'A+', 'Harish Nanda', '+91 99223 89001', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM049', 'Kevin D''Souza', 'V', 'B', 'Male', '2016-09-15T00:00:00.000Z', 'B+', 'Anthony D''Souza', '+91 99334 90112', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM050', 'Zoya Siddiqui', 'VI', 'A', 'Female', '2015-04-20T00:00:00.000Z', 'O+', 'Tariq Siddiqui', '+91 99445 01223', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM051', 'Omkar Salunke', 'VII', 'B', 'Male', '2014-11-12T00:00:00.000Z', 'A+', 'Dattatray Salunke', '+91 99556 12334', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")
VALUES ('ADM052', 'Fatima Sheikh', 'VIII', 'A', 'Female', '2013-08-05T00:00:00.000Z', 'AB+', 'Farooq Sheikh', '+91 99667 23445', '2026-09-11T10:07:25.381Z', '2026-09-11T10:07:25.381Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "studentName" = EXCLUDED."studentName", "class" = EXCLUDED."class", "section" = EXCLUDED."section", "updatedAt" = EXCLUDED."updatedAt";

-- 5.2 Doctors & Staff Accounts
INSERT INTO public."Doctor" ("id", "username", "password", "name", "role", "createdAt")
VALUES (9, 'admin', '$2b$10$eKk6o9n3YnLbOUZUFaRGduh6rAnc8sEV.zNoXUQfjypshcVCQSN5C', 'Dr. Admin', 'admin', '2026-09-11T10:07:25.370Z')
ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password", "name" = EXCLUDED."name";
INSERT INTO public."Doctor" ("id", "username", "password", "name", "role", "createdAt")
VALUES (10, 'drmehta', '$2b$10$eqOBAnzWTwg01dRwHBSy4uT3y5gSFqa3y5/BYdx5tgapccDiKBBHK', 'Dr. Anita Mehta', 'doctor', '2026-09-11T10:07:25.370Z')
ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password", "name" = EXCLUDED."name";
INSERT INTO public."Doctor" ("id", "username", "password", "name", "role", "createdAt")
VALUES (11, 'drsharma', '$2b$10$rLjNU.kWacPExCPpzMNCqOQ/9OW5AI2vuBa6Q3gnGmLfwFDs7IiFK', 'Dr. Rajesh Sharma', 'doctor', '2026-09-11T10:07:25.370Z')
ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password", "name" = EXCLUDED."name";
INSERT INTO public."Doctor" ("id", "username", "password", "name", "role", "createdAt")
VALUES (12, 'nursepriya', '$2b$10$BCIpyWDHmFppoU/IpyKSx.5EVnSDJjg3y4M/Sng2a4oeLhiXZgPu2', 'Nurse Priya Sen', 'doctor', '2026-09-11T10:07:25.370Z')
ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password", "name" = EXCLUDED."name";

-- 5.3 Health Checkups
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (257, 'ADM001', '2023-2024', '2023-05-05T00:00:00.000Z', 141, 33, 16.6, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (258, 'ADM001', '2024-2025', '2024-05-05T00:00:00.000Z', 146.5, 35.5, 16.5, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (259, 'ADM001', '2025-2026', '2025-05-05T00:00:00.000Z', 152, 38, 16.4, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (260, 'ADM001', '2026-2027', '2026-05-05T00:00:00.000Z', 157.5, 40.5, 16.3, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (261, 'ADM002', '2024-2025', '2024-06-08T00:00:00.000Z', 102, 15.8, 15.2, '6/6', '6/6', 'Minor Issues', '92/58', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (262, 'ADM002', '2025-2026', '2025-06-08T00:00:00.000Z', 107.2, 17.8, 15.5, '6/6', '6/6', 'Healthy', '94/60', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (263, 'ADM002', '2026-2027', '2026-06-08T00:00:00.000Z', 112.4, 19.8, 15.7, '6/6', '6/6', 'Healthy', '96/62', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (264, 'ADM003', '2024-2025', '2024-07-11T00:00:00.000Z', 101, 13.2, 12.9, '6/6', '6/6', 'Healthy', '90/58', 'Underweight', 'BMI below 15th percentile; advised protein-rich mid-day snacks and iron drops', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (265, 'ADM003', '2025-2026', '2025-07-11T00:00:00.000Z', 106, 14.8, 13.2, '6/6', '6/6', 'Healthy', '92/60', 'Underweight', 'BMI below 15th percentile; advised protein-rich mid-day snacks and iron drops', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (266, 'ADM003', '2026-2027', '2026-07-11T00:00:00.000Z', 111, 16.4, 13.3, '6/6', '6/6', 'Healthy', '94/62', 'Underweight', 'BMI below 15th percentile; advised protein-rich mid-day snacks and iron drops', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (267, 'ADM004', '2025-2026', '2025-08-14T00:00:00.000Z', 103, 16, 15.1, '6/6', '6/6', 'Healthy', '94/60', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (268, 'ADM005', '2023-2024', '2023-05-17T00:00:00.000Z', 111, 18.5, 15, '6/9', '6/9', 'Healthy', '96/62', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (269, 'ADM005', '2024-2025', '2024-05-17T00:00:00.000Z', 116.4, 20.7, 15.3, '6/9', '6/9', 'Healthy', '98/64', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (270, 'ADM005', '2025-2026', '2025-05-17T00:00:00.000Z', 121.8, 22.9, 15.4, '6/9', '6/9', 'Healthy', '100/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (271, 'ADM005', '2026-2027', '2026-05-17T00:00:00.000Z', 127.2, 25.1, 15.5, '6/6', '6/6', 'Healthy', '102/68', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (272, 'ADM006', '2023-2024', '2023-06-20T00:00:00.000Z', 109, 15, 12.6, '6/6', '6/6', 'Healthy', '94/60', 'Underweight', 'Borderline underweight; banana & peanut butter supplementary snack advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (273, 'ADM006', '2024-2025', '2024-06-20T00:00:00.000Z', 114.2, 16.7, 12.8, '6/6', '6/6', 'Healthy', '96/62', 'Underweight', 'Borderline underweight; banana & peanut butter supplementary snack advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (274, 'ADM006', '2025-2026', '2025-06-20T00:00:00.000Z', 119.4, 18.4, 12.9, '6/6', '6/6', 'Healthy', '98/64', 'Underweight', 'Borderline underweight; banana & peanut butter supplementary snack advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (275, 'ADM007', '2023-2024', '2023-07-23T00:00:00.000Z', 113, 25.5, 20, '6/6', '6/6', 'Healthy', '104/66', 'Obese', 'Rapid weight velocity; restrict fried cafeteria snacks and enroll in evening swimming', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (276, 'ADM007', '2024-2025', '2024-07-23T00:00:00.000Z', 118.3, 29, 20.7, '6/6', '6/6', 'Minor Issues', '106/68', 'Obese', 'Rapid weight velocity; restrict fried cafeteria snacks and enroll in evening swimming', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (277, 'ADM007', '2025-2026', '2025-07-23T00:00:00.000Z', 123.6, 32.5, 21.3, '6/6', '6/6', 'Cavities', '108/70', 'Obese', 'Rapid weight velocity; restrict fried cafeteria snacks and enroll in evening swimming', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (278, 'ADM007', '2026-2027', '2026-07-23T00:00:00.000Z', 128.9, 36, 21.7, '6/6', '6/6', 'Cavities', '110/72', 'Obese', 'Rapid weight velocity; restrict fried cafeteria snacks and enroll in evening swimming', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (279, 'ADM008', '2023-2024', '2023-08-06T00:00:00.000Z', 110, 18, 14.9, '6/12', '6/9', 'Healthy', '96/60', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (280, 'ADM008', '2024-2025', '2024-08-06T00:00:00.000Z', 115.2, 20.1, 15.1, '6/9', '6/9', 'Healthy', '98/62', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (281, 'ADM008', '2025-2026', '2025-08-06T00:00:00.000Z', 120.4, 22.2, 15.3, '6/6', '6/6', 'Healthy', '100/64', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (282, 'ADM008', '2026-2027', '2026-08-06T00:00:00.000Z', 125.6, 24.3, 15.4, '6/6', '6/6', 'Healthy', '102/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (283, 'ADM009', '2023-2024', '2023-05-09T00:00:00.000Z', 118, 21, 15.1, '6/6', '6/6', 'Healthy', '98/62', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (284, 'ADM009', '2024-2025', '2024-05-09T00:00:00.000Z', 123.4, 23.4, 15.4, '6/6', '6/6', 'Minor Issues', '100/64', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (285, 'ADM009', '2025-2026', '2025-05-09T00:00:00.000Z', 128.8, 25.8, 15.6, '6/6', '6/6', 'Healthy', '102/66', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (286, 'ADM009', '2026-2027', '2026-05-09T00:00:00.000Z', 134.2, 28.2, 15.7, '6/6', '6/6', 'Healthy', '104/68', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (287, 'ADM010', '2023-2024', '2023-06-12T00:00:00.000Z', 117, 25, 18.3, '6/6', '6/6', 'Healthy', '100/64', 'Overweight', 'Trending overweight; reduce fruit juices and monitor portion size', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (288, 'ADM010', '2024-2025', '2024-06-12T00:00:00.000Z', 122.3, 27.9, 18.7, '6/6', '6/6', 'Healthy', '102/66', 'Overweight', 'Trending overweight; reduce fruit juices and monitor portion size', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (289, 'ADM010', '2025-2026', '2025-06-12T00:00:00.000Z', 127.6, 30.8, 18.9, '6/6', '6/6', 'Healthy', '104/68', 'Overweight', 'Trending overweight; reduce fruit juices and monitor portion size', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (290, 'ADM011', '2023-2024', '2023-07-15T00:00:00.000Z', 120, 22, 15.3, '6/6', '6/6', 'Healthy', '98/62', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (291, 'ADM011', '2024-2025', '2024-07-15T00:00:00.000Z', 125.6, 24.5, 15.5, '6/6', '6/6', 'Healthy', '100/64', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (292, 'ADM011', '2025-2026', '2025-07-15T00:00:00.000Z', 131.2, 27, 15.7, '6/6', '6/6', 'Cavities', '102/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (293, 'ADM011', '2026-2027', '2026-07-15T00:00:00.000Z', 136.8, 29.5, 15.8, '6/6', '6/6', 'Cavities', '104/68', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (294, 'ADM012', '2023-2024', '2023-08-18T00:00:00.000Z', 116, 16.5, 12.3, '6/6', '6/6', 'Healthy', '94/58', 'Malnourished', 'Significant nutritional deficit; clinical signs of mild pallor, multivitamins prescribed', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (295, 'ADM012', '2024-2025', '2024-08-18T00:00:00.000Z', 120.8, 18, 12.3, '6/6', '6/6', 'Healthy', '96/60', 'Malnourished', 'Significant nutritional deficit; clinical signs of mild pallor, multivitamins prescribed', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (296, 'ADM012', '2025-2026', '2025-08-18T00:00:00.000Z', 125.6, 19.5, 12.4, '6/6', '6/6', 'Healthy', '98/62', 'Malnourished', 'Significant nutritional deficit; clinical signs of mild pallor, multivitamins prescribed', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (297, 'ADM013', '2023-2024', '2023-05-21T00:00:00.000Z', 124, 24.5, 15.9, '6/6', '6/6', 'Healthy', '100/64', 'Normal', 'Type 1 Diabetic; regular blood sugar logs reviewed, excellent control', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (298, 'ADM013', '2024-2025', '2024-05-21T00:00:00.000Z', 129.5, 27, 16.1, '6/6', '6/6', 'Healthy', '102/66', 'Normal', 'Type 1 Diabetic; regular blood sugar logs reviewed, excellent control', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (299, 'ADM013', '2025-2026', '2025-05-21T00:00:00.000Z', 135, 29.5, 16.2, '6/6', '6/6', 'Healthy', '104/68', 'Normal', 'Type 1 Diabetic; regular blood sugar logs reviewed, excellent control', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (300, 'ADM013', '2026-2027', '2026-05-21T00:00:00.000Z', 140.5, 32, 16.2, '6/6', '6/6', 'Healthy', '106/70', 'Normal', 'Type 1 Diabetic; regular blood sugar logs reviewed, excellent control', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (301, 'ADM014', '2023-2024', '2023-06-24T00:00:00.000Z', 122, 23, 15.5, '6/6', '6/6', 'Minor Issues', '98/62', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (302, 'ADM014', '2024-2025', '2024-06-24T00:00:00.000Z', 127.3, 25.3, 15.6, '6/6', '6/6', 'Healthy', '100/64', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (303, 'ADM014', '2025-2026', '2025-06-24T00:00:00.000Z', 132.6, 27.6, 15.7, '6/6', '6/6', 'Healthy', '102/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (304, 'ADM014', '2026-2027', '2026-06-24T00:00:00.000Z', 137.9, 29.9, 15.7, '6/6', '6/6', 'Healthy', '104/68', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (305, 'ADM015', '2023-2024', '2023-07-07T00:00:00.000Z', 125, 25, 16, '6/6', '6/6', 'Healthy', '102/64', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (306, 'ADM015', '2024-2025', '2024-07-07T00:00:00.000Z', 130.5, 27.6, 16.2, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (307, 'ADM015', '2025-2026', '2025-07-07T00:00:00.000Z', 136, 30.2, 16.3, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (308, 'ADM016', '2023-2024', '2023-08-10T00:00:00.000Z', 121, 20.5, 14, '6/6', '6/6', 'Healthy', '96/62', 'Underweight', 'Celiac disease on strict gluten-free diet; gut absorption improving steadily', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (309, 'ADM016', '2024-2025', '2024-08-10T00:00:00.000Z', 126.1, 22.5, 14.1, '6/6', '6/6', 'Healthy', '98/64', 'Underweight', 'Celiac disease on strict gluten-free diet; gut absorption improving steadily', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (310, 'ADM016', '2025-2026', '2025-08-10T00:00:00.000Z', 131.2, 24.5, 14.2, '6/6', '6/6', 'Healthy', '100/66', 'Underweight', 'Celiac disease on strict gluten-free diet; gut absorption improving steadily', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (311, 'ADM016', '2026-2027', '2026-08-10T00:00:00.000Z', 136.3, 26.5, 14.3, '6/6', '6/6', 'Healthy', '102/68', 'Underweight', 'Celiac disease on strict gluten-free diet; gut absorption improving steadily', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (312, 'ADM017', '2023-2024', '2023-05-13T00:00:00.000Z', 130, 28, 16.6, '6/6', '6/6', 'Healthy', '102/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (313, 'ADM017', '2024-2025', '2024-05-13T00:00:00.000Z', 135.6, 30.8, 16.8, '6/6', '6/6', 'Healthy', '104/68', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (314, 'ADM017', '2025-2026', '2025-05-13T00:00:00.000Z', 141.2, 33.6, 16.9, '6/6', '6/6', 'Healthy', '106/70', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (315, 'ADM017', '2026-2027', '2026-05-13T00:00:00.000Z', 146.8, 36.4, 16.9, '6/6', '6/6', 'Healthy', '108/72', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (316, 'ADM018', '2023-2024', '2023-06-16T00:00:00.000Z', 128, 26.5, 16.2, '6/6', '6/6', 'Healthy', '100/64', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (317, 'ADM018', '2024-2025', '2024-06-16T00:00:00.000Z', 133.4, 29, 16.3, '6/6', '6/6', 'Healthy', '102/66', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (318, 'ADM018', '2025-2026', '2025-06-16T00:00:00.000Z', 138.8, 31.5, 16.4, '6/6', '6/6', 'Healthy', '104/68', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (319, 'ADM019', '2023-2024', '2023-07-19T00:00:00.000Z', 129, 27, 16.2, '6/6', '6/6', 'Healthy', '102/64', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (320, 'ADM019', '2024-2025', '2024-07-19T00:00:00.000Z', 134.5, 29.6, 16.4, '6/6', '6/6', 'Minor Issues', '104/66', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (321, 'ADM019', '2025-2026', '2025-07-19T00:00:00.000Z', 140, 32.2, 16.4, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (322, 'ADM019', '2026-2027', '2026-07-19T00:00:00.000Z', 145.5, 34.8, 16.4, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (323, 'ADM020', '2023-2024', '2023-08-22T00:00:00.000Z', 127, 33, 20.5, '6/6', '6/6', 'Cavities', '106/68', 'Overweight', 'BMI above 85th percentile; 45 mins outdoor sports encouraged', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (324, 'ADM020', '2024-2025', '2024-08-22T00:00:00.000Z', 132.3, 36.4, 20.8, '6/6', '6/6', 'Cavities', '108/70', 'Overweight', 'BMI above 85th percentile; 45 mins outdoor sports encouraged', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (325, 'ADM020', '2025-2026', '2025-08-22T00:00:00.000Z', 137.6, 39.8, 21, '6/6', '6/6', 'Minor Issues', '110/72', 'Overweight', 'BMI above 85th percentile; 45 mins outdoor sports encouraged', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (326, 'ADM020', '2026-2027', '2026-08-22T00:00:00.000Z', 142.9, 43.2, 21.2, '6/6', '6/6', 'Healthy', '112/74', 'Overweight', 'BMI above 85th percentile; 45 mins outdoor sports encouraged', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (327, 'ADM021', '2023-2024', '2023-05-05T00:00:00.000Z', 136, 31, 16.8, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (328, 'ADM021', '2024-2025', '2024-05-05T00:00:00.000Z', 141.7, 34, 16.9, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (329, 'ADM021', '2025-2026', '2025-05-05T00:00:00.000Z', 147.4, 37, 17, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (330, 'ADM021', '2026-2027', '2026-05-05T00:00:00.000Z', 153.1, 40, 17.1, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (331, 'ADM022', '2023-2024', '2023-06-08T00:00:00.000Z', 134, 29.5, 16.4, '6/6', '6/6', 'Healthy', '102/64', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (332, 'ADM022', '2024-2025', '2024-06-08T00:00:00.000Z', 139.5, 32.3, 16.6, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (333, 'ADM022', '2025-2026', '2025-06-08T00:00:00.000Z', 145, 35.1, 16.7, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (334, 'ADM022', '2026-2027', '2026-06-08T00:00:00.000Z', 150.5, 37.9, 16.7, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (335, 'ADM023', '2023-2024', '2023-07-11T00:00:00.000Z', 137, 44, 23.4, '6/6', '6/6', 'Minor Issues', '112/74', 'Obese', 'Significant pediatric obesity; pediatric metabolic panel advised', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (336, 'ADM023', '2024-2025', '2024-07-11T00:00:00.000Z', 142.4, 48.2, 23.8, '6/6', '6/6', 'Minor Issues', '114/76', 'Obese', 'Significant pediatric obesity; pediatric metabolic panel advised', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (337, 'ADM023', '2025-2026', '2025-07-11T00:00:00.000Z', 147.8, 52.4, 24, '6/6', '6/6', 'Cavities', '116/78', 'Obese', 'Significant pediatric obesity; pediatric metabolic panel advised', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (338, 'ADM024', '2023-2024', '2023-08-14T00:00:00.000Z', 133, 28, 15.8, '6/9', '6/9', 'Healthy', '102/64', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (339, 'ADM024', '2024-2025', '2024-08-14T00:00:00.000Z', 138.5, 30.7, 16, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (340, 'ADM024', '2025-2026', '2025-08-14T00:00:00.000Z', 144, 33.4, 16.1, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (341, 'ADM024', '2026-2027', '2026-08-14T00:00:00.000Z', 149.5, 36.1, 16.2, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (342, 'ADM025', '2023-2024', '2023-05-17T00:00:00.000Z', 142, 31, 15.4, '6/6', '6/6', 'Healthy', '104/66', 'Underweight', 'High metabolic rate, low body fat percentage; protein supplementation advised', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (343, 'ADM025', '2024-2025', '2024-05-17T00:00:00.000Z', 147.8, 33.2, 15.2, '6/6', '6/6', 'Healthy', '106/68', 'Underweight', 'High metabolic rate, low body fat percentage; protein supplementation advised', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (344, 'ADM025', '2025-2026', '2025-05-17T00:00:00.000Z', 153.6, 35.4, 15, '6/6', '6/6', 'Healthy', '108/70', 'Underweight', 'High metabolic rate, low body fat percentage; protein supplementation advised', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (345, 'ADM025', '2026-2027', '2026-05-17T00:00:00.000Z', 159.4, 37.6, 14.8, '6/6', '6/6', 'Healthy', '110/72', 'Underweight', 'High metabolic rate, low body fat percentage; protein supplementation advised', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (346, 'ADM026', '2023-2024', '2023-06-20T00:00:00.000Z', 140, 34, 17.3, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (347, 'ADM026', '2024-2025', '2024-06-20T00:00:00.000Z', 145.4, 36.9, 17.5, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (348, 'ADM026', '2025-2026', '2025-06-20T00:00:00.000Z', 150.8, 39.8, 17.5, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (349, 'ADM027', '2023-2024', '2023-07-23T00:00:00.000Z', 143, 36, 17.6, '6/6', '6/6', 'Healthy', '106/68', 'Normal', 'Mild postural asymmetry noted during spinal exam; core strengthening exercises advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (350, 'ADM027', '2024-2025', '2024-07-23T00:00:00.000Z', 148.6, 39.1, 17.7, '6/6', '6/6', 'Healthy', '108/70', 'Normal', 'Mild postural asymmetry noted during spinal exam; core strengthening exercises advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (351, 'ADM027', '2025-2026', '2025-07-23T00:00:00.000Z', 154.2, 42.2, 17.7, '6/6', '6/6', 'Healthy', '110/72', 'Normal', 'Mild postural asymmetry noted during spinal exam; core strengthening exercises advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (352, 'ADM027', '2026-2027', '2026-07-23T00:00:00.000Z', 159.8, 45.3, 17.7, '6/6', '6/6', 'Healthy', '112/74', 'Normal', 'Mild postural asymmetry noted during spinal exam; core strengthening exercises advised', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (353, 'ADM028', '2023-2024', '2023-08-06T00:00:00.000Z', 141, 35, 17.6, '6/9', '6/12', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (354, 'ADM028', '2024-2025', '2024-08-06T00:00:00.000Z', 146.3, 37.9, 17.7, '6/9', '6/9', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (355, 'ADM028', '2025-2026', '2025-08-06T00:00:00.000Z', 151.6, 40.8, 17.8, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (356, 'ADM028', '2026-2027', '2026-08-06T00:00:00.000Z', 156.9, 43.7, 17.8, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (357, 'ADM029', '2023-2024', '2023-05-09T00:00:00.000Z', 148, 40, 18.3, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (358, 'ADM029', '2024-2025', '2024-05-09T00:00:00.000Z', 154, 43.5, 18.3, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (359, 'ADM029', '2025-2026', '2025-05-09T00:00:00.000Z', 160, 47, 18.4, '6/6', '6/6', 'Healthy', '112/74', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (360, 'ADM029', '2026-2027', '2026-05-09T00:00:00.000Z', 166, 50.5, 18.3, '6/6', '6/6', 'Healthy', '114/76', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (361, 'ADM030', '2023-2024', '2023-06-12T00:00:00.000Z', 146, 38, 17.8, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (362, 'ADM030', '2024-2025', '2024-06-12T00:00:00.000Z', 151.5, 41, 17.9, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (363, 'ADM030', '2025-2026', '2025-06-12T00:00:00.000Z', 157, 44, 17.9, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (364, 'ADM031', '2023-2024', '2023-07-15T00:00:00.000Z', 149, 41.5, 18.7, '6/6', '6/6', 'Needs Attention', '108/70', 'Normal', 'Undergoing orthodontic treatment; good oral hygiene maintained', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (365, 'ADM031', '2024-2025', '2024-07-15T00:00:00.000Z', 154.8, 44.7, 18.7, '6/6', '6/6', 'Needs Attention', '110/72', 'Normal', 'Undergoing orthodontic treatment; good oral hygiene maintained', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (366, 'ADM031', '2025-2026', '2025-07-15T00:00:00.000Z', 160.6, 47.9, 18.6, '6/6', '6/6', 'Minor Issues', '112/74', 'Normal', 'Undergoing orthodontic treatment; good oral hygiene maintained', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (367, 'ADM031', '2026-2027', '2026-07-15T00:00:00.000Z', 166.4, 51.1, 18.5, '6/6', '6/6', 'Healthy', '114/76', 'Normal', 'Undergoing orthodontic treatment; good oral hygiene maintained', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (368, 'ADM032', '2023-2024', '2023-08-18T00:00:00.000Z', 145, 37, 17.6, '6/6', '6/6', 'Healthy', '104/66', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (369, 'ADM032', '2024-2025', '2024-08-18T00:00:00.000Z', 150.3, 39.8, 17.6, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (370, 'ADM032', '2025-2026', '2025-08-18T00:00:00.000Z', 155.6, 42.6, 17.6, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (371, 'ADM032', '2026-2027', '2026-08-18T00:00:00.000Z', 160.9, 45.4, 17.5, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (372, 'ADM033', '2023-2024', '2023-05-21T00:00:00.000Z', 155, 46, 19.1, '6/6', '6/6', 'Healthy', '110/70', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (373, 'ADM033', '2024-2025', '2024-05-21T00:00:00.000Z', 161.2, 49.8, 19.2, '6/6', '6/6', 'Healthy', '112/72', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (374, 'ADM033', '2025-2026', '2025-05-21T00:00:00.000Z', 167.4, 53.6, 19.1, '6/6', '6/6', 'Healthy', '114/74', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (375, 'ADM033', '2026-2027', '2026-05-21T00:00:00.000Z', 173.6, 57.4, 19, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (376, 'ADM034', '2023-2024', '2023-06-24T00:00:00.000Z', 152, 43, 18.6, '6/6', '6/6', 'Healthy', '106/68', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (377, 'ADM034', '2024-2025', '2024-06-24T00:00:00.000Z', 157.2, 45.8, 18.5, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (378, 'ADM034', '2025-2026', '2025-06-24T00:00:00.000Z', 162.4, 48.6, 18.4, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (379, 'ADM035', '2023-2024', '2023-07-07T00:00:00.000Z', 156, 58, 23.8, '6/6', '6/6', 'Minor Issues', '114/74', 'Overweight', 'Trending overweight; advised daily sports and reducing ultra-processed snacks', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (380, 'ADM035', '2024-2025', '2024-07-07T00:00:00.000Z', 161.8, 62.2, 23.8, '6/6', '6/6', 'Minor Issues', '116/76', 'Overweight', 'Trending overweight; advised daily sports and reducing ultra-processed snacks', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (381, 'ADM035', '2025-2026', '2025-07-07T00:00:00.000Z', 167.6, 66.4, 23.6, '6/6', '6/6', 'Healthy', '118/78', 'Overweight', 'Trending overweight; advised daily sports and reducing ultra-processed snacks', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (382, 'ADM035', '2026-2027', '2026-07-07T00:00:00.000Z', 173.4, 70.6, 23.5, '6/6', '6/6', 'Healthy', '120/80', 'Overweight', 'Trending overweight; advised daily sports and reducing ultra-processed snacks', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (383, 'ADM036', '2023-2024', '2023-08-10T00:00:00.000Z', 151, 41, 18, '6/6', '6/6', 'Healthy', '106/68', 'Normal', 'Lactose intolerant; plant-based calcium alternatives recommended', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (384, 'ADM036', '2024-2025', '2024-08-10T00:00:00.000Z', 156, 43.6, 17.9, '6/6', '6/6', 'Healthy', '108/70', 'Normal', 'Lactose intolerant; plant-based calcium alternatives recommended', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (385, 'ADM036', '2025-2026', '2025-08-10T00:00:00.000Z', 161, 46.2, 17.8, '6/6', '6/6', 'Healthy', '110/72', 'Normal', 'Lactose intolerant; plant-based calcium alternatives recommended', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (386, 'ADM036', '2026-2027', '2026-08-10T00:00:00.000Z', 166, 48.8, 17.7, '6/6', '6/6', 'Healthy', '112/74', 'Normal', 'Lactose intolerant; plant-based calcium alternatives recommended', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (387, 'ADM037', '2023-2024', '2023-05-13T00:00:00.000Z', 162, 52, 19.8, '6/6', '6/6', 'Healthy', '112/72', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (388, 'ADM037', '2024-2025', '2024-05-13T00:00:00.000Z', 167.8, 55.5, 19.7, '6/6', '6/6', 'Healthy', '114/74', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (389, 'ADM037', '2025-2026', '2025-05-13T00:00:00.000Z', 173.6, 59, 19.6, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (390, 'ADM037', '2026-2027', '2026-05-13T00:00:00.000Z', 179.4, 62.5, 19.4, '6/6', '6/6', 'Healthy', '118/78', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (391, 'ADM038', '2023-2024', '2023-06-16T00:00:00.000Z', 156, 38, 15.6, '6/6', '6/6', 'Healthy', '104/66', 'Underweight', 'Borderline anemia; complete hemogram requested, dietary iron advice given', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (392, 'ADM038', '2024-2025', '2024-06-16T00:00:00.000Z', 160.8, 40, 15.5, '6/6', '6/6', 'Healthy', '106/68', 'Underweight', 'Borderline anemia; complete hemogram requested, dietary iron advice given', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (393, 'ADM038', '2025-2026', '2025-06-16T00:00:00.000Z', 165.6, 42, 15.3, '6/6', '6/6', 'Healthy', '108/70', 'Underweight', 'Borderline anemia; complete hemogram requested, dietary iron advice given', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (394, 'ADM039', '2023-2024', '2023-07-19T00:00:00.000Z', 164, 55, 20.4, '6/6', '6/6', 'Healthy', '114/74', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (395, 'ADM039', '2024-2025', '2024-07-19T00:00:00.000Z', 169.6, 58.4, 20.3, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (396, 'ADM039', '2025-2026', '2025-07-19T00:00:00.000Z', 175.2, 61.8, 20.1, '6/6', '6/6', 'Healthy', '118/78', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (397, 'ADM039', '2026-2027', '2026-07-19T00:00:00.000Z', 180.8, 65.2, 19.9, '6/6', '6/6', 'Healthy', '120/80', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (398, 'ADM040', '2023-2024', '2023-08-22T00:00:00.000Z', 157, 48, 19.5, '6/9', '6/9', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (399, 'ADM040', '2024-2025', '2024-08-22T00:00:00.000Z', 161.6, 50.6, 19.4, '6/9', '6/9', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (400, 'ADM040', '2025-2026', '2025-08-22T00:00:00.000Z', 166.2, 53.2, 19.3, '6/6', '6/6', 'Healthy', '112/74', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (401, 'ADM040', '2026-2027', '2026-08-22T00:00:00.000Z', 170.8, 55.8, 19.1, '6/6', '6/6', 'Healthy', '114/76', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (402, 'ADM041', '2023-2024', '2023-05-05T00:00:00.000Z', 168, 60, 21.3, '6/6', '6/6', 'Healthy', '116/74', 'Normal', 'Post-ACL reconstruction rehab on left knee; light physical activity permitted', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (403, 'ADM041', '2024-2025', '2024-05-05T00:00:00.000Z', 172.8, 63, 21.1, '6/6', '6/6', 'Healthy', '118/76', 'Normal', 'Post-ACL reconstruction rehab on left knee; light physical activity permitted', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (404, 'ADM041', '2025-2026', '2025-05-05T00:00:00.000Z', 177.6, 66, 20.9, '6/6', '6/6', 'Healthy', '120/78', 'Normal', 'Post-ACL reconstruction rehab on left knee; light physical activity permitted', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (405, 'ADM041', '2026-2027', '2026-05-05T00:00:00.000Z', 182.4, 69, 20.7, '6/6', '6/6', 'Healthy', '122/80', 'Normal', 'Post-ACL reconstruction rehab on left knee; light physical activity permitted', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (406, 'ADM042', '2023-2024', '2023-06-08T00:00:00.000Z', 160, 50, 19.5, '6/6', '6/6', 'Healthy', '108/70', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (407, 'ADM042', '2024-2025', '2024-06-08T00:00:00.000Z', 164.2, 52.4, 19.4, '6/6', '6/6', 'Healthy', '110/72', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (408, 'ADM042', '2025-2026', '2025-06-08T00:00:00.000Z', 168.4, 54.8, 19.3, '6/6', '6/6', 'Healthy', '112/74', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (409, 'ADM043', '2023-2024', '2023-07-11T00:00:00.000Z', 170, 63, 21.8, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (410, 'ADM043', '2024-2025', '2024-07-11T00:00:00.000Z', 174.6, 66.1, 21.7, '6/6', '6/6', 'Healthy', '118/78', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (411, 'ADM043', '2025-2026', '2025-07-11T00:00:00.000Z', 179.2, 69.2, 21.5, '6/6', '6/6', 'Healthy', '120/80', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (412, 'ADM043', '2026-2027', '2026-07-11T00:00:00.000Z', 183.8, 72.3, 21.4, '6/6', '6/6', 'Healthy', '122/82', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (413, 'ADM044', '2023-2024', '2023-08-14T00:00:00.000Z', 162, 52, 19.8, '6/6', '6/6', 'Healthy', '110/70', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (414, 'ADM044', '2024-2025', '2024-08-14T00:00:00.000Z', 166, 54.2, 19.7, '6/6', '6/6', 'Healthy', '112/72', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (415, 'ADM044', '2025-2026', '2025-08-14T00:00:00.000Z', 170, 56.4, 19.5, '6/6', '6/6', 'Healthy', '114/74', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (416, 'ADM044', '2026-2027', '2026-08-14T00:00:00.000Z', 174, 58.6, 19.4, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (417, 'ADM045', '2023-2024', '2023-05-17T00:00:00.000Z', 174, 67, 22.1, '6/6', '6/6', 'Healthy', '118/78', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (418, 'ADM045', '2024-2025', '2024-05-17T00:00:00.000Z', 177.5, 69.5, 22.1, '6/6', '6/6', 'Healthy', '120/80', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (419, 'ADM045', '2025-2026', '2025-05-17T00:00:00.000Z', 181, 72, 22, '6/6', '6/6', 'Healthy', '122/82', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (420, 'ADM045', '2026-2027', '2026-05-17T00:00:00.000Z', 184.5, 74.5, 21.9, '6/6', '6/6', 'Healthy', '124/84', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (421, 'ADM046', '2023-2024', '2023-06-20T00:00:00.000Z', 164, 55, 20.4, '6/6', '6/6', 'Healthy', '112/72', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (422, 'ADM046', '2024-2025', '2024-06-20T00:00:00.000Z', 167.2, 57, 20.4, '6/6', '6/6', 'Healthy', '114/74', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (423, 'ADM046', '2025-2026', '2025-06-20T00:00:00.000Z', 170.4, 59, 20.3, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (424, 'ADM047', '2023-2024', '2023-07-23T00:00:00.000Z', 176, 70, 22.6, '6/6', '6/6', 'Healthy', '120/78', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (425, 'ADM047', '2024-2025', '2024-07-23T00:00:00.000Z', 179.4, 72.8, 22.6, '6/6', '6/6', 'Healthy', '122/80', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (426, 'ADM047', '2025-2026', '2025-07-23T00:00:00.000Z', 182.8, 75.6, 22.6, '6/6', '6/6', 'Healthy', '124/82', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (427, 'ADM047', '2026-2027', '2026-07-23T00:00:00.000Z', 186.2, 78.4, 22.6, '6/6', '6/6', 'Healthy', '126/84', 'Normal', NULL, 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (428, 'ADM048', '2023-2024', '2023-08-06T00:00:00.000Z', 165, 57, 20.9, '6/6', '6/6', 'Healthy', '112/72', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (429, 'ADM048', '2024-2025', '2024-08-06T00:00:00.000Z', 168, 59, 20.9, '6/6', '6/6', 'Healthy', '114/74', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (430, 'ADM048', '2025-2026', '2025-08-06T00:00:00.000Z', 171, 61, 20.9, '6/6', '6/6', 'Healthy', '116/76', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (431, 'ADM048', '2026-2027', '2026-08-06T00:00:00.000Z', 174, 63, 20.8, '6/6', '6/6', 'Healthy', '118/78', 'Normal', NULL, 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (432, 'ADM050', '2023-2024', '2023-06-12T00:00:00.000Z', 135, 29, 15.9, '6/6', '6/6', 'Healthy', '102/64', 'Normal', 'G6PD deficiency; parent briefed on medication precaution list', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (433, 'ADM050', '2024-2025', '2024-06-12T00:00:00.000Z', 140.4, 31.7, 16.1, '6/6', '6/6', 'Healthy', '104/66', 'Normal', 'G6PD deficiency; parent briefed on medication precaution list', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (434, 'ADM050', '2025-2026', '2025-06-12T00:00:00.000Z', 145.8, 34.4, 16.2, '6/6', '6/6', 'Healthy', '106/68', 'Normal', 'G6PD deficiency; parent briefed on medication precaution list', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (435, 'ADM050', '2026-2027', '2026-06-12T00:00:00.000Z', 151.2, 37.1, 16.2, '6/6', '6/6', 'Healthy', '108/70', 'Normal', 'G6PD deficiency; parent briefed on medication precaution list', 'Dr. Rajesh Sharma', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (436, 'ADM051', '2023-2024', '2023-07-15T00:00:00.000Z', 144, 48, 23.1, '6/6', '6/6', 'Minor Issues', '126/82', 'Overweight', 'Elevated BP on screening; repeat resting blood pressure scheduled', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (437, 'ADM051', '2024-2025', '2024-07-15T00:00:00.000Z', 149.6, 51.8, 23.1, '6/6', '6/6', 'Minor Issues', '128/84', 'Overweight', 'Elevated BP on screening; repeat resting blood pressure scheduled', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (438, 'ADM051', '2025-2026', '2025-07-15T00:00:00.000Z', 155.2, 55.6, 23.1, '6/6', '6/6', 'Healthy', '130/86', 'Overweight', 'Elevated BP on screening; repeat resting blood pressure scheduled', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (439, 'ADM051', '2026-2027', '2026-07-15T00:00:00.000Z', 160.8, 59.4, 23, '6/6', '6/6', 'Healthy', '132/88', 'Overweight', 'Elevated BP on screening; repeat resting blood pressure scheduled', 'Dr. Admin', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (440, 'ADM052', '2023-2024', '2023-08-18T00:00:00.000Z', 147, 39, 18, '6/6', '6/6', 'Healthy', '106/68', 'Normal', 'Severe eczema & egg allergy; hypoallergenic skin regimen', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (441, 'ADM052', '2024-2025', '2024-08-18T00:00:00.000Z', 152.2, 41.8, 18, '6/6', '6/6', 'Healthy', '108/70', 'Normal', 'Severe eczema & egg allergy; hypoallergenic skin regimen', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (442, 'ADM052', '2025-2026', '2025-08-18T00:00:00.000Z', 157.4, 44.6, 18, '6/6', '6/6', 'Healthy', '110/72', 'Normal', 'Severe eczema & egg allergy; hypoallergenic skin regimen', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";
INSERT INTO public."HealthCheckup" ("id", "admissionNumber", "academicYear", "checkupDate", "height", "weight", "bmi", "eyesightLeft", "eyesightRight", "dentalHealth", "bloodPressure", "nutritionalStatus", "nutritionRemarks", "doctorName", "createdAt", "updatedAt")
VALUES (443, 'ADM052', '2026-2027', '2026-08-18T00:00:00.000Z', 162.6, 47.4, 17.9, '6/6', '6/6', 'Healthy', '112/74', 'Normal', 'Severe eczema & egg allergy; hypoallergenic skin regimen', 'Dr. Anita Mehta', '2026-09-11T10:07:25.395Z', '2026-09-11T10:07:25.395Z')
ON CONFLICT ("admissionNumber", "academicYear") DO UPDATE SET "height" = EXCLUDED."height", "weight" = EXCLUDED."weight", "bmi" = EXCLUDED."bmi", "updatedAt" = EXCLUDED."updatedAt";

-- 5.4 Observations
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (41, 'ADM001', '2025-2026', 'Recurrent dry cough during winter months; slight wheeze noted on forced exhalation', 'Refer to pediatric allergist; review allergy action plan and pulmonary status in 3 months', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (42, 'ADM002', '2024-2025', 'Early pit-and-fissure caries on lower right deciduous molar', 'Consult pediatric dentist for composite sealant; twice-daily fluoride brushing', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (43, 'ADM003', '2024-2025', 'Underweight trajectory; pale palpebral conjunctiva indicating borderline nutritional deficiency', 'Prescribe pediatric iron drops; monitor weight bi-weekly at school health clinic', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (44, 'ADM005', '2025-2026', 'Reports exercise-induced breathlessness after 100m sprint during athletics class', 'Administer Salbutamol 2 puffs 15 mins prior to sports; consult pediatric pulmonologist', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (45, 'ADM007', '2025-2026', 'Pediatric obesity with rapid weight gain (+4.2 kg over 10 months); acanthosis nigricans check normal', 'Refer to pediatric nutritionist; mandate 45 minutes daily aerobic physical education', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (46, 'ADM008', '2024-2025', 'Difficulty reading classroom blackboard; tilts head forward and squints frequently', 'Immediate referral to optometrist for refractive error correction; allocate front row seating', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (47, 'ADM010', '2025-2026', 'Overweight with low stamina during morning assembly drills', 'Share balanced dietary guidelines with parents; replace packaged snacks with whole fruits', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (48, 'ADM011', '2024-2025', 'Teacher noticed 2 brief staring episodes (absence spells) in math class lasting ~5-8 seconds', 'Urgent pediatric neurology consultation for Levetiracetam dosage review; notify parents', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (49, 'ADM012', '2025-2026', 'Moderate malnutrition with lethargy and low muscle tone', 'Complete hemogram + ferritin profile; initiate high-protein fortified nutrition intervention', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (50, 'ADM013', '2026-2027', 'Type 1 Diabetes CGM log review; 2 mild hypoglycemia dips (68 mg/dL) after physical education', 'Provide 15g fast-acting glucose tablets before sports; inform sports instructor', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (51, 'ADM016', '2025-2026', 'Mild abdominal bloating after inadvertent bread consumption at school social gathering', 'Strict cafeteria vigilance for gluten cross-contamination; refresh dietary warning card', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (52, 'ADM018', '2025-2026', 'Speech clarity assessment: occasional difficulty hearing instructions in noisy cafeteria', 'Audiometry review at ENT clinic; ensure teacher faces student directly while instructing', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (53, 'ADM019', '2025-2026', 'Restlessness and motor impulsivity noted during prolonged seated tasks (>30 mins)', 'Allow planned 2-minute movement breaks; provide tactile focus fidget aids during exams', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (54, 'ADM020', '2025-2026', 'Overweight trajectory combined with minor gingival inflammation', 'Dental scaling recommended; reduce intake of carbonated and sugary beverages', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (55, 'ADM023', '2025-2026', 'Severe obesity; BMI exceeds 97th percentile for age and sex; complaints of knee discomfort', 'Pediatric endocrinology evaluation; structured calorie-controlled dietary schedule', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (56, 'ADM024', '2025-2026', 'Severe systemic allergy to Hymenoptera (wasp/bee) venom documented by parent', 'Auto-injector EpiPen verified in infirmary emergency kit; emergency drill briefed to homeroom teacher', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (57, 'ADM027', '2025-2026', 'Mild thoracolumbar postural asymmetry; right shoulder elevated by 1.2 cm', 'Orthopedic spinal evaluation for idiopathic scoliosis; limit school bag weight to < 3.5 kg', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (58, 'ADM028', '2025-2026', 'Recurrent unilateral throbbing headaches triggered by bright sunlight and screen exposure', 'Referral to pediatric neurologist; allow student to rest in dark infirmary room during auras', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (59, 'ADM031', '2025-2026', 'Orthodontic braces wire irritation on buccal mucosa; minor ulceration noted', 'Apply orthodontic relief wax; dental checkup for archwire trimming', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (60, 'ADM035', '2025-2026', 'Weight gain of 5.5 kg in 12 months; resting heart rate 86 bpm', 'Encourage 60 mins of daily basketball/football; replace cafeteria sodas with water', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (61, 'ADM038', '2025-2026', 'Frequent fatigue and dizzy spells during morning assembly', 'Serum ferritin & Hb test recommended; oral iron supplement course advised', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (62, 'ADM041', '2025-2026', 'Post-ACL surgery follow-up: mild quadriceps atrophy on left leg, gait steady', 'Continue guided physical therapy; exempt from high-impact competitive contact sports', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (63, 'ADM051', '2025-2026', 'Resting BP 126/82 mmHg on two separate readings; student reports no headache or palpitations', 'Ambulatory blood pressure monitoring; reduce dietary sodium and consult pediatric cardiologist', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";
INSERT INTO public."Observation" ("id", "admissionNumber", "academicYear", "observation", "recommendation", "createdAt", "updatedAt")
VALUES (64, 'ADM052', '2025-2026', 'Atopic eczema flare-up on antecubital fossae; excoriations from itching', 'Apply prescribed hydrocortisone 1% cream; maintain strict egg-free dietary protocol', '2026-09-11T10:07:25.413Z', '2026-09-11T10:07:25.413Z')
ON CONFLICT ("id") DO UPDATE SET "observation" = EXCLUDED."observation", "recommendation" = EXCLUDED."recommendation";

-- 5.5 Immunizations
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (565, 'ADM001', 'Hepatitis B', '2013-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (566, 'ADM001', 'Hepatitis B', '2013-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (567, 'ADM001', 'Hepatitis B', '2013-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (568, 'ADM001', 'MMR', '2014-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (569, 'ADM001', 'Chickenpox', '2014-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (570, 'ADM001', 'Typhoid', '2015-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (571, 'ADM001', 'Polio', '2018-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (572, 'ADM001', 'Chickenpox', '2018-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (573, 'ADM001', 'MMR', '2018-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (574, 'ADM001', 'DPT Booster', '2018-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (575, 'ADM001', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (576, 'ADM002', 'Hepatitis B', '2020-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (577, 'ADM002', 'Hepatitis B', '2020-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (578, 'ADM002', 'Hepatitis B', '2020-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (579, 'ADM002', 'MMR', '2021-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (580, 'ADM002', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (581, 'ADM002', 'Polio', '2025-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (582, 'ADM002', 'MMR', '2025-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (583, 'ADM002', 'DPT Booster', '2025-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (584, 'ADM003', 'Hepatitis B', '2020-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (585, 'ADM003', 'Hepatitis B', '2020-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (586, 'ADM003', 'Hepatitis B', '2020-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (587, 'ADM003', 'MMR', '2021-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (588, 'ADM003', 'Chickenpox', '2021-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (589, 'ADM003', 'Chickenpox', '2025-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (590, 'ADM003', 'MMR', '2025-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (591, 'ADM003', 'DPT Booster', '2025-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (592, 'ADM004', 'Hepatitis B', '2020-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (593, 'ADM004', 'Hepatitis B', '2020-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (594, 'ADM004', 'Hepatitis B', '2020-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (595, 'ADM004', 'MMR', '2021-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (596, 'ADM004', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (597, 'ADM004', 'Polio', '2025-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (598, 'ADM004', 'MMR', '2025-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (599, 'ADM004', 'DPT Booster', '2025-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (600, 'ADM005', 'Hepatitis B', '2019-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (601, 'ADM005', 'Hepatitis B', '2019-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (602, 'ADM005', 'Hepatitis B', '2019-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (603, 'ADM005', 'MMR', '2020-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (604, 'ADM005', 'Chickenpox', '2020-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (605, 'ADM005', 'Typhoid', '2021-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (606, 'ADM005', 'Chickenpox', '2024-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (607, 'ADM005', 'MMR', '2024-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (608, 'ADM005', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (609, 'ADM005', 'DPT Booster', '2024-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (610, 'ADM006', 'Hepatitis B', '2019-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (611, 'ADM006', 'Hepatitis B', '2019-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (612, 'ADM006', 'Hepatitis B', '2019-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (613, 'ADM006', 'MMR', '2020-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (614, 'ADM006', 'MMR', '2024-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (615, 'ADM006', 'DPT Booster', '2024-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (616, 'ADM006', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (617, 'ADM007', 'Hepatitis B', '2019-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (618, 'ADM007', 'Hepatitis B', '2019-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (619, 'ADM007', 'Hepatitis B', '2019-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (620, 'ADM007', 'MMR', '2020-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (621, 'ADM007', 'Typhoid', '2021-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (622, 'ADM007', 'Polio', '2024-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (623, 'ADM007', 'MMR', '2024-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (624, 'ADM007', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (625, 'ADM007', 'DPT Booster', '2024-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (626, 'ADM008', 'Hepatitis B', '2019-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (627, 'ADM008', 'Hepatitis B', '2019-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (628, 'ADM008', 'Hepatitis B', '2019-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (629, 'ADM008', 'MMR', '2020-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (630, 'ADM008', 'Chickenpox', '2020-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (631, 'ADM008', 'Chickenpox', '2024-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (632, 'ADM008', 'MMR', '2024-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (633, 'ADM008', 'DPT Booster', '2024-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (634, 'ADM008', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (635, 'ADM009', 'Hepatitis B', '2018-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (636, 'ADM009', 'Hepatitis B', '2018-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (637, 'ADM009', 'Hepatitis B', '2018-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (638, 'ADM009', 'MMR', '2019-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (639, 'ADM009', 'Chickenpox', '2019-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (640, 'ADM009', 'Polio', '2023-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (641, 'ADM009', 'Chickenpox', '2023-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (642, 'ADM009', 'MMR', '2023-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (643, 'ADM009', 'DPT Booster', '2023-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (644, 'ADM010', 'Hepatitis B', '2018-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (645, 'ADM010', 'Hepatitis B', '2018-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (646, 'ADM010', 'Hepatitis B', '2018-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (647, 'ADM010', 'MMR', '2019-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (648, 'ADM010', 'Typhoid', '2020-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (649, 'ADM010', 'MMR', '2023-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (650, 'ADM010', 'DPT Booster', '2023-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (651, 'ADM010', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (652, 'ADM011', 'Hepatitis B', '2018-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (653, 'ADM011', 'Hepatitis B', '2018-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (654, 'ADM011', 'Hepatitis B', '2018-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (655, 'ADM011', 'MMR', '2019-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (656, 'ADM011', 'Typhoid', '2020-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (657, 'ADM011', 'Polio', '2023-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (658, 'ADM011', 'MMR', '2023-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (659, 'ADM011', 'DPT Booster', '2023-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (660, 'ADM011', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (661, 'ADM012', 'Hepatitis B', '2018-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (662, 'ADM012', 'Hepatitis B', '2018-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (663, 'ADM012', 'Hepatitis B', '2018-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (664, 'ADM012', 'MMR', '2019-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (665, 'ADM012', 'Chickenpox', '2019-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (666, 'ADM012', 'Chickenpox', '2023-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (667, 'ADM012', 'MMR', '2023-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (668, 'ADM012', 'DPT Booster', '2023-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (669, 'ADM013', 'Hepatitis B', '2017-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (670, 'ADM013', 'Hepatitis B', '2017-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (671, 'ADM013', 'Hepatitis B', '2017-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (672, 'ADM013', 'MMR', '2018-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (673, 'ADM013', 'Typhoid', '2019-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (674, 'ADM013', 'Polio', '2022-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (675, 'ADM013', 'MMR', '2022-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (676, 'ADM013', 'DPT Booster', '2022-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (677, 'ADM013', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (678, 'ADM013', 'Other', '2025-10-05T00:00:00.000Z', 'Annual', '2026-10-05T00:00:00.000Z', 'Quadrivalent annual influenza vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (679, 'ADM014', 'Hepatitis B', '2017-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (680, 'ADM014', 'Hepatitis B', '2017-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (681, 'ADM014', 'Hepatitis B', '2017-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (682, 'ADM014', 'MMR', '2018-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (683, 'ADM014', 'MMR', '2022-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (684, 'ADM014', 'DPT Booster', '2022-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (685, 'ADM014', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (686, 'ADM015', 'Hepatitis B', '2017-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (687, 'ADM015', 'Hepatitis B', '2017-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (688, 'ADM015', 'Hepatitis B', '2017-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (689, 'ADM015', 'MMR', '2018-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (690, 'ADM015', 'Chickenpox', '2018-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (691, 'ADM015', 'Polio', '2022-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (692, 'ADM015', 'Chickenpox', '2022-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (693, 'ADM015', 'MMR', '2022-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (694, 'ADM015', 'DPT Booster', '2022-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (695, 'ADM016', 'Hepatitis B', '2017-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (696, 'ADM016', 'Hepatitis B', '2017-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (697, 'ADM016', 'Hepatitis B', '2017-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (698, 'ADM016', 'MMR', '2018-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (699, 'ADM016', 'Typhoid', '2019-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (700, 'ADM016', 'MMR', '2022-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (701, 'ADM016', 'DPT Booster', '2022-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (702, 'ADM016', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (703, 'ADM017', 'Hepatitis B', '2016-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (704, 'ADM017', 'Hepatitis B', '2016-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (705, 'ADM017', 'Hepatitis B', '2016-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (706, 'ADM017', 'MMR', '2017-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (707, 'ADM017', 'Typhoid', '2018-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (708, 'ADM017', 'Polio', '2021-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (709, 'ADM017', 'MMR', '2021-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (710, 'ADM017', 'DPT Booster', '2021-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (711, 'ADM017', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (712, 'ADM018', 'Hepatitis B', '2016-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (713, 'ADM018', 'Hepatitis B', '2016-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (714, 'ADM018', 'Hepatitis B', '2016-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (715, 'ADM018', 'MMR', '2017-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (716, 'ADM018', 'Chickenpox', '2017-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (717, 'ADM018', 'Chickenpox', '2021-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (718, 'ADM018', 'MMR', '2021-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (719, 'ADM018', 'DPT Booster', '2021-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (720, 'ADM018', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (721, 'ADM019', 'Hepatitis B', '2016-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (722, 'ADM019', 'Hepatitis B', '2016-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (723, 'ADM019', 'Hepatitis B', '2016-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (724, 'ADM019', 'MMR', '2017-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (725, 'ADM019', 'Polio', '2021-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (726, 'ADM019', 'MMR', '2021-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (727, 'ADM019', 'DPT Booster', '2021-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (728, 'ADM020', 'Hepatitis B', '2016-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (729, 'ADM020', 'Hepatitis B', '2016-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (730, 'ADM020', 'Hepatitis B', '2016-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (731, 'ADM020', 'MMR', '2017-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (732, 'ADM020', 'Chickenpox', '2017-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (733, 'ADM020', 'Typhoid', '2018-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (734, 'ADM020', 'Chickenpox', '2021-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (735, 'ADM020', 'MMR', '2021-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (736, 'ADM020', 'DPT Booster', '2021-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (737, 'ADM020', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (738, 'ADM021', 'Hepatitis B', '2015-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (739, 'ADM021', 'Hepatitis B', '2015-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (740, 'ADM021', 'Hepatitis B', '2015-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (741, 'ADM021', 'MMR', '2016-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (742, 'ADM021', 'Polio', '2020-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (743, 'ADM021', 'MMR', '2020-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (744, 'ADM021', 'DPT Booster', '2020-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (745, 'ADM021', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (746, 'ADM022', 'Hepatitis B', '2015-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (747, 'ADM022', 'Hepatitis B', '2015-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (748, 'ADM022', 'Hepatitis B', '2015-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (749, 'ADM022', 'MMR', '2016-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (750, 'ADM022', 'Chickenpox', '2016-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (751, 'ADM022', 'Typhoid', '2017-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (752, 'ADM022', 'Chickenpox', '2020-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (753, 'ADM022', 'MMR', '2020-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (754, 'ADM022', 'DPT Booster', '2020-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (755, 'ADM022', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (756, 'ADM023', 'Hepatitis B', '2015-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (757, 'ADM023', 'Hepatitis B', '2015-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (758, 'ADM023', 'Hepatitis B', '2015-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (759, 'ADM023', 'MMR', '2016-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (760, 'ADM023', 'Polio', '2020-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (761, 'ADM023', 'MMR', '2020-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (762, 'ADM023', 'DPT Booster', '2020-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (763, 'ADM024', 'Hepatitis B', '2015-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (764, 'ADM024', 'Hepatitis B', '2015-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (765, 'ADM024', 'Hepatitis B', '2015-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (766, 'ADM024', 'MMR', '2016-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (767, 'ADM024', 'Chickenpox', '2016-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (768, 'ADM024', 'Chickenpox', '2020-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (769, 'ADM024', 'MMR', '2020-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (770, 'ADM024', 'DPT Booster', '2020-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (771, 'ADM024', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (772, 'ADM025', 'Hepatitis B', '2014-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (773, 'ADM025', 'Hepatitis B', '2014-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (774, 'ADM025', 'Hepatitis B', '2014-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (775, 'ADM025', 'MMR', '2015-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (776, 'ADM025', 'Typhoid', '2016-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (777, 'ADM025', 'Polio', '2019-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (778, 'ADM025', 'MMR', '2019-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (779, 'ADM025', 'DPT Booster', '2019-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (780, 'ADM025', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (781, 'ADM026', 'Hepatitis B', '2014-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (782, 'ADM026', 'Hepatitis B', '2014-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (783, 'ADM026', 'Hepatitis B', '2014-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (784, 'ADM026', 'MMR', '2015-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (785, 'ADM026', 'MMR', '2019-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (786, 'ADM026', 'DPT Booster', '2019-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (787, 'ADM026', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (788, 'ADM027', 'Hepatitis B', '2014-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (789, 'ADM027', 'Hepatitis B', '2014-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (790, 'ADM027', 'Hepatitis B', '2014-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (791, 'ADM027', 'MMR', '2015-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (792, 'ADM027', 'Chickenpox', '2015-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (793, 'ADM027', 'Typhoid', '2016-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (794, 'ADM027', 'Chickenpox', '2019-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (795, 'ADM027', 'MMR', '2019-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (796, 'ADM027', 'DPT Booster', '2019-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (797, 'ADM027', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (798, 'ADM028', 'Hepatitis B', '2014-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (799, 'ADM028', 'Hepatitis B', '2014-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (800, 'ADM028', 'Hepatitis B', '2014-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (801, 'ADM028', 'MMR', '2015-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (802, 'ADM028', 'Polio', '2019-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (803, 'ADM028', 'MMR', '2019-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (804, 'ADM028', 'DPT Booster', '2019-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (805, 'ADM028', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (806, 'ADM029', 'Hepatitis B', '2013-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (807, 'ADM029', 'Hepatitis B', '2013-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (808, 'ADM029', 'Hepatitis B', '2013-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (809, 'ADM029', 'MMR', '2014-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (810, 'ADM029', 'Typhoid', '2015-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (811, 'ADM029', 'Polio', '2018-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (812, 'ADM029', 'MMR', '2018-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (813, 'ADM029', 'DPT Booster', '2018-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (814, 'ADM029', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (815, 'ADM030', 'Hepatitis B', '2013-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (816, 'ADM030', 'Hepatitis B', '2013-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (817, 'ADM030', 'Hepatitis B', '2013-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (818, 'ADM030', 'MMR', '2014-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (819, 'ADM030', 'MMR', '2018-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (820, 'ADM030', 'DPT Booster', '2018-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (821, 'ADM030', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (822, 'ADM031', 'Hepatitis B', '2013-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (823, 'ADM031', 'Hepatitis B', '2013-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (824, 'ADM031', 'Hepatitis B', '2013-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (825, 'ADM031', 'MMR', '2014-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (826, 'ADM031', 'Chickenpox', '2014-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (827, 'ADM031', 'Typhoid', '2015-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (828, 'ADM031', 'Chickenpox', '2018-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (829, 'ADM031', 'MMR', '2018-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (830, 'ADM031', 'DPT Booster', '2018-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (831, 'ADM031', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (832, 'ADM032', 'Hepatitis B', '2013-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (833, 'ADM032', 'Hepatitis B', '2013-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (834, 'ADM032', 'Hepatitis B', '2013-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (835, 'ADM032', 'MMR', '2014-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (836, 'ADM032', 'Polio', '2018-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (837, 'ADM032', 'MMR', '2018-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (838, 'ADM032', 'DPT Booster', '2018-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (839, 'ADM032', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (840, 'ADM033', 'Hepatitis B', '2012-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (841, 'ADM033', 'Hepatitis B', '2012-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (842, 'ADM033', 'Hepatitis B', '2012-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (843, 'ADM033', 'MMR', '2013-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (844, 'ADM033', 'Typhoid', '2014-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (845, 'ADM033', 'Polio', '2017-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (846, 'ADM033', 'MMR', '2017-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (847, 'ADM033', 'DPT Booster', '2017-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (848, 'ADM033', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (849, 'ADM034', 'Hepatitis B', '2012-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (850, 'ADM034', 'Hepatitis B', '2012-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (851, 'ADM034', 'Hepatitis B', '2012-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (852, 'ADM034', 'MMR', '2013-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (853, 'ADM034', 'Chickenpox', '2013-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (854, 'ADM034', 'Chickenpox', '2017-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (855, 'ADM034', 'MMR', '2017-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (856, 'ADM034', 'DPT Booster', '2017-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (857, 'ADM034', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (858, 'ADM035', 'Hepatitis B', '2012-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (859, 'ADM035', 'Hepatitis B', '2012-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (860, 'ADM035', 'Hepatitis B', '2012-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (861, 'ADM035', 'MMR', '2013-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (862, 'ADM035', 'Polio', '2017-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (863, 'ADM035', 'MMR', '2017-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (864, 'ADM035', 'DPT Booster', '2017-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (865, 'ADM036', 'Hepatitis B', '2012-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (866, 'ADM036', 'Hepatitis B', '2012-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (867, 'ADM036', 'Hepatitis B', '2012-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (868, 'ADM036', 'MMR', '2013-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (869, 'ADM036', 'Typhoid', '2014-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (870, 'ADM036', 'MMR', '2017-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (871, 'ADM036', 'DPT Booster', '2017-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (872, 'ADM036', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (873, 'ADM037', 'Hepatitis B', '2011-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (874, 'ADM037', 'Hepatitis B', '2011-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (875, 'ADM037', 'Hepatitis B', '2011-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (876, 'ADM037', 'MMR', '2012-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (877, 'ADM037', 'Polio', '2016-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (878, 'ADM037', 'MMR', '2016-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (879, 'ADM037', 'DPT Booster', '2016-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (880, 'ADM037', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (881, 'ADM038', 'Hepatitis B', '2011-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (882, 'ADM038', 'Hepatitis B', '2011-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (883, 'ADM038', 'Hepatitis B', '2011-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (884, 'ADM038', 'MMR', '2012-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (885, 'ADM038', 'Chickenpox', '2012-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (886, 'ADM038', 'Chickenpox', '2016-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (887, 'ADM038', 'MMR', '2016-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (888, 'ADM038', 'DPT Booster', '2016-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (889, 'ADM039', 'Hepatitis B', '2011-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (890, 'ADM039', 'Hepatitis B', '2011-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (891, 'ADM039', 'Hepatitis B', '2011-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (892, 'ADM039', 'MMR', '2012-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (893, 'ADM039', 'Typhoid', '2013-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (894, 'ADM039', 'MMR', '2016-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (895, 'ADM039', 'DPT Booster', '2016-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (896, 'ADM039', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (897, 'ADM040', 'Hepatitis B', '2011-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (898, 'ADM040', 'Hepatitis B', '2011-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (899, 'ADM040', 'Hepatitis B', '2011-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (900, 'ADM040', 'MMR', '2012-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (901, 'ADM040', 'Polio', '2016-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (902, 'ADM040', 'MMR', '2016-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (903, 'ADM040', 'DPT Booster', '2016-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (904, 'ADM040', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (905, 'ADM041', 'Hepatitis B', '2010-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (906, 'ADM041', 'Hepatitis B', '2010-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (907, 'ADM041', 'Hepatitis B', '2010-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (908, 'ADM041', 'MMR', '2011-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (909, 'ADM041', 'Typhoid', '2012-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (910, 'ADM041', 'Polio', '2015-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (911, 'ADM041', 'MMR', '2015-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (912, 'ADM041', 'DPT Booster', '2015-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (913, 'ADM041', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (914, 'ADM042', 'Hepatitis B', '2010-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (915, 'ADM042', 'Hepatitis B', '2010-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (916, 'ADM042', 'Hepatitis B', '2010-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (917, 'ADM042', 'MMR', '2011-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (918, 'ADM042', 'MMR', '2015-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (919, 'ADM042', 'DPT Booster', '2015-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (920, 'ADM042', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (921, 'ADM043', 'Hepatitis B', '2010-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (922, 'ADM043', 'Hepatitis B', '2010-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (923, 'ADM043', 'Hepatitis B', '2010-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (924, 'ADM043', 'MMR', '2011-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (925, 'ADM043', 'Chickenpox', '2011-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (926, 'ADM043', 'Typhoid', '2012-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (927, 'ADM043', 'Chickenpox', '2015-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (928, 'ADM043', 'MMR', '2015-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (929, 'ADM043', 'DPT Booster', '2015-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (930, 'ADM043', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (931, 'ADM044', 'Hepatitis B', '2010-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (932, 'ADM044', 'Hepatitis B', '2010-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (933, 'ADM044', 'Hepatitis B', '2010-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (934, 'ADM044', 'MMR', '2011-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (935, 'ADM044', 'Polio', '2015-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (936, 'ADM044', 'MMR', '2015-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (937, 'ADM044', 'DPT Booster', '2015-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (938, 'ADM044', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (939, 'ADM045', 'Hepatitis B', '2009-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (940, 'ADM045', 'Hepatitis B', '2009-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (941, 'ADM045', 'Hepatitis B', '2009-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (942, 'ADM045', 'MMR', '2010-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (943, 'ADM045', 'Typhoid', '2011-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (944, 'ADM045', 'Polio', '2014-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (945, 'ADM045', 'MMR', '2014-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (946, 'ADM045', 'DPT Booster', '2014-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (947, 'ADM045', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (948, 'ADM046', 'Hepatitis B', '2009-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (949, 'ADM046', 'Hepatitis B', '2009-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (950, 'ADM046', 'Hepatitis B', '2009-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (951, 'ADM046', 'MMR', '2010-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (952, 'ADM046', 'MMR', '2014-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (953, 'ADM046', 'DPT Booster', '2014-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (954, 'ADM046', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (955, 'ADM047', 'Hepatitis B', '2009-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (956, 'ADM047', 'Hepatitis B', '2009-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (957, 'ADM047', 'Hepatitis B', '2009-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (958, 'ADM047', 'MMR', '2010-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (959, 'ADM047', 'Chickenpox', '2010-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (960, 'ADM047', 'Chickenpox', '2014-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (961, 'ADM047', 'MMR', '2014-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (962, 'ADM047', 'DPT Booster', '2014-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (963, 'ADM048', 'Hepatitis B', '2009-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (964, 'ADM048', 'Hepatitis B', '2009-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (965, 'ADM048', 'Hepatitis B', '2009-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (966, 'ADM048', 'MMR', '2010-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (967, 'ADM048', 'Polio', '2014-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (968, 'ADM048', 'MMR', '2014-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (969, 'ADM048', 'DPT Booster', '2014-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (970, 'ADM048', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (971, 'ADM049', 'Hepatitis B', '2016-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (972, 'ADM049', 'Hepatitis B', '2016-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (973, 'ADM049', 'Hepatitis B', '2016-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (974, 'ADM049', 'MMR', '2017-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (975, 'ADM049', 'Typhoid', '2018-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (976, 'ADM049', 'Polio', '2021-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (977, 'ADM049', 'MMR', '2021-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (978, 'ADM049', 'DPT Booster', '2021-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (979, 'ADM049', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (980, 'ADM050', 'Hepatitis B', '2015-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (981, 'ADM050', 'Hepatitis B', '2015-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (982, 'ADM050', 'Hepatitis B', '2015-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (983, 'ADM050', 'MMR', '2016-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (984, 'ADM050', 'Chickenpox', '2016-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (985, 'ADM050', 'Chickenpox', '2020-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (986, 'ADM050', 'MMR', '2020-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (987, 'ADM050', 'DPT Booster', '2020-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (988, 'ADM050', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (989, 'ADM051', 'Hepatitis B', '2014-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (990, 'ADM051', 'Hepatitis B', '2014-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (991, 'ADM051', 'Hepatitis B', '2014-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (992, 'ADM051', 'MMR', '2015-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (993, 'ADM051', 'Typhoid', '2016-06-15T00:00:00.000Z', '1st Dose', NULL, 'Typhoid conjugate vaccine', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (994, 'ADM051', 'Polio', '2019-01-20T00:00:00.000Z', 'Booster', NULL, 'Pulse Polio national immunization day', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (995, 'ADM051', 'MMR', '2019-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (996, 'ADM051', 'DPT Booster', '2019-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (997, 'ADM051', 'Typhoid', '2024-07-10T00:00:00.000Z', 'Booster', '2027-07-10T00:00:00.000Z', 'Valid for 3 years', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (998, 'ADM052', 'Hepatitis B', '2013-01-15T00:00:00.000Z', '1st Dose', NULL, 'Administered at birth in hospital', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (999, 'ADM052', 'Hepatitis B', '2013-02-15T00:00:00.000Z', '2nd Dose', NULL, 'Completed at 1 month', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1000, 'ADM052', 'Hepatitis B', '2013-07-15T00:00:00.000Z', '3rd Dose', NULL, 'Completed primary course', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1001, 'ADM052', 'MMR', '2014-03-10T00:00:00.000Z', '1st Dose', NULL, 'Given at 12 months', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1002, 'ADM052', 'Chickenpox', '2014-08-14T00:00:00.000Z', '1st Dose', NULL, NULL, '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1003, 'ADM052', 'Chickenpox', '2018-02-11T00:00:00.000Z', '2nd Dose', NULL, 'Varicella complete immunity confirmed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1004, 'ADM052', 'MMR', '2018-04-18T00:00:00.000Z', '2nd Dose', NULL, 'School-entry booster completed', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1005, 'ADM052', 'DPT Booster', '2018-08-20T00:00:00.000Z', 'Booster', NULL, '5-year DPT booster given', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";
INSERT INTO public."Immunization" ("id", "admissionNumber", "vaccine", "date", "dose", "nextDue", "remarks", "createdAt", "updatedAt")
VALUES (1006, 'ADM052', 'Tdap', '2024-09-12T00:00:00.000Z', 'Booster', '2034-09-12T00:00:00.000Z', 'Tetanus, Diphtheria, Pertussis 10-year coverage', '2026-09-11T10:07:25.425Z', '2026-09-11T10:07:25.425Z')
ON CONFLICT ("id") DO UPDATE SET "vaccine" = EXCLUDED."vaccine", "date" = EXCLUDED."date";

-- 5.6 Special Needs
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (24, 'ADM001', 'Penicillin (anaphylaxis); Peanut & Tree nuts (severe)', NULL, NULL, NULL, 'EpiPen Jr (0.15 mg) stored in school infirmary Cabinet A', 'On accidental exposure: Inject EpiPen immediately into outer mid-thigh, call 108/112, notify parents.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (25, 'ADM004', 'Dust mites, pollen', 'Mild Bronchial Asthma', NULL, NULL, 'Levosalbutamol inhaler with spacer (kept in school bag)', 'If wheezing or persistent cough: 2 puffs via spacer; repeat once after 10 mins if no relief.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (26, 'ADM005', NULL, 'Exercise-induced bronchospasm', NULL, NULL, 'Salbutamol inhaler 100 mcg (2 puffs before sports)', 'Keep student calm and seated upright during acute breathlessness; escalate to doctor if severe.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (27, 'ADM008', NULL, NULL, NULL, 'Mild developmental dyslexia; spatial visual orientation', NULL, 'Front-row seating; question papers in 14pt open-dyslexic font; 25% extra time in timed examinations.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (28, 'ADM011', NULL, 'Absence Epilepsy (Childhood)', NULL, NULL, 'Levetiracetam (Keppra) 250 mg twice daily', 'During seizure: Turn on side, protect head, do not restrain or place objects in mouth, time the episode.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (29, 'ADM013', NULL, 'Type 1 Diabetes Mellitus (Insulin-dependent)', NULL, NULL, 'Insulin Aspart with pen needles; Dexcom G6 Continuous Glucose Monitor', 'If blood glucose < 70 mg/dL: Administer 3 glucose tablets or juice box immediately. Re-test in 15 mins.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (30, 'ADM016', 'Wheat gluten (Celiac Disease - Autoimmune)', NULL, NULL, NULL, 'Oral multivitamin syrup daily', 'Strict zero-gluten diet; must not consume school cafeteria bakery items or unverified shared snacks.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (31, 'ADM018', NULL, NULL, 'Moderate sensorineural hearing loss in left ear (35 dB)', NULL, NULL, 'Wears digital hearing aid in left ear; preferential seating in center-front row; face student while speaking.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (32, 'ADM019', NULL, NULL, NULL, 'ADHD - Combined presentation (inattention & motor hyperactivity)', 'Methylphenidate 10 mg (taken at home at 7:30 AM)', 'Allow short 2-min movement breaks; minimize visual distractions near windows.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (33, 'ADM024', 'Hymenoptera (Bee / Wasp sting) anaphylaxis', NULL, NULL, NULL, 'EpiPen Auto-Injector 0.3 mg (kept in school emergency kit)', 'On sting: Scrape stinger out immediately, administer EpiPen into outer thigh, call ambulance.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (34, 'ADM028', NULL, 'Pediatric Migraine with visual aura', NULL, NULL, 'Paracetamol 500 mg (as per written parental consent)', 'At onset of aura (flashing lights): allow rest in dim, quiet infirmary with cold compress.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (35, 'ADM041', NULL, 'Left knee ACL Reconstruction (post-operative recovery)', 'Temporary mobility limitation', NULL, NULL, 'Excused from stairs when carrying heavy bag; exempt from high-impact sports till Dec 2026.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (36, 'ADM050', 'Favism / G6PD Deficiency triggers (Sulfa drugs, Naphthalene, Fava beans)', 'G6PD Deficiency', NULL, NULL, NULL, 'Do not administer sulfonamides, dapsone, or aspirin. Hospitalize immediately if jaundice or dark urine occurs.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";
INSERT INTO public."SpecialNeed" ("id", "admissionNumber", "allergies", "chronicIllness", "disabilities", "learningDifficulties", "medication", "emergencyNotes", "createdAt", "updatedAt")
VALUES (37, 'ADM052', 'Chicken egg (ovalbumin), severe atopic dermatitis', NULL, NULL, NULL, 'Cetirizine 5 mg, Hydrocortisone 1% topical ointment', 'Egg ingestion triggers urticaria and angioedema; administer oral antihistamine and contact parents.', '2026-09-11T10:07:25.446Z', '2026-09-11T10:07:25.446Z')
ON CONFLICT ("admissionNumber") DO UPDATE SET "allergies" = EXCLUDED."allergies", "emergencyNotes" = EXCLUDED."emergencyNotes";

-- 5.7 Attachments
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (8, 'ADM001', 'Allergy_Panel_Report_DrLalPath.pdf', '90c9a84f-02e3-409f-bbaa-f4d6ef24bd24.pdf', '/api/files/8', 'Blood Test Report', '2025-08-14T00:00:00.000Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (9, 'ADM005', 'Spirometry_Pulmonary_Function.pdf', 'a1b2c3d4-02e3-409f-bbaa-f4d6ef24bd25.pdf', '/api/files/9', 'Medical Report', '2025-09-02T00:00:00.000Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (10, 'ADM008', 'Spectacle_Prescription_Card.pdf', 'b2c3d4e5-02e3-409f-bbaa-f4d6ef24bd26.pdf', '/api/files/10', 'Prescription', '2024-11-20T00:00:00.000Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (11, 'ADM013', 'Endocrinologist_Care_Plan_2026.pdf', 'c3d4e5f6-02e3-409f-bbaa-f4d6ef24bd27.pdf', '/api/files/11', 'Medical Report', '2026-04-10T00:00:00.000Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (12, 'ADM024', 'Immunotherapy_Emergency_Protocol.pdf', 'd4e5f6a7-02e3-409f-bbaa-f4d6ef24bd28.pdf', '/api/files/12', 'Medical Report', '2025-10-18T00:00:00.000Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (13, 'ADM031', 'Orthodontic_Appliance_Summary.pdf', 'e5f6a7b8-02e3-409f-bbaa-f4d6ef24bd29.pdf', '/api/files/13', 'Medical Report', '2025-07-22T00:00:00.000Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";
INSERT INTO public."Attachment" ("id", "admissionNumber", "filename", "storedName", "fileUrl", "category", "uploadedDate")
VALUES (14, 'ADM001', 'test.pdf', 'e5cfe6e3-8688-4e54-bc2b-10a2a899fde0.pdf', '/api/files/14', 'Medical Report', '2026-09-14T05:14:17.804Z')
ON CONFLICT ("id") DO UPDATE SET "filename" = EXCLUDED."filename";

-- 5.8 Activity Logs
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (67, 'drmehta', 'doctor', 'Created health checkup', 'ADM001 · AY 2026-2027', '2026-09-06T18:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (68, 'drmehta', 'doctor', 'Created health checkup', 'ADM002 · AY 2026-2027', '2026-09-06T21:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (69, 'drsharma', 'doctor', 'Created health checkup', 'ADM005 · AY 2026-2027', '2026-09-07T01:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (70, 'nursepriya', 'doctor', 'Added immunization record', 'ADM001 · Typhoid Booster', '2026-09-07T04:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (71, 'admin', 'admin', 'Updated special needs', 'ADM013 · Type 1 Diabetes CGM updated', '2026-09-07T08:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (72, 'drmehta', 'doctor', 'Added observation', 'ADM007 · Pediatric nutrition follow-up', '2026-09-07T11:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (73, 'drsharma', 'doctor', 'Created health checkup', 'ADM009 · AY 2026-2027', '2026-09-07T15:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (74, 'nursepriya', 'doctor', 'Uploaded medical document', 'ADM001 · Allergy_Panel_Report_DrLalPath.pdf', '2026-09-07T18:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (75, 'drmehta', 'doctor', 'Created health checkup', 'ADM011 · AY 2026-2027', '2026-09-07T22:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (76, 'admin', 'admin', 'Updated student profile', 'ADM024 · Emergency contact phone updated', '2026-09-08T01:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (77, 'drsharma', 'doctor', 'Created health checkup', 'ADM013 · AY 2026-2027', '2026-09-08T05:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (78, 'nursepriya', 'doctor', 'Added immunization record', 'ADM021 · Tdap Booster', '2026-09-08T08:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (79, 'drmehta', 'doctor', 'Created health checkup', 'ADM017 · AY 2026-2027', '2026-09-08T12:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (80, 'drmehta', 'doctor', 'Added observation', 'ADM011 · Absence epilepsy classroom spell', '2026-09-08T15:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (81, 'drsharma', 'doctor', 'Created health checkup', 'ADM021 · AY 2026-2027', '2026-09-08T19:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (82, 'nursepriya', 'doctor', 'Added immunization record', 'ADM003 · Chickenpox Booster', '2026-09-08T22:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (83, 'admin', 'admin', 'Generated student report', 'ADM005 · Annual Health Card Print', '2026-09-09T02:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (84, 'drsharma', 'doctor', 'Created health checkup', 'ADM025 · AY 2026-2027', '2026-09-09T05:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (85, 'drmehta', 'doctor', 'Created health checkup', 'ADM029 · AY 2026-2027', '2026-09-09T09:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (86, 'nursepriya', 'doctor', 'Uploaded medical document', 'ADM008 · Spectacle_Prescription_Card.pdf', '2026-09-09T12:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (87, 'admin', 'admin', 'Updated special needs', 'ADM001 · Penicillin & Peanut alert reviewed', '2026-09-09T16:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (88, 'drsharma', 'doctor', 'Created health checkup', 'ADM033 · AY 2026-2027', '2026-09-09T19:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (89, 'drmehta', 'doctor', 'Created health checkup', 'ADM037 · AY 2026-2027', '2026-09-09T23:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (90, 'nursepriya', 'doctor', 'Added immunization record', 'ADM031 · Typhoid Booster', '2026-09-10T02:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (91, 'drmehta', 'doctor', 'Created health checkup', 'ADM041 · AY 2026-2027', '2026-09-10T06:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (92, 'drsharma', 'doctor', 'Created health checkup', 'ADM045 · AY 2026-2027', '2026-09-10T09:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (93, 'admin', 'admin', 'Generated student report', 'ADM013 · Annual Health Card Print', '2026-09-10T13:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (94, 'drmehta', 'doctor', 'Created health checkup', 'ADM047 · AY 2026-2027', '2026-09-10T16:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (95, 'drsharma', 'doctor', 'Created health checkup', 'ADM050 · AY 2026-2027', '2026-09-10T20:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (96, 'nursepriya', 'doctor', 'Uploaded medical document', 'ADM013 · Endocrinologist_Care_Plan_2026.pdf', '2026-09-10T23:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (97, 'drmehta', 'doctor', 'Added observation', 'ADM051 · High BP screening repeat alert', '2026-09-11T03:07:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (98, 'admin', 'admin', 'Created health checkup', 'ADM052 · AY 2026-2027', '2026-09-11T06:37:25.520Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (99, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-11T10:07:58.422Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (100, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-11T10:08:03.936Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (101, 'drmehta', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-11T10:08:11.626Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (102, 'drmehta', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-11T10:08:18.822Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (103, 'drmehta', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-11T10:08:26.302Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (104, 'drmehta', 'doctor', 'Added observation', 'ADM001 · AY 2026-2027', '2026-09-11T10:08:26.843Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (105, 'drmehta', 'doctor', 'Deleted observation', 'ADM001 · AY 2026-2027', '2026-09-11T10:08:28.106Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (106, 'drmehta', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-11T10:10:31.785Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (107, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-11T10:14:33.949Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (108, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T04:58:05.055Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (109, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T04:59:15.813Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (110, 'drmehta', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-14T05:14:02.889Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (111, 'admin', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-14T05:14:03.058Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (112, 'drmehta', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-14T05:14:17.343Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (113, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T05:14:17.446Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (114, 'parent', 'parent', 'Viewed health record', 'ADM002', '2026-09-14T05:14:17.488Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (115, 'undefined', 'doctor', 'Uploaded document', 'ADM001 · test.pdf (Medical Report)', '2026-09-14T05:14:17.823Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (116, 'drmehta', 'doctor', 'Uploaded document', 'ADM001 · ../../../traversal_test.pdf (Medical Report)', '2026-09-14T05:14:18.014Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (117, 'drmehta', 'doctor', 'Deleted document', 'ADM001 · ../../../traversal_test.pdf', '2026-09-14T05:14:19.228Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (118, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T05:14:33.056Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (119, 'admin', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-14T05:14:34.291Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (120, 'admin', 'doctor', 'Created student', 'TEST-ADM-999 · Automated Audit Student', '2026-09-14T05:14:34.549Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (121, 'admin', 'doctor', 'Updated student', 'TEST-ADM-999 · Automated Audit Student Updated', '2026-09-14T05:14:34.731Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (122, 'admin', 'doctor', 'Created health checkup', 'TEST-ADM-999 · AY 2025-2026', '2026-09-14T05:14:34.883Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (123, 'admin', 'doctor', 'Updated health checkup', 'TEST-ADM-999 · AY 2025-2026', '2026-09-14T05:14:35.057Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (124, 'admin', 'doctor', 'Added observation', 'TEST-ADM-999 · AY 2025-2026', '2026-09-14T05:14:35.230Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (125, 'admin', 'doctor', 'Updated observation', 'TEST-ADM-999 · AY 2025-2026', '2026-09-14T05:14:35.290Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (126, 'admin', 'doctor', 'Deleted observation', 'TEST-ADM-999 · AY 2025-2026', '2026-09-14T05:14:35.349Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (127, 'admin', 'doctor', 'Added immunization', 'TEST-ADM-999 · Tetanus Toxoid Booster (Booster)', '2026-09-14T05:14:35.480Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (128, 'admin', 'doctor', 'Updated immunization', 'TEST-ADM-999 · Tetanus Toxoid Booster', '2026-09-14T05:14:35.545Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (129, 'admin', 'doctor', 'Deleted immunization', 'TEST-ADM-999 · Tetanus Toxoid Booster', '2026-09-14T05:14:35.611Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (130, 'admin', 'doctor', 'Updated special needs', 'TEST-ADM-999', '2026-09-14T05:14:35.689Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (131, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T05:14:35.789Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (132, 'admin', 'doctor', 'Deleted student', 'TEST-ADM-999 · Automated Audit Student Updated', '2026-09-14T05:14:35.947Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (133, 'admin', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-14T05:15:12.329Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (134, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T05:15:26.284Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (135, 'parent', 'parent', 'Viewed health record', 'ADM001', '2026-09-14T05:15:33.482Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";
INSERT INTO public."ActivityLog" ("id", "actor", "role", "action", "details", "createdAt")
VALUES (136, 'admin', 'doctor', 'Signed in', 'Doctor portal login', '2026-09-14T05:15:33.599Z')
ON CONFLICT ("id") DO UPDATE SET "details" = EXCLUDED."details";

-- 6. RESET SEQUENCE COUNTERS
SELECT setval(pg_get_serial_sequence('public."HealthCheckup"', 'id'), COALESCE(MAX(id), 1)) FROM public."HealthCheckup";
SELECT setval(pg_get_serial_sequence('public."Observation"', 'id'), COALESCE(MAX(id), 1)) FROM public."Observation";
SELECT setval(pg_get_serial_sequence('public."Immunization"', 'id'), COALESCE(MAX(id), 1)) FROM public."Immunization";
SELECT setval(pg_get_serial_sequence('public."SpecialNeed"', 'id'), COALESCE(MAX(id), 1)) FROM public."SpecialNeed";
SELECT setval(pg_get_serial_sequence('public."Attachment"', 'id'), COALESCE(MAX(id), 1)) FROM public."Attachment";
SELECT setval(pg_get_serial_sequence('public."Doctor"', 'id'), COALESCE(MAX(id), 1)) FROM public."Doctor";
SELECT setval(pg_get_serial_sequence('public."ActivityLog"', 'id'), COALESCE(MAX(id), 1)) FROM public."ActivityLog";
