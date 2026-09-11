import path from "path";

/**
 * Directory where uploaded medical documents are stored.
 * Swap this module for an S3/Cloudinary adapter in production —
 * the rest of the app only depends on `uploadFileToStorage` semantics
 * implemented in /api/uploads.
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "upload");

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
