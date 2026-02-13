import React, { useState } from "react";

const Avatar = ({ src, name = "", size = "md", className = "", showNoPhoto = false }) => {
  const [imgError, setImgError] = useState(false);
  const hasValidSrc = src && (src.startsWith("http") || src.startsWith("data:")) && !imgError;

  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-14 w-14 text-lg",
    "2xl": "h-20 w-20 text-xl",
    "3xl": "h-32 w-32 text-2xl"
  };

  const getInitials = () => {
    if (!name || typeof name !== "string") return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const placeholderContent = showNoPhoto && !name ? (
    <span className="text-[8px] font-medium opacity-80">No photo</span>
  ) : (
    getInitials()
  );

  return (
    <div
      className={`avatar shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-gradient-to-br from-nexus-500 to-purple-500 flex items-center justify-center font-semibold text-white ${sizeClasses[size]} ${className}`}
      title={name || "User"}
    >
      {hasValidSrc ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
        />
      ) : (
        placeholderContent
      )}
    </div>
  );
};

export default Avatar;
