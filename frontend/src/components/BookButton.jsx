import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";

const BookButton = ({ teacherId, isVerified = false, className = "" }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  if (!isVerified) return null;
  return (
    <button
      type="button"
      onClick={() => navigate(`/teachers?book=${teacherId}`)}
      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-white/80 hover:bg-white/10"} ${className}`}
    >
      Book
    </button>
  );
};

export default BookButton;
