import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/Avatar.jsx";
import { formatAmount } from "../utils/currency.js";

function TeachersPage({ onRequireAuth }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserCountry, setCurrentUserCountry] = useState(null);
  const [platformConfig, setPlatformConfig] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingFor, setBookingFor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ skillName: "", details: "", budget: "", isFree: false });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (token) {
      axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          setCurrentUserId(res.data.user?._id || null);
          setCurrentUserCountry(res.data.user?.country || null);
        })
        .catch(() => setCurrentUserId(null));
    } else {
      setCurrentUserId(null);
    }
    axios.get("/api/platform/currencies")
      .then((res) => setPlatformConfig({ currencyRates: res.data.currencyRates || [], countryCurrency: res.data.countryCurrency || [] }))
      .catch(() => setPlatformConfig(null));
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const { data } = await axios.get("/api/users/public", {
          params: {
            role: "Teacher",
            q: query || undefined,
            language: language || undefined,
            onlineNow: onlineOnly ? "true" : undefined
          }
        });
        const list = data.users || [];
        const filtered = currentUserId ? list.filter((u) => u.id !== currentUserId) : list;
        setTeachers(filtered);
      } catch (error) {
        console.error("Fetch teachers error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [language, onlineOnly, query, currentUserId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get("book");
    if (bookId && teachers.length > 0) {
      const t = teachers.find((x) => String(x.id) === String(bookId));
      if (t) openBook(t);
    }
  }, [location.search, teachers]);

  const handleChat = (teacherId) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) {
      onRequireAuth && onRequireAuth();
    } else {
      navigate(`/chat/${teacherId}`);
    }
  };
  const openBook = (teacher) => {
    const ok = onRequireAuth ? onRequireAuth() : true;
    if (!ok) return;
    const firstSkill = (teacher.skillsToTeach || [])[0]?.name || "";
    setBookingFor(teacher);
    setBookingForm({ skillName: firstSkill, details: "", budget: "", isFree: true });
  };
  const submitBooking = async (e) => {
    e.preventDefault();
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) { onRequireAuth && onRequireAuth(); return; }
    try {
      await axios.post("/api/sessions/requests", {
        skillName: bookingForm.skillName,
        details: bookingForm.details,
        budget: bookingForm.isFree ? 0 : Number(bookingForm.budget || 0),
        isFree: bookingForm.isFree,
        preferredTeacherId: bookingFor.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      setBookingFor(null);
    } catch (err) {
      console.error("Create booking error", err);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      {!currentUserId && (
        <div className={`rounded-xl border px-4 py-3 ${isLight ? "border-amber-300 bg-amber-50 text-amber-700" : "border-amber-400/50 bg-amber-500/15 text-amber-200"}`}>
          <p className="text-xs font-semibold">Login to view offers and book sessions</p>
          <button type="button" onClick={() => onRequireAuth && onRequireAuth("/teachers")} className="mt-2 rounded-full border border-white/20 px-3 py-1 text-[11px] hover:bg-white/10">
            Login / Signup
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Discover teachers</p>
          <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>People ready to teach you</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            placeholder="Search by name, skill, topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-36 rounded-lg border px-3 py-2 text-sm outline-none sm:w-52 ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
          />
          <input
            type="text"
            placeholder="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={`w-24 rounded-lg border px-2 py-2 text-xs outline-none sm:w-52 ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
          />
          <label className={`flex items-center gap-1 text-[11px] ${isLight ? "text-slate-600" : "text-white/70"}`}>
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => setOnlineOnly(e.target.checked)}
            />
            Online now
          </label>
        </div>
      </div>

      {loading ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Loading teachers...</p>
      ) : teachers.length === 0 ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>No teachers found yet.</p>
      ) : (
        <section className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3 sm:text-sm">
          {teachers.map((t) => (
            <article key={t.id} className="glass-card flex flex-col justify-between p-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar src={t.profilePic} name={t.name} size="lg" />
                    <div>
                    <h3 className="text-sm font-semibold">{t.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className={isLight ? "text-emerald-600" : "text-emerald-300"}>
                        Trust score: {t.trustScore || 0} ★
                      </span>
                      {t.isVerified && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                          Verified
                        </span>
                      )}
                      {t.isOnline && (
                        <span className={`flex items-center gap-1 text-[10px] ${isLight ? "text-emerald-600" : "text-emerald-300"}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          Online
                        </span>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
                <p className={`mt-2 line-clamp-3 text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>{t.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(t.skillsToTeach || []).slice(0, 4).map((skill) => {
                    const viewerCountry = currentUserCountry || t.country || "US";
                    const teacherCountry = t.country || "US";
                    const amount = skill.price || 0;
                    return (
                    <span
                      key={skill.name}
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${isLight ? "border-slate-200 bg-slate-100 text-slate-700" : "border-white/15 text-white/80"}`}
                    >
                      {skill.name} · {skill.level} ·{" "}
                      {amount === 0
                        ? "Free"
                        : (() => {
                            // Show teacher's offered price in their own currency
                            return `${formatAmount(amount || 0, teacherCountry)}/session`;
                          })()}
                    </span>
                    );
                  })}
                </div>
              </div>
              <p className={`mt-2 text-[11px] ${isLight ? "text-slate-500" : "text-white/60"}`}>
                Payouts convert to your currency at today’s rate.
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 text-[11px]">
                <Link
                  to={`/profile/${t.id}`}
                  className={`rounded-full border px-3 py-1 ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-white/80 hover:bg-white/10"}`}
                >
                  View profile
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleChat(t.id)}
                    className="rounded-full border px-3 py-1 text-[11px] hover:bg-white/10"
                  >
                    Chat
                  </button>
                  {t.isVerified && (
                    <button
                      type="button"
                      onClick={() => openBook(t)}
                      className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
                    >
                      Book
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
      {bookingFor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Book {bookingFor.name}</h3>
            <form onSubmit={submitBooking} className="mt-3 space-y-2">
              <div>
                <label className="text-[11px] text-white/70">Skill</label>
                <input
                  type="text"
                  value={bookingForm.skillName}
                  onChange={(e) => setBookingForm((f) => ({ ...f, skillName: e.target.value }))}
                  className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70">What do you want to learn?</label>
                <textarea
                  rows={3}
                  value={bookingForm.details}
                  onChange={(e) => setBookingForm((f) => ({ ...f, details: e.target.value }))}
                  className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-white/70">Budget</label>
                <input
                  type="number"
                  min={0}
                  disabled={bookingForm.isFree}
                  value={bookingForm.budget}
                  onChange={(e) => setBookingForm((f) => ({ ...f, budget: e.target.value }))}
                  className="w-24 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  placeholder="200"
                />
                {!bookingForm.isFree && (
                  <span className="text-[11px] text-white/70">{platformConfig?.countryCurrency?.find((m) => m.countryCode === (currentUserCountry || "").toUpperCase())?.currencyCode || "USD"}</span>
                )}
                <label className="flex items-center gap-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={bookingForm.isFree}
                    onChange={(e) => setBookingForm((f) => ({ ...f, isFree: e.target.checked }))}
                  />
                  Free help
                </label>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setBookingFor(null)} className="rounded border px-3 py-1 text-[11px]">Cancel</button>
                <button type="submit" className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30">Send request</button>
              </div>
            </form>
            <p className="mt-2 text-[10px] text-white/60">Only {bookingFor.name} can accept this booking. Payment will be handled after acceptance.</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default TeachersPage;
