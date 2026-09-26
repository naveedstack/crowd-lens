"use client";

import axios from "axios";
import { useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
import { isUiPreview } from "@/lib/ui-preview";
import { api } from "@/lib/api";

const NEXT_PUBLIC_CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
const MAX_BYTES = 5 * 1024 * 1024;

type UploadImageProps = {
  onImageAdded: (image: string) => void;
  disabled?: boolean;
  maxFiles?: number;
};

export function UploadImage({ onImageAdded, disabled, maxFiles = 5 }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  async function uploadOne(file: File) {
    if (isUiPreview) {
      onImageAdded(URL.createObjectURL(file));
      return;
    }

    const response = await api.get("/presigned-url", {
      params: { contentType: file.type || "image/jpeg" },
    });

    const { preSignedUrl, fields } = response.data;
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    formData.append("file", file);

    await axios.post(preSignedUrl, formData);
    onImageAdded(`${NEXT_PUBLIC_CLOUDFRONT_URL}/${fields.key}`);
  }

  async function onFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const selected = Array.from(input.files ?? []);
    input.value = "";
    if (selected.length === 0 || disabled) {
      return;
    }

    const room = Math.max(0, maxFiles);
    if (room === 0) {
      toast.error("This task already has the maximum number of images");
      return;
    }

    const images = selected.filter((file) => file.type.startsWith("image/"));
    const skippedType = selected.length - images.length;
    const batch = images.slice(0, room);
    if (skippedType > 0) {
      toast.error("Only image files can be added");
    }
    if (images.length > room) {
      toast.error(room === 1 ? "Only 1 more image can be added" : `Only ${room} more images can be added`);
    }
    if (batch.length === 0) {
      return;
    }

    setUploading(true);
    setProgress("");
    let uploaded = 0;
    try {
      for (const file of batch) {
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} must be 5MB or smaller`);
          continue;
        }
        setProgress(`${uploaded + 1}/${batch.length}`);
        try {
          await uploadOne(file);
          uploaded += 1;
        } catch (err) {
          console.error("Upload failed", err);
          toast.error(`Upload failed for ${file.name}`);
        }
      }
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  return (
    <div className={`flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/40 text-slate-300 ${disabled || uploading ? "opacity-40 pointer-events-none" : "cursor-pointer hover:border-violet-500"}`}>
      <div className="h-full flex justify-center flex-col relative w-full">
        <div className="h-full flex justify-center w-full items-center text-center px-3">
          {uploading ? (
            <div className="text-sm text-slate-400">{progress}</div>
          ) : (
            <>
              <span className="text-sm text-slate-400">Add images</span>
              <input
                className="w-full h-full"
                type="file"
                accept="image/*"
                multiple
                disabled={disabled}
                style={{ position: "absolute", opacity: 0, top: 0, left: 0, bottom: 0, right: 0, width: "100%", height: "100%" }}
                onChange={onFileSelect}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
