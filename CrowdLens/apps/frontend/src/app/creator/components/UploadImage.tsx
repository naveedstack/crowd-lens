"use client";

import axios from "axios";
import { useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
import { isUiPreview } from "@/lib/ui-preview";
import { api } from "@/lib/api";

const NEXT_PUBLIC_CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type UploadImageProps = {
  onImageAdded: (image: string) => void;
  disabled?: boolean;
};

export function UploadImage({ onImageAdded, disabled }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function onFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file || disabled) {
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, or GIF image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      if (isUiPreview) {
        onImageAdded(URL.createObjectURL(file));
        return;
      }

      const response = await api.get("/presigned-url", {
        params: { contentType: file.type },
      });

      const { preSignedUrl, fields } = response.data;
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", file);

      await axios.post(preSignedUrl, formData, {
        onUploadProgress: (event) => {
          if (!event.total) {
            return;
          }
          setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });

      const publicUrl = `${NEXT_PUBLIC_CLOUDFRONT_URL}/${fields.key}`;
      onImageAdded(publicUrl);
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className={`flex h-40 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/40 text-2xl text-slate-300 ${disabled ? "opacity-40 pointer-events-none" : "cursor-pointer hover:border-violet-500"}`}>
      <div className="h-full flex justify-center flex-col relative w-full">
        <div className="h-full flex justify-center w-full items-center text-4xl">
          {uploading ? (
            <div className="text-sm text-slate-400">{progress}%</div>
          ) : (
            <>
              +
              <input
                className="w-full h-full"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
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
