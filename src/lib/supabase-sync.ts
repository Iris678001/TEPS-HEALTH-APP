import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lnelcfeeuhvyylqmxrhp.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// ─── Health Checkups ─────────────────────────────────────────────────────────

export async function syncCheckupToSupabase(
  checkup: {
    id: number;
    admissionNumber: string;
    academicYear: string;
    checkupDate: Date | string;
    height: number;
    weight: number;
    bmi: number;
    eyesightLeft: string;
    eyesightRight: string;
    dentalHealth: string;
    bloodPressure: string;
    nutritionalStatus: string;
    nutritionRemarks: string | null;
    entEars?: string | null;
    entNose?: string | null;
    entThroat?: string | null;
    entRemarks?: string | null;
    doctorName: string;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("HealthCheckup")
        .delete()
        .eq("id", checkup.id);
      if (error) console.error("Database sync delete error (HealthCheckup):", error.message);
    } else {
      const payload: Record<string, unknown> = {
        id: checkup.id,
        admissionNumber: checkup.admissionNumber,
        academicYear: checkup.academicYear,
        checkupDate: new Date(checkup.checkupDate).toISOString(),
        height: checkup.height,
        weight: checkup.weight,
        bmi: checkup.bmi,
        eyesightLeft: checkup.eyesightLeft,
        eyesightRight: checkup.eyesightRight,
        dentalHealth: checkup.dentalHealth,
        bloodPressure: checkup.bloodPressure,
        nutritionalStatus: checkup.nutritionalStatus,
        nutritionRemarks: checkup.nutritionRemarks,
        entEars: checkup.entEars ?? "Normal",
        entNose: checkup.entNose ?? "Normal",
        entThroat: checkup.entThroat ?? "Normal",
        entRemarks: checkup.entRemarks ?? null,
        doctorName: checkup.doctorName,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin.from("HealthCheckup").upsert(
        payload,
        { onConflict: "admissionNumber,academicYear" }
      );
      if (error) {
        // Graceful fallback if remote schema has not yet migrated ENT columns
        if (error.message?.includes("ent") || error.code === "PGRST204") {
          delete payload.entEars;
          delete payload.entNose;
          delete payload.entThroat;
          delete payload.entRemarks;
          await supabaseAdmin.from("HealthCheckup").upsert(
            payload,
            { onConflict: "admissionNumber,academicYear" }
          );
        } else {
          console.error("Database sync upsert error (HealthCheckup):", error.message);
        }
      }
    }
  } catch (err) {
    console.error("Database sync exception (HealthCheckup):", err);
  }
}

// ─── Observations ────────────────────────────────────────────────────────────

export async function syncObservationToSupabase(
  observation: {
    id: number;
    admissionNumber: string;
    academicYear: string;
    observation: string;
    recommendation: string;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("Observation")
        .delete()
        .eq("id", observation.id);
      if (error) console.error("Supabase sync delete error (Observation):", error.message);
    } else {
      const { error } = await supabaseAdmin.from("Observation").upsert({
        id: observation.id,
        admissionNumber: observation.admissionNumber,
        academicYear: observation.academicYear,
        observation: observation.observation,
        recommendation: observation.recommendation,
        updatedAt: new Date().toISOString(),
      });
      if (error) console.error("Supabase sync upsert error (Observation):", error.message);
    }
  } catch (err) {
    console.error("Supabase sync exception (Observation):", err);
  }
}

// ─── Immunizations ───────────────────────────────────────────────────────────

export async function syncImmunizationToSupabase(
  immunization: {
    id: number;
    admissionNumber: string;
    vaccine: string;
    date: Date | string;
    dose: string;
    nextDue: Date | string | null;
    remarks: string | null;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("Immunization")
        .delete()
        .eq("id", immunization.id);
      if (error) console.error("Supabase sync delete error (Immunization):", error.message);
    } else {
      const { error } = await supabaseAdmin.from("Immunization").upsert({
        id: immunization.id,
        admissionNumber: immunization.admissionNumber,
        vaccine: immunization.vaccine,
        date: new Date(immunization.date).toISOString(),
        dose: immunization.dose,
        nextDue: immunization.nextDue ? new Date(immunization.nextDue).toISOString() : null,
        remarks: immunization.remarks,
        updatedAt: new Date().toISOString(),
      });
      if (error) console.error("Supabase sync upsert error (Immunization):", error.message);
    }
  } catch (err) {
    console.error("Supabase sync exception (Immunization):", err);
  }
}

// ─── Special Needs ───────────────────────────────────────────────────────────

