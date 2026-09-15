import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Supabase admin client — used exclusively for Storage operations
 * (file uploads, signed URLs, deletes).
 *
 * All database reads and writes now go through Prisma → Supabase PostgreSQL directly.
 * The syncXxxToSupabase functions below are preserved as no-ops so that existing
 * API route imports continue to compile without modification.
 */
export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;


// ─── No-op DB sync stubs ──────────────────────────────────────────────────────
// Prisma now points directly at Supabase PostgreSQL — no secondary sync needed.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncCheckupToSupabase(_checkup: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncObservationToSupabase(_obs: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncImmunizationToSupabase(_imm: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncSpecialNeedToSupabase(_sn: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncAttachmentToSupabase(_att: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncStudentToSupabase(_student: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncDoctorToSupabase(_doctor: any, _action: string) {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncActivityLogToSupabase(_log: any) {}

// ─── Supabase Storage Bucket Operations ──────────────────────────────────────

export async function uploadFileToSupabaseBucket(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  if (!supabaseAdmin) return null;
  try {
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
