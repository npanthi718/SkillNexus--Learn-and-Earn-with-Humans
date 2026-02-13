import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { formatAmount } from "../utils/currency.js";
import Avatar from "../components/shared/Avatar.jsx";

const RequestBoardPage = ({ onRequireAuth }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("");
  const [accepting, setAccepting] = useState(null);
  const [acceptForm, setAcceptForm] = useState({
    meetingLink: "",
    date: "",
    time: ""
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserCountry, setCurrentUserCountry] = useState("");
  const [platformConfig, setPlatformConfig] = useState(null);
  const [participantsModal, setParticipantsModal] = useState({ open: false, members: [] });

  const loadRequests = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
      if (!token) {
        onRequireAuth && onRequireAuth("/requests");
        setLoading(false);
        return;
      }
      const { data } = await axios.get("/api/sessions/requests", {
        params: { skill: skillFilter || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = data.requests || [];
      const filtered = currentUserId
        ? list.filter(
            (r) =>
              (r.learnerId?._id || r.learnerId) !== currentUserId &&
              !((r.groupMembers || []).some((m) => String(m.userId) === String(currentUserId)))
          )
        : list;
      setRequests(filtered);
    } catch (error) {
      console.error("Fetch requests error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (token) {
      axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setCurrentUserId(res.data.user?._id || null);
          setCurrentUserCountry(res.data.user?.country || "");
        })
        .catch(() => {
          setCurrentUserId(null);
          setCurrentUserCountry("");
        });
      axios.get("/api/admin/platform-config", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setPlatformConfig(res.data?.config || null))
        .catch(() => setPlatformConfig(null));
    } else {
      setCurrentUserId(null);
      setCurrentUserCountry("");
    }
  }, []);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillFilter, currentUserId]);

  const openAcceptModal = (request) => {
    const ok = onRequireAuth && onRequireAuth();
    if (!ok) return;
    setError("");
    setAccepting(request);
    setAcceptForm({ meetingLink: "https://meet.google.com/", date: "", time: "" });
  };

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    if (!accepting) return;
    setError("");
    const token = localStorage.getItem("sn_token");
    if (!token) {
      onRequireAuth && onRequireAuth();
      return;
    }
    try {
      const scheduledFor =
        acceptForm.date && acceptForm.time
          ? new Date(`${acceptForm.date}T${acceptForm.time}`).toISOString()
          : null;
      await axios.post(
        `/api/sessions/${accepting._id}/accept`,
        { meetingLink: acceptForm.meetingLink, scheduledFor },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAccepting(null);
      await loadRequests();
    } catch (err) {
      console.error("Accept request error", err);
      const errorMessage = err.response?.data?.message || err.message;
      if (errorMessage.includes("own request") || errorMessage.includes("cannot accept")) {
        setError("Teachers and learners cannot be the same. You cannot accept your own request.");
      } else {
        setError(errorMessage || "Unable to accept request");
      }
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Request Board</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`rounded-lg border px-3 py-1.5 text-xs ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}
        >
          ← Back
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Request board</p>
          <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Learners asking for help</h2>
        </div>
        <input
          type="text"
          placeholder="Filter by skill..."
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
        />
      </div>

      {loading ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
          No open requests yet. Learners will appear here when they ask for help.
        </p>
      ) : (
        <section className="grid gap-4 text-xs sm:text-sm">
          {requests.map((r) => (
            <article key={r._id} className="glass-card flex flex-col justify-between p-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={r.learnerId?.profilePic} name={r.learnerId?.name} size="md" />
                  <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
                  {r.skillName}
                </p>
                <h3 className="mt-1 text-sm font-semibold">
                  {r.learnerId?.name || "Learner"} needs help
                </h3>
                    {(r.groupMembers?.length || 0) > 0 && (
                      <span className="mt-1 inline-block rounded-full border border-purple-400/40 bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-200">
                        Group session · {(1 + (r.groupMembers?.length || 0))} participants
                      </span>
                    )}
                  </div>
                </div>
                <p className={`mt-2 text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>{r.details || "No extra details."}</p>
                <p className="mt-2 text-[11px] text-emerald-300">
                  {r.isFree
                    ? "Learner is asking for free help"
                    : `Budget: ${r.budget ? formatAmount(r.budget, r.learnerId?.country) : "Flexible"}`}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const members = [
                      r.learnerId,
                      ...(r.groupMembers || []).map((gm) => gm.userId || gm)
                    ].filter(Boolean);
                    setParticipantsModal({ open: true, members });
                  }}
                  className="rounded-full border border-white/15 px-3 py-1 text-white/80 hover:bg-white/10"
                >
                  View learners
                </button>
                <button
                  type="button"
                  onClick={() => openAcceptModal(r)}
                  className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
                >
                  Accept & schedule
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      {participantsModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Participants</h3>
            <div className="mt-2 space-y-2">
              {participantsModal.members.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar src={m?.profilePic} name={m?.name || "Member"} size="sm" />
                    <span>{m?.name || "Member"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${m?._id || m}`)}
                    className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                  >
                    View profile
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setParticipantsModal({ open: false, members: [] })}
                className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {accepting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Schedule session for {accepting.skillName}</h3>
            <p className="mt-1 text-[11px] text-white/70">
              Enter your Google Meet / Zoom link and an optional date and time. These details will
              be visible to the learner.
            </p>
            {platformConfig && (
              <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
                {(() => {
                  const currencyRates = platformConfig?.currencyRates || [];
                  const ccMap = {};
                  for (const m of (platformConfig?.countryCurrency || [])) {
                    if (m.countryCode && m.currencyCode) ccMap[String(m.countryCode).toUpperCase()] = String(m.currencyCode).toUpperCase();
                  }
                  const buy = (code) => {
                    const item = currencyRates.find((r) => String(r.code || "").toUpperCase() === String(code || "").toUpperCase());
                    return Number(item?.buyToUSD ?? item?.rateToUSD ?? 1) || 1;
                  };
                  const sell = (code) => {
                    const item = currencyRates.find((r) => String(r.code || "").toUpperCase() === String(code || "").toUpperCase());
                    return Number(item?.sellToUSD ?? item?.rateToUSD ?? 1) || 1;
                  };
                  const learnerCur = String(accepting.budgetCurrency || ccMap[String(accepting.learnerId?.country || "").toUpperCase()] || "USD").toUpperCase();
                  const teacherCur = String(ccMap[String(currentUserCountry || "").toUpperCase()] || "USD").toUpperCase();
                  const totalUSD = (Number(accepting.budget || 0) || 0) * buy(learnerCur);
                  const nprAmount = Math.round(((totalUSD / sell("NPR")) || 0) * 100) / 100;
                  const feeNPR = Math.round(((nprAmount * (platformConfig.platformFeePercent || 0)) / 100) * 100) / 100;
                  const teacherNPR = Math.max(0, Math.round(((nprAmount - feeNPR) || 0) * 100) / 100);
                  const expectedPayout = Math.round(((teacherNPR * (buy("NPR") / sell(teacherCur))) || 0) * 100) / 100;
                  return (
                    <div className="text-[11px]">
                      <p className="font-medium">Preview</p>
                      <p className="mt-1 theme-muted">Learner pays: {Number(accepting.budget || 0).toLocaleString()} {learnerCur}</p>
                      <p className="mt-1 theme-muted">Platform fee: NPR {Number(feeNPR).toLocaleString()}</p>
                      <p className="mt-1 theme-muted">Net in NPR: NPR {Number(teacherNPR).toLocaleString()}</p>
                      <p className="mt-1 font-semibold text-emerald-300">You receive: {teacherCur} {Number(expectedPayout).toLocaleString()}</p>
                    </div>
                  );
                })()}
              </div>
            )}
            <form onSubmit={handleAcceptSubmit} className="mt-3 space-y-2">
              <div>
                <label className="text-[11px] text-white/70">Meeting link</label>
                <input
                  type="text"
                  value={acceptForm.meetingLink}
                  onChange={(e) => setAcceptForm((f) => ({ ...f, meetingLink: e.target.value }))}
                  required
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/90">
                    <span className="text-xl">📅</span>
                    Date (optional)
                  </label>
                  <input
                    type="date"
                    value={acceptForm.date}
                    onChange={(e) => setAcceptForm((f) => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 text-base font-semibold text-white outline-none transition-all hover:border-white/50 hover:bg-white/15 focus:border-nexus-400 focus:bg-white/20 focus:ring-4 focus:ring-nexus-500/30"
                    style={{
                      colorScheme: "dark",
                      cursor: "pointer"
                    }}
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/90">
                    <span className="text-xl">🕐</span>
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={acceptForm.time}
                    onChange={(e) => setAcceptForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-4 py-3 text-base font-semibold text-white outline-none transition-all hover:border-white/50 hover:bg-white/15 focus:border-nexus-400 focus:bg-white/20 focus:ring-4 focus:ring-nexus-500/30"
                    style={{
                      colorScheme: "dark",
                      cursor: "pointer"
                    }}
                  />
                </div>
              </div>
              {error && <p className="text-[11px] text-red-400">{error}</p>}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAccepting(null)}
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-4 py-1.5 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default RequestBoardPage;