export async function syncSpecialNeedToSupabase(
  specialNeed: {
    admissionNumber: string;
    allergies: string | null;
    chronicIllness: string | null;
    disabilities: string | null;
    learningDifficulties: string | null;
    medication: string | null;
    emergencyNotes: string | null;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("SpecialNeed")
        .delete()
        .eq("admissionNumber", specialNeed.admissionNumber);
      if (error) console.error("Supabase sync delete error (SpecialNeed):", error.message);
    } else {
      const { error } = await supabaseAdmin.from("SpecialNeed").upsert(
        {
          admissionNumber: specialNeed.admissionNumber,
          allergies: specialNeed.allergies,
          chronicIllness: specialNeed.chronicIllness,
          disabilities: specialNeed.disabilities,
          learningDifficulties: specialNeed.learningDifficulties,
          medication: specialNeed.medication,
          emergencyNotes: specialNeed.emergencyNotes,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "admissionNumber" }
      );
      if (error) console.error("Supabase sync upsert error (SpecialNeed):", error.message);
    }
  } catch (err) {
    console.error("Supabase sync exception (SpecialNeed):", err);
  }
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function syncStudentToSupabase(
  student: {
    admissionNumber: string;
    studentName: string;
    class: string;
    section: string;
    gender: string;
    dob: Date | string;
    bloodGroup: string;
    parentName: string;
    phone: string;
    aadhaarNumber?: string | null;
    address?: string | null;
    identificationMarks?: string | null;
    emergencyContact?: string | null;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("Student")
        .delete()
        .eq("admissionNumber", student.admissionNumber);
      if (error) console.error("Supabase sync delete error (Student):", error.message);
    } else {
      const payload: Record<string, unknown> = {
        admissionNumber: student.admissionNumber,
        studentName: student.studentName,
        class: student.class,
        section: student.section,
        gender: student.gender,
        dob: new Date(student.dob).toISOString(),
        bloodGroup: student.bloodGroup,
        parentName: student.parentName,
        phone: student.phone,
        updatedAt: new Date().toISOString(),
      };

      if (student.aadhaarNumber !== undefined) payload.aadhaarNumber = student.aadhaarNumber;
      if (student.address !== undefined) payload.address = student.address;
      if (student.identificationMarks !== undefined) payload.identificationMarks = student.identificationMarks;
      if (student.emergencyContact !== undefined) payload.emergencyContact = student.emergencyContact;

      const { error } = await supabaseAdmin.from("Student").upsert(
        payload,
        { onConflict: "admissionNumber" }
      );
      if (error) {
        // If Supabase table does not yet have the extra columns, gracefully fallback to standard fields
        if (error.message?.includes("column") || error.code === "PGRST204") {
          const { error: fallbackError } = await supabaseAdmin.from("Student").upsert(
            {
              admissionNumber: student.admissionNumber,
              studentName: student.studentName,
              class: student.class,
              section: student.section,
              gender: student.gender,
              dob: new Date(student.dob).toISOString(),
              bloodGroup: student.bloodGroup,
              parentName: student.parentName,
              phone: student.phone,
              updatedAt: new Date().toISOString(),
            },
            { onConflict: "admissionNumber" }
          );
          if (fallbackError) {
            console.error("Supabase sync fallback upsert error (Student):", fallbackError.message);
          }
        } else {
          console.error("Supabase sync upsert error (Student):", error.message);
        }
      }
    }
  } catch (err) {
    console.error("Supabase sync exception (Student):", err);
  }
}

// ─── Doctors & Staff ─────────────────────────────────────────────────────────

export async function syncDoctorToSupabase(
  doctor: {
    username: string;
    password?: string;
    name?: string;
    role?: string;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("Doctor")
        .delete()
        .eq("username", doctor.username);
      if (error) console.error("Supabase sync delete error (Doctor):", error.message);
    } else {
      const payload: Record<string, unknown> = {
        username: doctor.username,
        updatedAt: new Date().toISOString(),
      };
      if (doctor.password) payload.password = doctor.password;
      if (doctor.name) payload.name = doctor.name;
      if (doctor.role) payload.role = doctor.role;

      const { error } = await supabaseAdmin
        .from("Doctor")
        .upsert(payload, { onConflict: "username" });
      if (error) console.error("Supabase sync upsert error (Doctor):", error.message);
    }
  } catch (err) {
    console.error("Supabase sync exception (Doctor):", err);
  }
}

// ─── Activity Logs ───────────────────────────────────────────────────────────

export async function syncActivityLogToSupabase(log: {
  actor: string;
  role: string;
  action: string;
  details: string;
}) {
  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin.from("ActivityLog").insert({
      actor: log.actor,
      role: log.role,
      action: log.action,
      details: log.details,
      createdAt: new Date().toISOString(),
    });
    if (error) console.error("Supabase sync insert error (ActivityLog):", error.message);
  } catch (err) {
    console.error("Supabase sync exception (ActivityLog):", err);
  }
}

// ─── Attachments (Medical Documents Metadata) ────────────────────────────────

export async function syncAttachmentToSupabase(
  attachment: {
    id: number;
    admissionNumber: string;
    filename: string;
    storedName: string;
    fileUrl: string;
    category: string;
    uploadedDate?: Date | string;
  },
  action: "upsert" | "delete"
) {
  if (!supabaseAdmin) return;
  try {
    if (action === "delete") {
      const { error } = await supabaseAdmin
        .from("Attachment")
        .delete()
        .eq("id", attachment.id);
      if (error) console.error("Supabase sync delete error (Attachment):", error.message);
    } else {
      const { error } = await supabaseAdmin.from("Attachment").upsert(
        {
          id: attachment.id,
          admissionNumber: attachment.admissionNumber,
          filename: attachment.filename,
          storedName: attachment.storedName,
          fileUrl: attachment.fileUrl,
          category: attachment.category,
          uploadedDate: attachment.uploadedDate
            ? new Date(attachment.uploadedDate).toISOString()
            : new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (error) console.error("Supabase sync upsert error (Attachment):", error.message);
    }
  } catch (err) {
    console.error("Supabase sync exception (Attachment):", err);
  }
}

// ─── Supabase Storage Bucket Operations ──────────────────────────────────────

export async function uploadFileToSupabaseBucket(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  if (!supabaseAdmin) return null;
  try {
    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === bucketName);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    }

    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Supabase storage upload error (${bucketName}):`, error.message);
      return null;
    }

    const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.error(`Supabase storage upload exception (${bucketName}):`, err);
    return null;
  }
}

export async function deleteFileFromSupabaseBucket(
  bucketName: string,
  filePath: string
): Promise<boolean> {
  if (!supabaseAdmin) return false;
  try {
    const { error } = await supabaseAdmin.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.error(`Supabase storage delete error (${bucketName}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Supabase storage delete exception (${bucketName}):`, err);
    return false;
  }
}
