import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { formatAmount } from "../utils/currency.js";
import Avatar from "../components/Avatar.jsx";

const HomePage = ({ onRequireAuth }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [topTeachers, setTopTeachers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [teacherOffers, setTeacherOffers] = useState([]);
  const navigate = useNavigate();

  // SVG pattern for background
  const svgPattern = encodeURIComponent(
    `<svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><g fill='none' fill-rule='evenodd'><g fill='#9C92AC' fill-opacity='0.05'><path d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/></g></g></svg>`
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [teachersRes, requestsRes, offersRes] = await Promise.all([
          axios.get("/api/users/public", { params: { role: "Teacher" } }),
          axios.get("/api/sessions/requests"),
          axios.get("/api/sessions/offers")
        ]);
        setTopTeachers((teachersRes.data.users || []).slice(0, 8));
        setRecentRequests((requestsRes.data.requests || []).slice(0, 6));
        setTeacherOffers((offersRes.data.offers || []).slice(0, 6));
      } catch (err) {
        // silent fail, just show empty states
      }
    };
    load();
  }, []);

  const handleStartLearning = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) {
      onRequireAuth && onRequireAuth();
    } else {
      navigate("/requests");
    }
  };

  const handleBecomeTeacher = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) {
      onRequireAuth && onRequireAuth();
    } else {
      navigate("/teachers");
    }
  };

  return (
    <main className="w-full">
      {/* Hero Section - Full Width */}
      <section className={`relative w-full overflow-hidden py-20 ${
        isLight 
          ? "bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-100" 
          : "bg-gradient-to-br from-nexus-900 via-purple-900 to-nexus-900"
      }`}>
        <div
          className={`absolute inset-0 ${isLight ? "opacity-20" : "opacity-30"}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,${svgPattern}")`
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className={`text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl ${
                isLight ? "text-slate-900" : ""
              }`}>
                Don&apos;t just watch videos.
                <br />
                <span className={isLight 
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" 
                  : "bg-gradient-to-r from-nexus-200 via-purple-200 to-pink-300 bg-clip-text text-transparent"
                }>
                  Learn from Humans.
                </span>
              </h1>

              <p className={`max-w-2xl text-lg sm:text-xl ${isLight ? "text-slate-700" : "text-white/80"}`}>
                SkillNexus is a premium peer-to-peer skill marketplace where every learner can become
                a teacher. Book live 1:1 sessions, get unstuck in minutes, and grow faster with real
                humans—not pre-recorded tutorials.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleStartLearning}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-nexus-500 to-purple-500 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-nexus-500/50 transition-all hover:scale-105 hover:shadow-nexus-500/70"
                >
                  <span className="relative z-10">Start learning now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
                <button
                  onClick={handleBecomeTeacher}
                  className={`rounded-xl border-2 px-8 py-4 text-base font-semibold backdrop-blur-sm transition-all ${
                    isLight 
                      ? "border-indigo-300 bg-white/80 text-indigo-700 hover:border-indigo-400 hover:bg-white" 
                      : "border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10"
                  }`}
                >
                  Become a teacher
                </button>
                <span className={`text-sm ${isLight ? "text-slate-600" : "text-white/60"}`}>No credit card. Just curiosity.</span>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="glass-card p-8 text-center">
                <p className={`text-lg ${isLight ? "text-slate-700" : "text-white/80"}`}>
                  Connect with expert teachers and start learning today
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Actions Cards */}
      <section className={`w-full py-14 ${isLight ? "bg-white" : "bg-gradient-to-b from-nexus-900/60 to-nexus-900"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={`mb-6 text-center text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>
            Explore SkillNexus
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <button onClick={() => {
              const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
              if (token) navigate("/requests"); else { onRequireAuth && onRequireAuth("/requests"); }
            }} className="glass-card p-6 rounded-xl border border-white/10 hover:bg-white/5 transition text-left">
              <div className="text-2xl">📋</div>
              <p className="mt-2 text-lg font-semibold">Request Board</p>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-white/60"}`}>Find help or post your need</p>
            </button>
            <button onClick={() => {
              const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
              if (token) navigate("/teach-board"); else { onRequireAuth && onRequireAuth("/teach-board"); }
            }} className="glass-card p-6 rounded-xl border border-white/10 hover:bg-white/5 transition text-left">
              <div className="text-2xl">🧑‍🏫</div>
              <p className="mt-2 text-lg font-semibold">Teach Board</p>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-white/60"}`}>Offer your teaching sessions</p>
            </button>
            <button onClick={() => {
              const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
              if (token) navigate("/messages"); else { onRequireAuth && onRequireAuth("/messages"); }
            }} className="glass-card p-6 rounded-xl border border-white/10 hover:bg-white/5 transition text-left">
              <div className="text-2xl">💬</div>
              <p className="mt-2 text-lg font-semibold">Messages</p>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-white/60"}`}>Chat with the community</p>
            </button>
            <button onClick={() => {
              const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
              if (token) navigate("/wallet"); else { onRequireAuth && onRequireAuth("/wallet"); }
            }} className="glass-card p-6 rounded-xl border border-white/10 hover:bg-white/5 transition text-left">
              <div className="text-2xl">💼</div>
              <p className="mt-2 text-lg font-semibold">Wallet</p>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-white/60"}`}>Payments and payouts</p>
            </button>
          </div>
        </div>
      </section>

      {/* Live Request Board & Top Teachers - Full Screen Section */}
      <section className={`w-full py-16 ${isLight ? "bg-slate-100/80" : "bg-gradient-to-b from-nexus-900/80 to-nexus-900"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔴</span>
                <h2 className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>Live Request Board</h2>
              </div>
              <div className="glass-card max-h-[500px] space-y-4 overflow-auto p-6">
                {recentRequests.length === 0 ? (
                  <p className={`text-center ${isLight ? "text-slate-500" : "text-white/60"}`}>
                    When learners post requests, they will appear here.
                  </p>
                ) : (
                  recentRequests.map((r) => (
                    <div
                      key={r._id}
                      className="glass-card border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 transition hover:border-white/20 hover:scale-[1.02]"
                    >
                      <p className={`text-lg font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>{r.skillName}</p>
                      <p className={`mt-2 line-clamp-3 text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
                        {r.details || "No extra details."}
                      </p>
                      <p className="mt-3 text-sm font-medium text-emerald-300">
                        {r.isFree
                          ? "💰 Free help"
                          : r.budget
                          ? `💰 Budget: ${formatAmount(r.budget, r.learnerId?.country)}`
                          : "💰 Flexible budget"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <h2 className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>Top Teachers · Live</h2>
              </div>
              <div className="glass-card relative overflow-hidden rounded-xl border-2 border-white/20 bg-gradient-to-br from-black/40 to-purple-900/20 p-6 shadow-2xl">
                {topTeachers.length === 0 ? (
                  <p className={`p-4 text-center ${isLight ? "text-slate-500" : "text-white/60"}`}>
                    As teachers join SkillNexus, their public profiles will appear here.
                  </p>
                ) : (
                  <motion.div
                    className="flex"
                    initial={{ x: 0 }}
                    animate={{ x: ["0%", "-50%", "0%"] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    {[...topTeachers, ...topTeachers].map((t, i) => (
                      <Link
                        key={i}
                        to={`/profile/${t.id}`}
                        className="flex w-64 flex-col border-r border-white/10 p-6 transition-all hover:bg-white/10 hover:scale-105 hover:shadow-lg"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <Avatar src={t.profilePic} name={t.name} size="xl" />
                          <div className="flex-1">
                            <p className={`text-lg font-bold ${isLight ? "text-slate-800" : "text-white"}`}>{t.name}</p>
                            {t.isVerified && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/30 px-2 py-0.5 text-xs text-emerald-200 border border-emerald-400/50">
                                <span>✓</span> Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`mb-2 text-sm font-medium ${isLight ? "text-indigo-600" : "text-nexus-200"}`}>
                          {(t.skillsToTeach?.[0] && t.skillsToTeach[0].name) || "Expert Mentor"}
                        </p>
                        <div className="mt-auto flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-lg">⭐</span>
                            <span className="text-base font-bold text-yellow-300">
                              {t.trustScore || 0}
                            </span>
                          </div>
                          <span className={`text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>Trust Score</span>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧑‍🏫</span>
                <h2 className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-white"}`}>Teacher Offers</h2>
              </div>
              <div className="glass-card max-h-[500px] space-y-4 overflow-auto p-6">
                {teacherOffers.length === 0 ? (
                  <p className={`text-center ${isLight ? "text-slate-500" : "text-white/60"}`}>
                    As teachers post offers, they will appear here.
                  </p>
                ) : (
                  teacherOffers.map((o) => (
                    <div key={o._id} className="glass-card border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 hover:border-white/20 transition">
                      <div className="flex items-center gap-3">
                        <Avatar src={o.teacherId?.profilePic} name={o.teacherId?.name} size="sm" />
                        <div>
                          <p className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>{o.skillName}</p>
                          <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-white/70"}`}>{o.teacherId?.name}</p>
                        </div>
                      </div>
                      <p className={`mt-2 text-sm ${isLight ? "text-slate-700" : "text-white/80"}`}>{o.details || "—"}</p>
                      <p className="mt-2 text-[11px] text-emerald-300">
                        {o.isFree ? "Free offer" : `Price: ${formatAmount(o.budget || 0, o.teacherId?.country)}`}
                      </p>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
                            if (token) navigate("/teach-board"); else { onRequireAuth && onRequireAuth("/teach-board"); }
                          }}
                          className="rounded-full border border-white/15 px-3 py-1 text-[11px] hover:bg-white/10"
                        >
                          View on Teach Board
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Full Width */}
      <section className={`w-full py-16 ${isLight ? "bg-white" : "bg-gradient-to-b from-nexus-900/50 to-nexus-900"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className={`mb-12 text-center text-3xl font-bold sm:text-4xl ${isLight ? "text-slate-800" : ""}`}>
            How SkillNexus Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div
              className="glass-card group p-6 transition-all hover:scale-105 hover:border-nexus-400/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-4 text-4xl">🎯</div>
              <h3 className={`mb-2 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>For Learners</h3>
              <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
                Post exactly what you need help with and get matched with humans who have done it
                before—not just watched a course.
              </p>
            </motion.div>

            <motion.div
              className="glass-card group p-6 transition-all hover:scale-105 hover:border-purple-400/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-4 text-4xl">👨‍🏫</div>
              <h3 className={`mb-2 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>For Teachers</h3>
              <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
                Turn your experience into a premium live service. Offer free trials, mentoring, or
                deep project reviews.
              </p>
            </motion.div>

            <motion.div
              className="glass-card group p-6 transition-all hover:scale-105 hover:border-pink-400/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-4 text-4xl">💬</div>
              <h3 className={`mb-2 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Live Chat</h3>
              <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
                Chat with teachers or learners before booking. Discuss goals, pricing, and schedule
                in real-time.
              </p>
            </motion.div>

            <motion.div
              className="glass-card group p-6 transition-all hover:scale-105 hover:border-emerald-400/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <div className="mb-4 text-4xl">📅</div>
              <h3 className={`mb-2 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>One-to-One Sessions</h3>
              <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>
                All sessions happen over links you control (Google Meet, Zoom, etc.), with chat and
                history inside SkillNexus.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Skills Section */}
      {topTeachers.length > 0 && (
        <section className={`w-full py-16 ${isLight ? "bg-slate-50" : "bg-gradient-to-b from-nexus-900 to-purple-900/30"}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className={`mb-8 text-center text-3xl font-bold ${isLight ? "text-slate-800" : ""}`}>Explore Top Teachers</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {topTeachers.slice(0, 4).map((t) => (
                <Link
                  key={t.id}
                  to={`/profile/${t.id}`}
                  className="glass-card group p-6 transition-all hover:scale-105 hover:border-nexus-400/50"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Avatar src={t.profilePic} name={t.name} size="lg" />
                    {t.isVerified && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className={`mb-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>{t.name}</h3>
                  <p className={`mb-2 line-clamp-2 text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>{t.bio || "Expert mentor"}</p>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {(t.skillsToTeach || []).slice(0, 2).map((skill) => (
                      <span
                        key={skill.name}
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${isLight ? "border-slate-200 bg-slate-100 text-slate-700" : "border-white/15 bg-white/5 text-white/80"}`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-emerald-300">
                    ★ {t.trustScore || 0} Trust Score
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                to="/teachers"
                className="inline-block rounded-xl bg-gradient-to-r from-nexus-500 to-purple-500 px-8 py-3 text-base font-semibold shadow-lg shadow-nexus-500/50 transition-all hover:scale-105"
              >
                View All Teachers →
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;
