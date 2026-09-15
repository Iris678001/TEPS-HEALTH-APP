import json

def main():
    with open('prisma/students.json', 'r', encoding='utf-8') as f:
        students = json.load(f)

    print(f'Read {len(students)} students.')

    lines = []
    lines.append('-- ====================================================================')
    lines.append('-- THE ELEGANT PUBLIC SCHOOL - HEALTH RECORD MANAGEMENT SYSTEM (SHRMS)')
    lines.append('-- PRODUCTION SUPABASE DATA: 688 REAL STUDENTS & 4 STAFF ACCOUNTS')
    lines.append('-- Medical tables left blank (0 records) for live entry')
    lines.append('-- ====================================================================\n')

    # 1. Staff Accounts
    lines.append('-- 1. STAFF / MEDICAL OFFICER ACCOUNTS')
    lines.append('''INSERT INTO public."Doctor" ("username", "password", "name", "role", "createdAt", "updatedAt")
VALUES
    ('admin', '$2a$10$w09uCjB3.8oEmsV7n11pTuB2925uO50iV3.X3Y.uK3f4p6JeqK1wW', 'Dr. Admin', 'admin', NOW(), NOW()),
    ('drmehta', '$2a$10$K7J0Wn7J.i2MvEaDov7L.uqbF9J24M.iQJ5p3yM7B4Qx1z9kC5QWy', 'Dr. Anita Mehta', 'doctor', NOW(), NOW()),
    ('drsharma', '$2a$10$K7J0Wn7J.i2MvEaDov7L.uqbF9J24M.iQJ5p3yM7B4Qx1z9kC5QWy', 'Dr. Rajesh Sharma', 'doctor', NOW(), NOW()),
    ('nursepriya', '$2a$10$G4B5/lF26A..jY5NlE4H9.mG8lK2.eH9XqQ3lA5vB6d7F8g9H0j1K', 'Nurse Priya Sen', 'doctor', NOW(), NOW())
ON CONFLICT ("username") DO UPDATE
SET "name" = EXCLUDED."name", "role" = EXCLUDED."role", "updatedAt" = NOW();
''')

    # 2. Clear old mock medical records
    lines.append('-- 2. CLEAR MEDICAL RECORDS (All records ready for fresh nurse/doctor entries)')
    lines.append('DELETE FROM public."Attachment";')
    lines.append('DELETE FROM public."SpecialNeed";')
    lines.append('DELETE FROM public."Immunization";')
    lines.append('DELETE FROM public."Observation";')
    lines.append('DELETE FROM public."HealthCheckup";\n')

    # 3. Students
    lines.append(f'-- 3. THE ELEGANT PUBLIC SCHOOL STUDENTS ({len(students)} Records)')
    lines.append('INSERT INTO public."Student" ("admissionNumber", "studentName", "class", "section", "gender", "dob", "bloodGroup", "parentName", "phone", "createdAt", "updatedAt")')
    lines.append('VALUES')

    def esc(val):
        if val is None:
            return 'NULL'
        return "'" + str(val).replace("'", "''") + "'"

    val_rows = []
    for s in students:
        row_str = f"    ({esc(s['admissionNumber'])}, {esc(s['studentName'])}, {esc(s['class'])}, {esc(s['section'])}, {esc(s['gender'])}, {esc(s['dob'])}, {esc(s.get('bloodGroup', 'N/A'))}, {esc(s['parentName'])}, {esc(s['phone'])}, NOW(), NOW())"
        val_rows.append(row_str)

    lines.append(',\n'.join(val_rows))
    lines.append('''ON CONFLICT ("admissionNumber") DO UPDATE SET
    "studentName" = EXCLUDED."studentName",
    "class" = EXCLUDED."class",
    "section" = EXCLUDED."section",
    "gender" = EXCLUDED."gender",
    "dob" = EXCLUDED."dob",
    "bloodGroup" = EXCLUDED."bloodGroup",
    "parentName" = EXCLUDED."parentName",
    "phone" = EXCLUDED."phone",
    "updatedAt" = NOW();
''')

    data_sql = '\n'.join(lines)

    with open('supabase/02_data.sql', 'w', encoding='utf-8') as f:
        f.write(data_sql)

    with open('supabase/03_real_students.sql', 'w', encoding='utf-8') as f:
        f.write(data_sql)

    print('Wrote supabase/02_data.sql and supabase/03_real_students.sql')

    with open('supabase/01_schema.sql', 'r', encoding='utf-8') as f:
        schema_sql = f.read()

    with open('supabase/complete_supabase_setup.sql', 'w', encoding='utf-8') as f:
        f.write(schema_sql.strip() + '\n\n' + data_sql)

    print('Rebuilt supabase/complete_supabase_setup.sql')

if __name__ == '__main__':
    main()
