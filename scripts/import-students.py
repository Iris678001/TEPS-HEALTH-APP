import openpyxl
import sqlite3
import re
from datetime import datetime, timezone

excel_path = r"C:\Users\rusth\Downloads\The_Elegant Public School Students Report (1).xlsx"
db_path = r"db/custom.db"

wb = openpyxl.load_workbook(excel_path, data_only=True)
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))[2:]

print(f"Loaded {len(rows)} rows from Excel.")

def parse_prog(prog):
    if not prog:
        return ("Unknown", "A")
    prog = str(prog).strip()
    m = re.match(r"^(?:Std\s+)?(KG\s*\d|[IVXLCDM]+)(?:\s+[\w\s]+)?\(([A-Z0-9]+)\)$", prog, re.IGNORECASE)
    if m:
        cls, sec = m.groups()
        return (cls.strip(), sec.strip().upper())
    m2 = re.match(r"^(.*?)\(([A-Z0-9]+)\)$", prog)
    if m2:
        cls = m2.group(1).replace("Std", "").strip()
        sec = m2.group(2).strip().upper()
        return (cls, sec)
    return (prog, "A")

def format_name(name):
    if not name:
        return ""
    words = str(name).strip().split()
    formatted = []
    for w in words:
        if len(w) <= 2:
            formatted.append(w.upper())
        else:
            formatted.append(w.capitalize())
    return " ".join(formatted)

students = []
now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

for idx, r in enumerate(rows):
    sl, adm, name, prog, father, roll, gender, dob, cat, phone, action = r[1:12]
    if not adm and not name:
        continue
    
    adm_clean = str(adm).strip()
    name_clean = format_name(name)
    cls, sec = parse_prog(prog)
    
    g_raw = str(gender).strip().upper() if gender else "O"
    if g_raw == "M":
        gender_clean = "Male"
    elif g_raw == "F":
        gender_clean = "Female"
    else:
        gender_clean = "Other"
        
    if dob:
        dob_str = str(dob).strip()
        parsed_dt = None
        for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%d.%m.%Y"):
            try:
                parsed_dt = datetime.strptime(dob_str, fmt)
                break
            except ValueError:
                pass
        if parsed_dt:
            dob_iso = datetime(parsed_dt.year, parsed_dt.month, parsed_dt.day, 0, 0, 0, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        else:
            dob_iso = "2008-01-01T00:00:00.000Z"
    else:
        # Default for the 1 missing student (Class XII Science)
        dob_iso = "2008-01-01T00:00:00.000Z"
        
    parent_clean = format_name(father) if father and str(father).strip() else "Parent / Guardian"
    
    if phone:
        phone_clean = str(phone).strip().replace(".0", "")
    else:
        phone_clean = "9995920120"
        
    students.append((
        adm_clean,
        name_clean,
        cls,
        sec,
        gender_clean,
        dob_iso,
        "N/A", # bloodGroup
        parent_clean,
        phone_clean,
        now_iso,
        now_iso
    ))

print(f"Prepared {len(students)} students for import.")

# Connect to database
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check foreign keys
cur.execute("PRAGMA foreign_keys = ON;")

# Delete all existing records in student health tables
print("Clearing mock health checkups, observations, immunizations, special needs, attachments...")
cur.execute("DELETE FROM HealthCheckup;")
cur.execute("DELETE FROM Observation;")
cur.execute("DELETE FROM Immunization;")
cur.execute("DELETE FROM SpecialNeed;")
cur.execute("DELETE FROM Attachment;")
cur.execute("DELETE FROM Student;")

print("Existing mock student records cleared.")

# Insert all real students
cur.executemany(
    """
    INSERT INTO Student (admissionNumber, studentName, class, section, gender, dob, bloodGroup, parentName, phone, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
    students
)
conn.commit()

# Verify counts
cur.execute("SELECT COUNT(*) FROM Student;")
total_students = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM HealthCheckup;")
total_checkups = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM Observation;")
total_obs = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM Immunization;")
total_imm = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM SpecialNeed;")
total_sn = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM Doctor;")
total_doctors = cur.fetchone()[0]

print("=== DATABASE IMPORT COMPLETE ===")
print(f"Total Students: {total_students} (Expected: {len(students)})")
print(f"Total HealthCheckups: {total_checkups} (Expected: 0)")
print(f"Total Observations: {total_obs} (Expected: 0)")
print(f"Total Immunizations: {total_imm} (Expected: 0)")
print(f"Total SpecialNeeds: {total_sn} (Expected: 0)")
print(f"Total Staff/Doctors: {total_doctors}")

# Print sample 5 imported students
cur.execute("SELECT admissionNumber, studentName, class, section, gender, dob, parentName, phone FROM Student LIMIT 5;")
print("\nSample Imported Students:")
for s in cur.fetchall():
    print(" ", s)

conn.close()