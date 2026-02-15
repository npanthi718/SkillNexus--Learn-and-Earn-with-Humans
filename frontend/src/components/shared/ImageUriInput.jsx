import React, { useState } from "react";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext.jsx";

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
        <input type="file" onChange={handleFileChange} accept={effectiveAccept} multiple={multiple} className="text-sm" />
      )}
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {value && typeof value === "string" && (
        <div className={`rounded border p-2 ${isLight ? "border-slate-300 bg-slate-50" : "border-white/10 bg-black/30"}`}>
          {value.startsWith("data:") || (value.startsWith("http") && value.match(/\\.(png|jpg|jpeg|gif|webp)$/i)) ? (
            <img src={value} alt="Preview" className="max-h-48 rounded" onError={(e) => e.target.style.display = "none"} />
          ) : (
            <p className="text-xs break-all">{value}</p>
          )}
        </div>
      )}
      <label className="block text-sm theme-muted">{label}</label>
    </div>
  );
};

export default ImageUriInput;
