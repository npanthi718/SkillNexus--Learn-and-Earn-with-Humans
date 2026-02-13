import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";

const Footer = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <footer className={`mt-auto border-t py-6 ${
      isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-nexus-900/30"
    }`}>
      <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <p className={isLight ? "text-slate-600" : "text-white/60"}>© SkillNexus · Learn from humans</p>
        <div className="flex gap-4">
          <Link to="/legal/privacy" className={isLight ? "text-slate-600 hover:text-slate-900 hover:underline" : "text-white/60 hover:text-white hover:underline"}>
            Privacy Policy
          </Link>
          <Link to="/legal/terms" className={isLight ? "text-slate-600 hover:text-slate-900 hover:underline" : "text-white/60 hover:text-white hover:underline"}>
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
