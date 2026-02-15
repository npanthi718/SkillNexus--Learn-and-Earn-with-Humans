import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [mode, setMode] = useState(window.location.hash === "#forgot" ? "forgot" : "login");
  const [form, setForm] = useState({ name: "", email: "", password: "", agreedToTerms: false, accountType: "Learner" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "forgot") {
        if (questions.length === 0) {
          const { data } = await axios.post("/api/auth/forgot/start", { email: form.email });
          setQuestions(data.questions || []);
          setAnswers(new Array((data.questions || []).length).fill(""));
          setLoading(false);
          return;
        } else {
          const { data } = await axios.post("/api/auth/forgot/verify", { email: form.email, answers, newPassword: form.password });
          navigate("/auth");
          setLoading(false);
          return;
        }
      }
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, agreedToTerms: form.agreedToTerms, accountType: form.accountType };

      const { data } = await axios.post(url, payload);
      localStorage.setItem("sn_token", data.token);
      if (mode === "register" && payload.accountType !== "Learner") {
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
    <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-center justify-between text-sm">
          <h2 className="text-lg font-semibold">
            {mode === "login" ? "Welcome back" : mode === "register" ? "Create your SkillNexus account" : "Reset your password"}
          </h2>
          <button
            className="text-xs text-nexus-200 hover:text-white"
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setError("");
            }}
          >
            {mode === "login" ? "New here? Sign up" : "Already have an account?"}
          </button>
        </div>

        <form className="mt-6 space-y-4 text-sm" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-xs text-white/70">Full name</label>
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
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              placeholder="you@example.com"
              required
            />
          </div>

          {mode === "register" && (
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
          )}

          {mode === "register" && (
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

          {mode === "forgot" && questions.length > 0 && (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="space-y-1">
                  <label className="text-xs text-white/70">{q.question}</label>
                  <input
                    type="text"
                    value={answers[i] || ""}
                    onChange={(e) => setAnswers((prev) => { const next = [...prev]; next[i] = e.target.value; return next; })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                  />
                </div>
              ))}
              <p className="text-[11px] theme-muted">Enter a new password above, then submit.</p>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || (mode === "register" && !form.agreedToTerms)}
            className="glass-button mt-2 w-full bg-gradient-to-r from-nexus-500 to-purple-500 py-2 text-sm font-medium shadow-lg shadow-nexus-500/30 disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : mode === "register" ? "Sign up" : (questions.length === 0 ? "Show my questions" : "Verify and reset")}
          </button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => {
                (async () => {
                  try {
                    const clientId =
                      (typeof import.meta !== "undefined" &&
                        import.meta.env &&
                        import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
                      "";
                    if (!window.google || !clientId) {
                      setError("Google sign-in not configured");
                      return;
                    }
                    window.google.accounts.id.initialize({
                      client_id: clientId,
                      callback: async (response) => {
                        if (!response?.credential) {
                          setError("Google sign-in cancelled");
                          return;
                        }
                        try {
                          const { data } = await axios.post("/api/auth/google", { idToken: response.credential });
                          localStorage.setItem("sn_token", data.token);
                          navigate("/dashboard");
                        } catch (e) {
                          setError(e.response?.data?.message || "Google sign-in failed");
                        }
                      }
                    });
                    window.google.accounts.id.prompt();
                  } catch (e) {
                    setError("Google sign-in not available");
                  }
                })();
              }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10"
              onClick={() => { setMode("forgot"); setError(""); setQuestions([]); setAnswers([]); }}
            >
              Forgot password?
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AuthPage;

