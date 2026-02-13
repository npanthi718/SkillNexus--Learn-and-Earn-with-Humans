import React, { useState } from "react";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext.jsx";

/**
 * Option to provide image/video via URL or file upload.
 * When uploadType is set, uploads to Cloudinary via backend and stores the returned URL.
 * Props: value, onChange, placeholder, label, accept, multiple, uploadType
 * uploadType: "profile" | "video" | "proof" | "qr" | "image" - enables Cloudinary upload
 */
const ImageUriInput = ({
  value = "",
  onChange,
  placeholder = "Image URL or upload",
  label = "Image",
  accept = "image/*",
  multiple = false,
  uploadType = null
}) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isCloudinaryUrl = value && (value.startsWith("http") && (value.includes("cloudinary") || value.includes("res.cloudinary")));
  const [mode, setMode] = useState(value && (value.startsWith("data:") || isCloudinaryUrl) ? "upload" : "url");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const handleUrlChange = (e) => {
    onChange(e.target.value);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (uploadType && token) {
      setUploading(true);
      setUploadError("");
      try {
        const formData = new FormData();
        if (uploadType === "proof" && multiple) {
          Array.from(files).forEach((f) => formData.append("files", f));
          const { data } = await axios.post("/api/upload/proof", formData, {
            headers: { ...authHeaders, "Content-Type": "multipart/form-data" }
          });
          onChange((data.urls || []).join("\n"));
        } else {
          formData.append("file", files[0]);
          const endpoint = ["profile", "video", "proof", "qr", "image", "logo"].includes(uploadType)
            ? `/api/upload/${uploadType}`
            : "/api/upload/image";
          const { data } = await axios.post(endpoint, formData, {
            headers: { ...authHeaders, "Content-Type": "multipart/form-data" }
          });
          onChange(data.url || "");
        }
      } catch (err) {
        setUploadError(err.response?.data?.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    } else {
      // Fallback: base64 (no Cloudinary)
      if (multiple) {
        const readers = [];
        Array.from(files).forEach((file, i) => {
          const reader = new FileReader();
          reader.onload = () => {
            readers.push(reader.result);
            if (readers.length === files.length) onChange(readers.join("\n"));
          };
          reader.readAsDataURL(file);
        });
      } else {
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result);
        reader.readAsDataURL(files[0]);
      }
    }
    e.target.value = "";
  };

  const effectiveAccept = uploadType === "video" ? "video/*" : accept;
  const uploadLabel = uploadType === "video" ? "Upload video" : "Upload image";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("url"); setUploadError(""); }}
          className={`rounded px-2 py-1.5 text-sm font-medium ${
            mode === "url"
              ? "bg-nexus-500/30 text-nexus-200 border border-nexus-400/50"
              : isLight ? "border-slate-300 text-slate-600 hover:bg-slate-100" : "border border-white/20 text-white/60 hover:bg-white/5"
          }`}
        >
          Provide URL
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); setUploadError(""); }}
          className={`rounded px-2 py-1.5 text-sm font-medium ${
            mode === "upload"
              ? "bg-nexus-500/30 text-nexus-200 border border-nexus-400/50"
              : isLight ? "border-slate-300 text-slate-600 hover:bg-slate-100" : "border border-white/20 text-white/60 hover:bg-white/5"
          }`}
        >
          {uploadLabel}
        </button>
      </div>
      {mode === "url" ? (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm outline-none"
        />
      ) : (
        <div>
          <input
            type="file"
            accept={effectiveAccept}
            multiple={uploadType === "proof" && multiple}
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-slate-600 dark:text-white/70 file:mr-4 file:rounded file:border-0 file:bg-nexus-500/20 file:px-3 file:py-1 file:text-xs file:font-medium disabled:opacity-60"
          />
          {uploading && <p className="mt-1 text-xs text-amber-500">Uploading...</p>}
          {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
          {value && (value.startsWith("data:") || (value.startsWith("http") && value.includes("cloudinary"))) && !uploading && (
            <p className="mt-1 text-xs text-emerald-500">{uploadType ? "Uploaded to Cloudinary." : "Loaded."} Click {uploadLabel} again to replace.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUriInput;
