import React from "react";

const sizes = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6"
};

const Loader = ({ size = "sm", className = "" }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-block animate-spin rounded-full border-2 border-white/30 border-t-white ${sizes[size]}`}
        aria-hidden="true"
      />
      <span className="text-[11px] text-white/60">Loading...</span>
    </div>
  );
};

export default Loader;
