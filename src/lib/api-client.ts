import type { ParentAccess, SessionUser, StudentProfile } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

/** JSON fetch wrapper — always sends the auth cookie, throws ApiError on failure. */
export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || "GET",
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }
  return data as T;
}

/** Multipart file upload for medical documents. */
export async function uploadAttachment(
  admissionNumber: string,
  file: File,
  category: string
): Promise<Attachment> {
  const form = new FormData();
  form.append("file", file);
  form.append("admissionNumber", admissionNumber);
  form.append("category", category);

  const res = await fetch("/api/uploads", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || `Upload failed (${res.status})`,
      res.status
    );
  }
  return (data as { attachment: Attachment }).attachment;
}

export type { ParentAccess, SessionUser, StudentProfile };
