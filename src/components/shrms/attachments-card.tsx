"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  Loader2,
  FileCheck2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { uploadParentAttachment, deleteParentAttachment } from "@/lib/api-client";
import { ATTACHMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/helpers";
import type { Attachment } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AttachmentsCardProps {
  attachments: Attachment[];
  admissionNumber: string;
  readOnly: boolean;
  parentToken?: string;
  onChanged?: () => void;
  onAttachmentAdded?: (attachment: Attachment) => void;
  onAttachmentDeleted?: (id: number) => void;
}

function fileIcon(filename: string) {
  return /\.(pdf)$/i.test(filename) ? (
    <FileText className="h-4 w-4 text-red-500" />
  ) : (
    <ImageIcon className="h-4 w-4 text-sky-600" />
  );
}

export default function AttachmentsCard({
  attachments,
  admissionNumber,
  readOnly: _readOnly,
  parentToken,
  onChanged,
  onAttachmentAdded,
  onAttachmentDeleted,
}: AttachmentsCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>(ATTACHMENT_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isParent = Boolean(parentToken);

  const fileUrl = (a: Attachment, download = false) => {
    const sep = a.fileUrl.includes("?") ? "&" : "?";
    let url = isParent && parentToken ? `${a.fileUrl}${sep}t=${parentToken}` : a.fileUrl;
    if (download) url += `${url.includes("?") ? "&" : "?"}download=1`;
    return url;
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!parentToken) {
      toast.error("Document uploads are strictly managed by parents through the Parent Portal.");
      return;
    }

    setUploading(true);
    try {
      const newAttachment = await uploadParentAttachment(
        admissionNumber,
        file,
        category,
        parentToken
      );
      toast.success(`${file.name} uploaded successfully and saved to records.`);
      onAttachmentAdded?.(newAttachment);
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(a: Attachment) {
    if (!parentToken) {
      toast.error("Clinical staff cannot delete parent-submitted documents.");
      return;
    }

    if (!confirm(`Are you sure you want to remove "${a.filename}"?`)) {
      return;
    }

    setDeletingId(a.id);
    try {
      await deleteParentAttachment(a.id, parentToken);
      toast.success(`${a.filename} deleted.`);
      onAttachmentDeleted?.(a.id);
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete file.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="border-slate-200/90 shadow-2xs">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Medical Documents & Reports</CardTitle>
              {isParent ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-medium"
                >
                  <FileCheck2 className="h-3 w-3 text-emerald-600" />
                  Saved to Records
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-700 border-slate-200 gap-1 text-[11px] font-medium"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Parent Uploaded · Read-Only
                </Badge>
              )}
            </div>
            <CardDescription>
              {isParent
                ? "Upload vaccination cards, prescriptions, and lab reports (PDF, JPG, PNG · max 5 MB). Saved directly to official school health records."
                : "Official medical records and certificates submitted by parents. Clinical staff have view and download access."}
            </CardDescription>
          </div>

          {/* Upload controls — Exclusively visible to Parents */}
          {isParent && (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48 text-xs h-9" aria-label="Document category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTACHMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleUpload}
                aria-label="Choose file to upload"
              />
              <Button
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shrink-0 h-9"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Document
              </Button>
            </div>
          )}

          {/* Doctor Panel Notice (Doctors do NOT have upload controls) */}
          {!isParent && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 shrink-0">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Uploads managed exclusively by parents</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileCheck2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No documents uploaded</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {isParent
                ? "No medical documents uploaded yet. Use the upload controls above to attach vaccination certificates, prescriptions, or medical reports."
                : "No documents have been uploaded by parents for this student yet. Parents can submit records via the Parent Portal."}
            </p>
          </div>
        ) : (
          <ul className="divide-y max-h-96 overflow-y-auto -mx-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-slate-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  {fileIcon(a.filename)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{a.filename}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50/60 text-blue-700 border-blue-200">
                      {a.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                      Parent Uploaded
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploaded on {formatDate(a.uploadedDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={fileUrl(a)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${a.filename}`}
                      title="View file"
                    >
                      <Eye className="h-4 w-4 text-slate-600 hover:text-slate-900" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={fileUrl(a, true)}
                      aria-label={`Download ${a.filename}`}
                      title="Download file"
                    >
                      <Download className="h-4 w-4 text-slate-600 hover:text-slate-900" />
                    </a>
                  </Button>
                  {isParent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(a)}
                      disabled={deletingId === a.id}
                      aria-label={`Delete ${a.filename}`}
                      title="Delete document"
                    >
                      {deletingId === a.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
