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
} from "lucide-react";
import { toast } from "sonner";
import { api, uploadAttachment } from "@/lib/api-client";
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
  readOnly,
  parentToken,
  onChanged,
}: AttachmentsCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>(ATTACHMENT_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fileUrl = (a: Attachment, download = false) => {
    const sep = a.fileUrl.includes("?") ? "&" : "?";
    let url = readOnly && parentToken ? `${a.fileUrl}${sep}t=${parentToken}` : a.fileUrl;
    if (download) url += `${url.includes("?") ? "&" : "?"}download=1`;
    return url;
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAttachment(admissionNumber, file, category);
      toast.success(`${file.name} uploaded.`);
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(a: Attachment) {
    setDeletingId(a.id);
    try {
      await api(`/api/files/${a.id}`, { method: "DELETE" });
      toast.success(`${a.filename} deleted.`);
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete file.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Medical Documents</CardTitle>
            <CardDescription>
              Reports, X-rays, prescriptions and vaccination certificates (PDF, JPG, PNG · max 5 MB).
            </CardDescription>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-44" aria-label="Document category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ATTACHMENT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
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
                className="gap-2"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileCheck2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No documents uploaded</p>
            <p className="text-xs text-muted-foreground mt-1">
              {readOnly
                ? "No medical documents are attached to this record yet."
                : "Upload blood test reports, X-rays, prescriptions and more."}
            </p>
          </div>
        ) : (
          <ul className="divide-y max-h-96 overflow-y-auto -mx-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-blue-50/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  {fileIcon(a.filename)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{a.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.uploadedDate)} ·{" "}
                    <Badge variant="outline" className="ml-0.5 text-[10px] px-1 py-0">
                      {a.category}
                    </Badge>
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={fileUrl(a)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${a.filename}`}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a
                      href={fileUrl(a, true)}
                      aria-label={`Download ${a.filename}`}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(a)}
                      disabled={deletingId === a.id}
                      aria-label={`Delete ${a.filename}`}
                      title="Delete"
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
