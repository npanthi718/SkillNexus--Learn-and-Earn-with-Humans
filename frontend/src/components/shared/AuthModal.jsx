import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", agreedToTerms: false, accountType: "Learner" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, agreedToTerms: form.agreedToTerms, accountType: form.accountType };

      const { data } = await axios.post(url, payload);
      localStorage.setItem("sn_token", data.token);
      onClose();
      const nextRaw = typeof window !== "undefined" ? localStorage.getItem("sn_redirect") : null;
      const next = typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : "";
      if (nextRaw) { try { localStorage.removeItem("sn_redirect"); } catch {} }
      if (next) {
        navigate(next);
      } else if (mode === "register" && payload.accountType !== "Learner") {
        navigate("/me/profile");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 sm:p-7">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">
              {mode === "login" ? "Welcome back" : "Join SkillNexus"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              {mode === "login" ? "Login to continue" : "Create your account"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-nexus-200 hover:text-white"
              onClick={() => {
                setMode((m) => (m === "login" ? "register" : "login"));
                setError("");
              }}
            >
              {mode === "login" ? "New here? Sign up" : "Already have an account?"}
            </button>
            <button
              className="rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/10"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <form className="mt-5 space-y-4 text-sm" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-xs text:white/70">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                placeholder="e.g. Arjun Khadka"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-white/70">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline:none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              placeholder="you@example.com"
              required
            />
          </div>

          {mode === "register" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-white/70">Account type</label>
                <select
                  name="accountType"
                  value={form.accountType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                >
                  <option value="Learner">Learner</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Both">Both</option>
                </select>
                <p className="text-[11px] theme-muted mt-1">Teachers must submit verification documents before appearing publicly or accepting requests.</p>
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreedToTerms}
                    onChange={(e) => setForm((prev) => ({ ...prev, agreedToTerms: e.target.checked }))}
                    className="mt-1"
                  />
                  <span>I agree to the <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-nexus-200 hover:underline">Privacy Policy</a> and <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-nexus-200 hover:underline">Terms of Service</a></span>
                </label>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-white/70">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              placeholder="At least 6 characters"
              required
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {mode === "login" && (
            <button
              type="button"
              className="mt-1 text-[11px] text-nexus-200 hover:text-white underline"
              onClick={() => {
                onClose();
                navigate("/auth#forgot");
              }}
            >
              Forgot password?
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (mode === "register" && !form.agreedToTerms)}
            className="glass-button mt-2 w-full bg-gradient-to-r from-nexus-500 to-purple-500 py-2 text-sm font-medium shadow-lg shadow-nexus-500/30 disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
