import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../contexts/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const Navbar = ({ onRequireAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
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
        <div className={`${mobileOpen ? "flex" : "hidden"} md:flex items-center gap-4 text-sm ml-2 md:ml-6`}>
          <Link
            to="/"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              isLight ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>🏠</span>
            <span>Home</span>
          </Link>
          <Link
            to="/teachers"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              isLight ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👨‍🏫</span>
            <span>Teachers</span>
          </Link>
          <Link
            to="/users"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              isLight ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span>👥</span>
            <span>Users</span>
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              isLight ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
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
              <button
                type="button"
                onClick={toggleTheme}
                className={`rounded-full p-2 border transition-colors ${
                  isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/10"
                }`}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleTheme}
                className={`rounded-full p-2 border ${
                  isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/10"
                }`}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button
                type="button"
                onClick={onRequireAuth}
                className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1.5 text-xs font-medium shadow-lg shadow-nexus-500/30"
              >
                Login / Signup
              </button>
            </>
          )}
        </div>
      </nav>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <aside
            className={`absolute right-0 top-0 h-full w-[85%] max-w-sm p-4 ${
              isLight ? "bg-white border-l border-slate-200" : "bg-nexus-900/95 border-l border-white/10"
            } transition-transform duration-300 ease-out`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>📚</span>
                <span className="text-sm font-semibold">Navigation</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg p-2 ${isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}
                aria-label="Close"
              >
                ✖
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto pb-3">
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/"); setMobileOpen(false); }}>
                🏠 Home
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/teachers"); setMobileOpen(false); }}>
                👨‍🏫 Teachers
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/users"); setMobileOpen(false); }}>
                👥 Users
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/dashboard"); setMobileOpen(false); }}>
                📊 Dashboard
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/requests"); setMobileOpen(false); }}>
                📋 Request Board
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/teach-board"); setMobileOpen(false); }}>
                🧑‍🏫 Teach Board
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/messages"); setMobileOpen(false); }}>
                💬 Messages
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/wallet"); setMobileOpen(false); }}>
                💼 Wallet
              </button>
              {currentUser && (
                <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { goto("/me/profile"); setMobileOpen(false); }}>
                  🙍 View my profile
                </button>
              )}
              {currentUser && (
                <button
                  className="rounded-lg border px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10"
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                >
                  🔓 Logout
                </button>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};

export default Navbar;

