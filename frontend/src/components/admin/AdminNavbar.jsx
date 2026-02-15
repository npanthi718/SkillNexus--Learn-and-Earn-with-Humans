import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import NotificationBell from "../shared/NotificationBell.jsx";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const [logoUrl, setLogoUrl] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const envLogo =
      (typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env.VITE_LOGO_URL) ||
      "";
    setLogoUrl(envLogo || "");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sn_token");
    navigate("/");
  };

  const NavLinks = () => (
    <>
      <Link
        to="/admin"
        onClick={() => setMenuOpen(false)}
        className={`rounded-lg border px-3 py-1.5 ${
          location.pathname === "/admin" || location.pathname === "/admin/"
            ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
            : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
        }`}
      >
        Dashboard
      </Link>
      <Link to="/admin/users" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/users")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Users</Link>
      <Link to="/admin/sessions" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/sessions")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Sessions</Link>
      <Link to="/admin/messages" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/messages")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Messages</Link>
      <Link to="/admin/reviews" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/reviews")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Reviews</Link>
      <Link to="/admin/payments" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/payments")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Payments</Link>
      <Link to="/admin/earnings" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/earnings")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Statement</Link>
      <Link to="/admin/settings" onClick={() => setMenuOpen(false)} className={`rounded-lg border px-3 py-1.5 ${
        location.pathname.includes("/admin/settings")
          ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white border-transparent"
          : isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}>Settings</Link>
      <button type="button" onClick={toggleTheme} className={`rounded-lg p-2 border ${isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/20 bg-white/5 hover:bg-white/10"}`} title={theme === "dark" ? "Light mode" : "Dark mode"}>{theme === "dark" ? "☀️" : "🌙"}</button>
      <button type="button" onClick={() => { setMenuOpen(false); navigate("/"); }} className={`rounded-lg border px-3 py-1.5 ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}>View Site</button>
      <button type="button" onClick={() => { setMenuOpen(false); handleLogout(); }} className={`rounded-lg border px-3 py-1.5 ${isLight ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100" : "border-red-400/50 bg-red-500/20 text-red-200 hover:bg-red-500/30"}`}>Logout</button>
    </>
  );

  return (
    <header className={`sticky top-0 z-30 border-b-2 backdrop-blur-md ${
      isLight ? "border-amber-400/50 bg-white/95" : "border-amber-500/30 bg-gradient-to-r from-amber-900/40 via-nexus-900/90 to-purple-900/40"
    }`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/admin" className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain border border-white/10" onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-2xl font-bold text-white">
              SN
            </div>
          )}
          <div className="leading-tight">
            <p className={`text-base font-bold tracking-wide ${isLight ? "text-amber-700" : "text-amber-200"}`}>Admin Control</p>
            <p className={`text-xs ${isLight ? "text-slate-600" : "text-white/70"}`}>SkillNexus Platform Management</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <NotificationBell token={typeof window !== "undefined" ? localStorage.getItem("sn_token") : null} isLight={isLight} />
          <div className="hidden sm:flex flex-wrap gap-2">{NavLinks()}</div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="sm:hidden rounded-lg border px-3 py-1.5"
          >
            ☰ Menu
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className={`fixed inset-0 z-40 sm:hidden ${isLight ? "bg-slate-900/30" : "bg-black/50"} backdrop-blur-sm`} onClick={() => setMenuOpen(false)}>
          <div className={`absolute top-0 right-0 h-full w-64 p-4 border-l ${isLight ? "bg-white border-amber-400/50" : "bg-nexus-900 border-amber-500/30"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Admin Menu</p>
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-full p-2">✕</button>
            </div>
            <div className="grid gap-2 text-xs">{NavLinks()}</div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminNavbar;
