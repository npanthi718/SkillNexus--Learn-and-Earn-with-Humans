import React, { useState } from "react";
import axios from "axios";

const VerificationUpload = ({ files = [], type, onUpdate, token }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const selected = e.target.files;
    if (!selected?.length || !token) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("type", type);
      Array.from(selected).forEach((f) => formData.append("files", f));
      const { data } = await axios.post("/api/upload/verification", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      onUpdate([...(files || []), ...(data.urls || [])]);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const remove = (idx) => {
    const next = [...(files || [])];
    next.splice(idx, 1);
    onUpdate(next);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm theme-muted file:mr-2 file:rounded file:border-0 file:bg-nexus-500/20 file:px-2 file:py-1 file:text-xs disabled:opacity-60"
      />
      {uploading && <p className="text-xs text-amber-500">Uploading...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex flex-wrap gap-2 mt-1">
        {(files || []).map((item, i) => {
          const url = typeof item === "string" ? item : item?.url;
          if (!url) return null;
          return (
          <div key={i} className="relative group">
            <img src={url} alt="" className="h-16 w-16 rounded object-cover border border-white/20" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerificationUpload;
