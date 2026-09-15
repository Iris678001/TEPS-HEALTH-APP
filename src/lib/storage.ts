/**
 * Storage helpers shared across upload/download routes.
 *
 * File storage is handled exclusively by Supabase Storage.
 * The local filesystem is NOT used — Netlify serverless has no persistent disk.
 *
 * Upload entry-point : POST /api/parent/uploads
 * Download entry-point: GET  /api/files/:id
 */

export const SUPABASE_BUCKET = "health-records";

export const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export function extOf(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}
