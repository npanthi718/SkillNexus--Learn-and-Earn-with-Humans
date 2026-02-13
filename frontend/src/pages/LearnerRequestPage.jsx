import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { getCurrencyForCountry } from "../utils/currency.js";

const LearnerRequestPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [form, setForm] = useState({ skillName: "", details: "", budget: "", isFree: false });
  const [groupInput, setGroupInput] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
  const [userCountry, setUserCountry] = useState("");

  useEffect(() => {
    if (!token) return;
    axios
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUserCountry(res.data.user?.country || ""))
      .catch(() => setUserCountry(""));
  }, [token]);

  const addMember = () => {
    const raw = groupInput.trim();
    if (!raw) return;
    const isEmail = /\S+@\S+\.\S+/.test(raw);
    if (isEmail) {
      const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
      if (!token) { navigate("/auth"); return; }
      axios
        .get("/api/users/exists-by-email", {
          params: { email: raw },
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          if (res.data?.exists) {
            setGroupMembers((prev) => [...prev, { email: raw }]);
            setGroupInput("");
            setError("");
          } else {
            setError("User not registered. Please ask them to sign up first.");
          }
        })
        .catch(() => {
          setError("Unable to validate email right now");
        });
    } else {
      setGroupMembers((prev) => [...prev, { name: raw }]);
      setGroupInput("");
      setError("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) { navigate("/auth"); return; }
    try {
      const payload = {
        ...form,
        budget: form.isFree ? 0 : Number(form.budget || 0),
        groupMembers
      };
      await axios.post("/api/sessions/requests", payload, { headers: { Authorization: `Bearer ${token}` } });
      navigate("/requests");
    } catch (err) {
      setError("Could not create request");
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Create a learning request</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`rounded-lg border px-3 py-1.5 text-xs ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}
        >
          ← Back
        </button>
      </div>
      <div>
        <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Learner</p>
        <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Create a learning request</h2>
      </div>
      <form onSubmit={submit} className="glass-card p-6 space-y-3 text-xs sm:text-sm">
        <div>
          <label className="theme-muted">What do you need help with?</label>
          <input type="text" value={form.skillName} onChange={(e) => setForm((p) => ({ ...p, skillName: e.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`} required />
        </div>
        <div>
          <label className="theme-muted">Extra details</label>
          <textarea value={form.details} onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))} className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`} rows={4} />
        </div>
        <div className="flex items-center gap-2">
          <label className="theme-muted">Budget</label>
          {!form.isFree && (
            <span className="text-[11px] theme-muted">{getCurrencyForCountry(userCountry).symbol}</span>
          )}
          <input
            type="number"
            value={form.budget}
            onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
            className={`w-24 rounded-lg border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
            placeholder="200"
            min={0}
            disabled={form.isFree}
          />
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={form.isFree} onChange={(e) => setForm((p) => ({ ...p, isFree: e.target.checked }))} />
            I&apos;m asking for free help
          </label>
        </div>
        <div>
          <label className="theme-muted">Add group members (name or email)</label>
          <div className="flex items-center gap-2">
            <input type="text" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} className={`flex-1 rounded-lg border px-3 py-2 outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`} placeholder="e.g., Alice or alice@example.com" />
            <button type="button" onClick={addMember} className="rounded border border-white/15 px-3 py-2 text-xs hover:bg-white/10">Add</button>
          </div>
          {groupMembers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {groupMembers.map((m, i) => (
                <span key={i} className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/80">
                  {m.name || m.email}
                </span>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-2 text-sm font-medium shadow-lg shadow-nexus-500/30">Post to request board</button>
      </form>
    </main>
  );
};

export default LearnerRequestPage;
