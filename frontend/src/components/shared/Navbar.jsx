import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const Navbar = ({ onRequireAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopLinkCls = (path) => {
    const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
    const base = isLight ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900" : "text-white/80 hover:bg-white/10 hover:text-white";
    const selected = "bg-gradient-to-r from-nexus-500 to-purple-500 text-white";
    return `flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${active ? selected : base}`;
  };
  const linkCls = (path) => {
    const active = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
    const base = isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10";
    const selected = "bg-gradient-to-r from-nexus-500 to-purple-500 text-white";
    return `block rounded-lg px-3 py-2 ${active ? selected : base}`;
  };
  const goto = (path) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (token) navigate(path);
    else onRequireAuth && onRequireAuth(path);
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) {
      setCurrentUser(null);
      return;
    }
    axios
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setCurrentUser(res.data.user);
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, [location.pathname]);

  useEffect(() => {
    axios
      .get("/api/platform/payment-details")
      .then((res) => {
        setLogoUrl(res.data.logoUrl || "");
      })
      .catch(() => {
        setLogoUrl("");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sn_token");
    setCurrentUser(null);
    navigate("/");
  };

  const isLight = theme === "light";
  return (
    <header className={`sticky top-0 z-30 border-b ${
      isLight ? "border-slate-200 bg-white" : "border-white/10 bg-nexus-900"
    }`}>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="SkillNexus logo" className="h-12 w-12 rounded-xl object-contain border border-white/10" onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-nexus-500 to-purple-500 text-2xl font-bold text-white">
              SN
            </div>
          )}
          <div className="leading-tight">
            <p className={`text-base font-semibold tracking-wide ${isLight ? "text-slate-800" : ""}`}>SkillNexus</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>Learn from humans, not videos</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="md:hidden">
              <NotificationBell token={typeof window !== "undefined" ? localStorage.getItem("sn_token") : null} isLight={isLight} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className={`md:hidden rounded-lg p-2 ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/80 hover:bg-white/10"}`}
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className={`hidden md:flex items-center gap-4 text-sm ml-2 md:ml-6`}>
          <Link to="/" className={desktopLinkCls("/")}>
            <span>🏠</span>
            <span>Home</span>
          </Link>
          <Link to="/teachers" className={desktopLinkCls("/teachers")}>
            <span>👨‍🏫</span>
            <span>Teachers</span>
          </Link>
          <Link to="/users" className={desktopLinkCls("/users")}>
            <span>👥</span>
            <span>Users</span>
          </Link>
          <Link to="/dashboard" className={desktopLinkCls("/dashboard")}>
            <span>📊</span>
            <span>Dashboard</span>
          </Link>
          {currentUser ? (
            <>
              <NotificationBell token={typeof window !== "undefined" ? localStorage.getItem("sn_token") : null} isLight={isLight} />
              {currentUser.role === "Admin" && (
                <Link
                  to="/admin"
                  className="rounded-full border border-amber-400/60 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/10"
                >
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-2">
                <Link
                  to="/me/profile"
                  className={`rounded-full border px-3 py-1 text-xs ${
                    isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {currentUser.name.split(" ")[0]}
                </Link>
                <Link
                  to={`/profile/${currentUser._id}`}
                  className={`rounded-full border px-3 py-1 text-[11px] ${
                    isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-white/80 hover:bg-white/10"
                  }`}
                  title="View my public profile"
                >
                  View
                </Link>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={`rounded-full border px-3 py-1 text-xs ${
                  isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-white/80 hover:bg-white/10"
                }`}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => goto("/dashboard")}
              className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1.5 text-sm font-medium shadow-lg shadow-nexus-500/30"
            >
              Login / Signup
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-lg p-2 text-sm ${
              isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/80 hover:bg-white/10"
            }`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isLight ? "🌙" : "☀️"}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div
          className={`md:hidden fixed inset-0 z-40 ${isLight ? "bg-white/95" : "bg-nexus-900/95"} pt-16`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg p-2 ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/80 hover:bg-white/10"}`}
                aria-label="Close menu"
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 grid gap-2 text-base">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={linkCls("/")}
              >
                🏠 Home
              </Link>
              <Link
                to="/teachers"
                onClick={() => setMobileOpen(false)}
                className={linkCls("/teachers")}
              >
                👨‍🏫 Teachers
              </Link>
              <Link
                to="/users"
                onClick={() => setMobileOpen(false)}
                className={linkCls("/users")}
              >
                👥 Users
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className={linkCls("/dashboard")}
              >
                📊 Dashboard
              </Link>
              {currentUser ? (
                <>
                  {currentUser.role === "Admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2 border border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
                    >
                      🛠️ Admin
                    </Link>
                  )}
                  <Link
                    to="/me/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2 ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10"}`}
                  >
                    👤 {currentUser.name.split(" ")[0]}
                  </Link>
                  <Link
                    to={`/profile/${currentUser._id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2 ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10"}`}
                  >
                    View public profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className={`block rounded-lg px-3 py-2 text-left ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10"}`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { goto("/dashboard"); setMobileOpen(false); }}
                  className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-2 text-base font-medium shadow-lg shadow-nexus-500/30"
                >
                  Login / Signup
                </button>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className={`mt-1 rounded-lg px-3 py-2 text-left ${isLight ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10"}`}
              >
                {isLight ? "🌙 Dark theme" : "☀️ Light theme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
