import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import AdminNavbar from "../components/AdminNavbar.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import ImageUriInput from "../components/ImageUriInput.jsx";
import LegalEditor from "../components/LegalEditor.jsx";
import Avatar from "../components/Avatar.jsx";
import { getCurrencyForCountry, convertAmount, formatAmount } from "../utils/currency.js";
import EarningsSummary from "../components/EarningsSummary.jsx";
import PayoutForm from "../components/PayoutForm.jsx";

const AdminReviewCard = ({ review, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || "");
  useEffect(() => {
    setRating(review.rating);
    setComment(review.comment || "");
  }, [review.rating, review.comment]);
  const handleSave = () => {
    onUpdate({ rating, comment });
    setEditing(false);
  };
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      {!editing ? (
        <>
          <p className="text-[11px] font-medium">
            {review.reviewerId?.name || "Anonymous"} reviewed {review.revieweeId?.name || "Unknown"} · {review.rating} ★
          </p>
          <p className="mt-1 text-[11px] text-white/70">{review.comment || "No comment."}</p>
          <p className="mt-1 text-[10px] text-white/50">
            Session: {review.sessionId?.skillName || "Unknown"} · {new Date(review.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded border border-nexus-400/50 bg-nexus-500/20 px-2 py-0.5 text-[10px] text-nexus-200 hover:bg-nexus-500/30"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/30"
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-2">
            <label className="text-[10px] text-white/60">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="ml-2 rounded bg-black/40 px-2 py-0.5 text-[11px] outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} ★</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-[10px] text-white/60">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-[11px] outline-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setRating(review.rating); setComment(review.comment || ""); }}
              className="rounded border border-white/30 px-2 py-0.5 text-[10px] text-white/70"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const AdminPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [userHistory, setUserHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMessageKey, setExpandedMessageKey] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [platformConfig, setPlatformConfig] = useState(null);
  const [expandedPayoutId, setExpandedPayoutId] = useState(null);
  const [newBankDetail, setNewBankDetail] = useState(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [revertModal, setRevertModal] = useState({ open: false, tx: null, deductionAmount: 0 });
  const [resolveReassignModal, setResolveReassignModal] = useState({ open: false, complaint: null, meetingLink: "" });
  const [earningsData, setEarningsData] = useState({ transactions: [], totals: {} });
  const [expenditures, setExpenditures] = useState([]);
  const [legalDocs, setLegalDocs] = useState([]);
  const [earningsFrom, setEarningsFrom] = useState("");
  const [earningsTo, setEarningsTo] = useState("");
  const [reportingCurrency, setReportingCurrency] = useState("NPR");
  const [currencyRates, setCurrencyRates] = useState([]);
  const [expCategoryFilter, setExpCategoryFilter] = useState("");
  const [expTagFilter, setExpTagFilter] = useState("");
  const [sessionEditModal, setSessionEditModal] = useState({ open: false, session: null });
  const [sessionDeleteModal, setSessionDeleteModal] = useState({ open: false, sessionId: null });
  const [offersOnly, setOffersOnly] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/admin/users")) return "users";
    if (path.includes("/admin/sessions")) return "sessions";
    if (path.includes("/admin/messages")) return "messages";
    if (path.includes("/admin/reviews")) return "reviews";
    if (path.includes("/admin/payments")) return "payments";
    if (path.includes("/admin/earnings")) return "earnings";
    if (path.includes("/admin/settings")) return "settings";
    return "dashboard";
  };
  const activeTab = getActiveTab();

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const loadAdmin = async () => {
      if (!token) {
        navigate("/auth");
        return;
      }
      try {
        const loadPromises = [axios.get("/api/admin/stats", { headers: authHeaders })];
        
        if (activeTab === "users" || activeTab === "dashboard") {
          loadPromises.push(axios.get("/api/admin/users", { headers: authHeaders }));
        }
        if (activeTab === "sessions" || activeTab === "dashboard") {
          loadPromises.push(axios.get("/api/admin/sessions", { headers: authHeaders }));
          loadPromises.push(axios.get("/api/admin/platform-config", { headers: authHeaders }).catch(() => ({ data: { config: null } })));
        }
        if (activeTab === "messages") {
          loadPromises.push(axios.get("/api/admin/messages", { headers: authHeaders }).catch(() => ({ data: { messages: [] } })));
        }
        if (activeTab === "reviews") {
          loadPromises.push(axios.get("/api/admin/reviews", { headers: authHeaders }).catch(() => ({ data: { reviews: [] } })));
        }
        if (activeTab === "payments") {
          loadPromises.push(axios.get("/api/admin/transactions", { headers: authHeaders }).catch(() => ({ data: { transactions: [] } })));
          loadPromises.push(axios.get("/api/admin/platform-config", { headers: authHeaders }).catch(() => ({ data: { config: null } })));
          loadPromises.push(axios.get("/api/admin/complaints", { headers: authHeaders }).catch(() => ({ data: { complaints: [] } })));
        }
        if (activeTab === "earnings") {
          loadPromises.push(axios.get("/api/admin/earnings", { headers: authHeaders, params: { from: earningsFrom || undefined, to: earningsTo || undefined } }).catch(() => ({ data: { transactions: [], totals: {} } })));
          loadPromises.push(axios.get("/api/admin/expenditures", { headers: authHeaders }).catch(() => ({ data: { expenditures: [] } })));
        }
        if (activeTab === "settings") {
          loadPromises.push(axios.get("/api/admin/platform-config", { headers: authHeaders }).catch(() => ({ data: { config: null } })));
          loadPromises.push(axios.get("/api/admin/legal", { headers: authHeaders }).catch(() => ({ data: { legal: [] } })));
        }
        
        const results = await Promise.all(loadPromises);
        setStats(results[0].data);
        
        let idx = 1;
        if (activeTab === "users" || activeTab === "dashboard") {
          setUsers(results[idx].data.users || []);
          idx++;
        }
        if (activeTab === "sessions" || activeTab === "dashboard") {
          setSessions(results[idx].data.sessions || []);
          idx++;
          const cfgRes = results.find((r) => r.data && r.data.config !== undefined);
          if (cfgRes) setPlatformConfig(cfgRes.data.config || null);
        }
        if (activeTab === "messages") {
          setMessages(results[idx].data.messages || []);
        }
        if (activeTab === "reviews") {
          setReviews(results[results.length - 1].data.reviews || []);
        }
        if (activeTab === "payments") {
          const txRes = results.find((r) => r.data && r.data.transactions !== undefined);
          const configRes = results.find((r) => r.data && r.data.config !== undefined);
          const complaintsRes = results.find((r) => r.data && r.data.complaints !== undefined);
          setTransactions(txRes?.data?.transactions || []);
          setPlatformConfig(configRes?.data?.config || null);
          setComplaints(complaintsRes?.data?.complaints || []);
        }
        if (activeTab === "earnings") {
          const earnRes = results.find((r) => r.data && r.data.totals !== undefined);
          const expRes = results.find((r) => r.data && Array.isArray(r.data.expenditures));
          setEarningsData(earnRes?.data || { transactions: [], totals: {} });
          setExpenditures(expRes?.data?.expenditures || []);
          const cfgRes = results.find((r) => r.data && r.data.config !== undefined);
          setCurrencyRates(cfgRes?.data?.config?.currencyRates || []);
          setPlatformConfig(cfgRes?.data?.config || null);
        }
        if (activeTab === "settings") {
          const configRes = results.find((r) => r.data && r.data.config !== undefined);
          const legalRes = results.find((r) => r.data && Array.isArray(r.data.legal));
          setPlatformConfig(configRes?.data?.config || null);
          setLegalDocs(legalRes?.data?.legal || []);
        }
      } catch (error) {
        console.error("Admin load error", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  // Deep link: focus user from notifications
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const focus = params.get("focus");
    if (focus) {
      navigate("/admin/users", { replace: true });
      setTimeout(() => {
        loadUserHistory(focus);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadUserHistory = async (userId) => {
    try {
      const [historyRes, userRes] = await Promise.all([
        axios.get(`/api/admin/users/${userId}/history`, { headers: authHeaders }),
        axios.get(`/api/admin/users/${userId}`, { headers: authHeaders })
      ]);
      setUserHistory(historyRes.data);
      setSelectedUserData(userRes.data.user);
      setSelectedUser(userId);
    } catch (error) {
      console.error("Load user history error", error);
    }
  };
  
  const handleUpdateUser = async (userId, updates) => {
    try {
      const { data } = await axios.put(
        `/api/admin/users/${userId}`,
        updates,
        { headers: authHeaders }
      );
      setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
      if (selectedUser === userId) {
        setSelectedUserData(data.user);
      }
    } catch (error) {
      console.error("Update user error", error);
    }
  };
  
  const handleDeleteSession = async (sessionId) => {
    setSessionDeleteModal({ open: true, sessionId });
  };
  
  const handleUpdateSession = async (sessionId, updates) => {
    try {
      const { data } = await axios.put(
        `/api/admin/sessions/${sessionId}`,
        updates,
        { headers: authHeaders }
      );
      setSessions((prev) => prev.map((s) => (s._id === sessionId ? data.session : s)));
      if (userHistory) {
        setUserHistory((prev) => ({
          ...prev,
          asLearner: prev.asLearner.map((s) => (s._id === sessionId ? data.session : s)),
          asTeacher: prev.asTeacher.map((s) => (s._id === sessionId ? data.session : s))
        }));
      }
    } catch (error) {
      console.error("Update session error", error);
    }
  };

  const handleAwardBadge = async (userId, badge) => {
    try {
      await axios.post(
        `/api/admin/users/${userId}/badge`,
        { badge },
        { headers: authHeaders }
      );
      const { data } = await axios.get("/api/admin/users", { headers: authHeaders });
      setUsers(data.users || []);
      if (selectedUser === userId) {
        const userRes = await axios.get(`/api/admin/users/${userId}`, { headers: authHeaders });
        setSelectedUserData(userRes.data.user);
      }
    } catch (error) {
      console.error("Award badge error", error);
    }
  };

  const handleRemoveBadge = async (userId, badge) => {
    try {
      await axios.delete(`/api/admin/users/${userId}/badge`, {
        headers: authHeaders,
        data: { badge }
      });
      const { data } = await axios.get("/api/admin/users", { headers: authHeaders });
      setUsers(data.users || []);
      if (selectedUser === userId) {
        const userRes = await axios.get(`/api/admin/users/${userId}`, { headers: authHeaders });
        setSelectedUserData(userRes.data.user);
      }
    } catch (error) {
      console.error("Remove badge error", error);
    }
  };

  const handleToggleVerify = async (id, role, isVerified) => {
    try {
      const url = isVerified ? `/api/admin/users/${id}/unverify` : `/api/admin/users/${id}/verify`;
      const { data } = await axios.post(url, { role }, { headers: authHeaders });
      setUsers((prev) => prev.map((u) => (u._id === id ? data.user : u)));
      if (selectedUser === id && selectedUserData) {
        setSelectedUserData(data.user);
      }
    } catch (error) {
      console.error("Verify toggle error", error);
    }
  };

  const handleChangeRole = async (id, role) => {
    try {
      const { data } = await axios.put(
        `/api/admin/users/${id}`,
        { role },
        { headers: authHeaders }
      );
      setUsers((prev) => prev.map((u) => (u._id === id ? data.user : u)));
    } catch (error) {
      console.error("Change role error", error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: authHeaders });
      setUsers((prev) => prev.filter((u) => u._id !== id));
      if (selectedUser === id) {
        setSelectedUser(null);
        setSelectedUserData(null);
        setUserHistory(null);
      }
    } catch (error) {
      console.error("Delete user error", error);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-white/70">Loading admin panel...</p>
        </main>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <AdminNavbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-white/70">Admin access required.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 text-xs sm:text-sm">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
            aria-label="Go back"
          >
            ← Back
          </button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <button
                type="button"
                onClick={() => navigate("/admin/users")}
                className="glass-card p-4 border-2 border-amber-500/30 text-left hover:border-amber-400/50 hover:bg-white/5 transition-all rounded-xl"
              >
                <span className="text-2xl">👥</span>
                <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200 mt-1">Users</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-[10px] text-white/50 mt-1">View all →</p>
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/sessions")}
                className="glass-card p-4 text-left hover:bg-white/5 transition-all rounded-xl border border-nexus-500/30"
              >
                <span className="text-2xl">📅</span>
                <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mt-1">Sessions</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalSessions}</p>
                <p className="text-[10px] text-white/50 mt-1">View all →</p>
              </button>
              <div className="glass-card p-4 rounded-xl border border-yellow-500/30">
                <span className="text-2xl">⏳</span>
                <p className="text-[11px] uppercase tracking-[0.18em] text-yellow-200 mt-1">Pending</p>
                <p className="mt-2 text-2xl font-bold">{stats.pendingSessions}</p>
              </div>
              <div className="glass-card p-4 rounded-xl border border-emerald-500/30">
                <span className="text-2xl">✅</span>
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-200 mt-1">Completed</p>
                <p className="mt-2 text-2xl font-bold">{stats.completedSessions}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin/reviews")}
                className="glass-card p-4 text-left hover:bg-white/5 transition-all rounded-xl border border-purple-500/30"
              >
                <span className="text-2xl">⭐</span>
                <p className="text-[11px] uppercase tracking-[0.18em] text-purple-200 mt-1">Reviews</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalReviews}</p>
                <p className="text-[10px] text-white/50 mt-1">View all →</p>
              </button>
            </section>

            {stats.topSkills?.length > 0 && (
              <section className="glass-card p-6 rounded-xl border border-white/10">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span>📊</span> Top skills by demand
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                  {stats.topSkills.map((s) => (
                    <li
                      key={s.name}
                      className="rounded-full border border-nexus-400/30 bg-nexus-500/10 px-4 py-2 text-white/90 font-medium"
                    >
                      {s.name} · {s.count} session{s.count !== 1 ? "s" : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="glass-card p-6 rounded-xl border border-white/10">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <span>🔗</span> Quick links
              </h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate("/admin/users")} className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs text-amber-200 hover:bg-amber-500/30">Users</button>
                <button type="button" onClick={() => navigate("/admin/sessions")} className="rounded-lg border border-nexus-500/40 bg-nexus-500/20 px-4 py-2 text-xs text-nexus-200 hover:bg-nexus-500/30">Sessions</button>
                <button type="button" onClick={() => navigate("/admin/messages")} className="rounded-lg border border-blue-500/40 bg-blue-500/20 px-4 py-2 text-xs text-blue-200 hover:bg-blue-500/30">Messages</button>
                <button type="button" onClick={() => navigate("/admin/reviews")} className="rounded-lg border border-purple-500/40 bg-purple-500/20 px-4 py-2 text-xs text-purple-200 hover:bg-purple-500/30">Reviews</button>
                <button type="button" onClick={() => navigate("/admin/payments")} className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs text-emerald-200 hover:bg-emerald-500/30">Payments</button>
                <button type="button" onClick={() => navigate("/admin/earnings")} className="rounded-lg border border-slate-400/40 bg-slate-500/20 px-4 py-2 text-xs text-slate-200 hover:bg-slate-500/30">Statement</button>
                <button type="button" onClick={() => navigate("/admin/settings")} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/20">Settings</button>
                <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/20">View site →</a>
              </div>
            </section>
          </>
        )}

        {activeTab === "users" && (
          <section className="glass-card p-4">
            <h2 className="mb-4 text-sm font-semibold">All Users Management</h2>
            {selectedUser && selectedUserData && userHistory ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-amber-200">
                    {selectedUserData.name} - Full Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedUserData(null);
                      setUserHistory(null);
                    }}
                    className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    ← Back to List
                  </button>
                </div>
                
                {/* User Basic Info */}
                <div className="glass-card p-4 border-2 border-amber-500/30">
                  <h4 className="mb-3 text-sm font-semibold text-amber-200">Basic Information</h4>
                  <div className="mb-4 flex items-center gap-4">
                    <Avatar src={selectedUserData.profilePic} name={selectedUserData.name} size="2xl" />
                    <div>
                      <p className="text-[11px] theme-muted">Profile picture</p>
                      <p className="text-xs theme-primary mt-0.5">{selectedUserData.profilePic ? "Uploaded" : "No photo uploaded"}</p>
                    </div>
                  </div>
                  {((selectedUserData.verificationPhotos || []).length > 0 || (selectedUserData.teacherCertificates || []).length > 0) && (
                    <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <p className="text-[11px] font-medium theme-accent mb-2">Verification documents (ID proof & certificates)</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(selectedUserData.verificationPhotos || []).length > 0 && (
                          <div>
                            <p className="text-[10px] theme-muted mb-1">Learner ID / photos</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedUserData.verificationPhotos.map((doc, i) => {
                                const url = typeof doc === "string" ? doc : doc?.url;
                                return url ? (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={url} alt="" className="h-20 w-20 rounded object-cover border border-white/20 hover:ring-2 ring-nexus-400" />
                                  </a>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                        {(selectedUserData.teacherCertificates || []).length > 0 && (
                          <div>
                            <p className="text-[10px] theme-muted mb-1">Teacher certificates</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedUserData.teacherCertificates.map((doc, i) => {
                                const url = typeof doc === "string" ? doc : doc?.url;
                                return url ? (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={url} alt="" className="h-20 w-20 rounded object-cover border border-white/20 hover:ring-2 ring-nexus-400" />
                                  </a>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 md:grid-cols-2 text-xs">
                    <div>
                      <p className="text-white/60">Name</p>
                      <input
                        type="text"
                        value={selectedUserData.name}
                        onChange={(e) => setSelectedUserData({...selectedUserData, name: e.target.value})}
                        onBlur={() => handleUpdateUser(selectedUser, {name: selectedUserData.name})}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-white/60">Email</p>
                      <input
                        type="email"
                        value={selectedUserData.email}
                        onChange={(e) => setSelectedUserData({...selectedUserData, email: e.target.value})}
                        onBlur={() => handleUpdateUser(selectedUser, {email: selectedUserData.email})}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-white/60">Role</p>
                      <select
                        value={selectedUserData.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setSelectedUserData({...selectedUserData, role: newRole});
                          handleChangeRole(selectedUser, newRole);
                        }}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-white/60">Bio</p>
                      <textarea
                        value={selectedUserData.bio || ""}
                        onChange={(e) => setSelectedUserData({...selectedUserData, bio: e.target.value})}
                        onBlur={() => handleUpdateUser(selectedUser, {bio: selectedUserData.bio})}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                        rows="3"
                      />
                    </div>
                    <div>
                      <p className="text-white/60">Password (leave empty to keep current)</p>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleUpdateUser(selectedUser, {password: e.target.value});
                          }
                        }}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 text-xs">
                    <div>
                      <p className="text-white/60">Social links</p>
                      <input
                        type="text"
                        placeholder="LinkedIn URL"
                        defaultValue={selectedUserData.socialLinks?.linkedin || ""}
                        onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), linkedin: e.target.value } })}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="GitHub URL"
                        defaultValue={selectedUserData.socialLinks?.github || ""}
                        onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), github: e.target.value } })}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Website URL"
                        defaultValue={selectedUserData.socialLinks?.website || ""}
                        onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), website: e.target.value } })}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Twitter URL"
                        defaultValue={selectedUserData.socialLinks?.twitter || ""}
                        onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), twitter: e.target.value } })}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-white/60">Profile arrays</p>
                      <textarea
                        placeholder="Teaching languages (comma/newline)"
                        defaultValue={(selectedUserData.teachingLanguages || []).join(", ")}
                        onBlur={(e) => {
                          const list = (e.target.value || "").split(/[\n,;|]+/).map((v) => v.trim()).filter(Boolean);
                          handleUpdateUser(selectedUser, { teachingLanguages: list });
                        }}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                        rows={2}
                      />
                      <textarea
                        placeholder="Wishlist skills (comma/newline)"
                        defaultValue={(selectedUserData.wishlistSkills || []).join(", ")}
                        onBlur={(e) => {
                          const list = (e.target.value || "").split(/[\n,;|]+/).map((v) => v.trim()).filter(Boolean);
                          handleUpdateUser(selectedUser, { wishlistSkills: list });
                        }}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                        rows={2}
                      />
                      <textarea
                        placeholder="Mastered subjects (comma/newline)"
                        defaultValue={(selectedUserData.masteredSubjects || []).join(", ")}
                        onBlur={(e) => {
                          const list = (e.target.value || "").split(/[\n,;|]+/).map((v) => v.trim()).filter(Boolean);
                          handleUpdateUser(selectedUser, { masteredSubjects: list });
                        }}
                        className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]">Teacher</span>
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedUserData?.isTeacherVerified)}
                            onChange={() => handleToggleVerify(selectedUser, "Teacher", Boolean(selectedUserData?.isTeacherVerified))}
                          />
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedUserData?.isTeacherVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                            {selectedUserData?.isTeacherVerified ? "Verified" : "Unverified"}
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px]">Learner</span>
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedUserData?.isLearnerVerified)}
                            onChange={() => handleToggleVerify(selectedUser, "Learner", Boolean(selectedUserData?.isLearnerVerified))}
                          />
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedUserData?.isLearnerVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                            {selectedUserData?.isLearnerVerified ? "Verified" : "Unverified"}
                          </span>
                        </label>
                      </div>
                    </div>
                    {(selectedUserData.badges || []).includes("bestTeacher") ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(selectedUser, "bestTeacher")}
                        className="rounded-lg border border-purple-400/50 bg-purple-500/30 px-3 py-1 text-xs text-purple-200 hover:bg-purple-500/40"
                      >
                        Remove Best Teacher
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAwardBadge(selectedUser, "bestTeacher")}
                        className="rounded-lg border border-purple-400/50 bg-purple-500/20 px-3 py-1 text-xs text-purple-200 hover:bg-purple-500/30"
                      >
                        Award Best Teacher
                      </button>
                    )}
                    {(selectedUserData.badges || []).includes("bestLearner") ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(selectedUser, "bestLearner")}
                        className="rounded-lg border border-blue-400/50 bg-blue-500/30 px-3 py-1 text-xs text-blue-200 hover:bg-blue-500/40"
                      >
                        Remove Best Learner
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAwardBadge(selectedUser, "bestLearner")}
                        className="rounded-lg border border-blue-400/50 bg-blue-500/20 px-3 py-1 text-xs text-blue-200 hover:bg-blue-500/30"
                      >
                        Award Best Learner
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(selectedUser)}
                      className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30"
                    >
                      Delete User
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-3">
                    <div className="md:col-span-1">
                      <label className="text-[11px] theme-muted">Verification role</label>
                      <select
                        defaultValue="Teacher"
                        onChange={(e) => setSelectedUserData((p) => ({ ...(p || {}), __feedbackRole: e.target.value }))}
                        className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Learner">Learner</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[11px] theme-muted">Feedback / rejection reason</label>
                      <textarea
                        rows={3}
                        placeholder="Tell the user what to fix"
                        onBlur={(e) => setSelectedUserData((p) => ({ ...(p || {}), __feedbackMsg: e.target.value }))}
                        className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await axios.post(`/api/admin/users/${selectedUser}/verification-feedback`, { role: selectedUserData.__feedbackRole || "Teacher", message: selectedUserData.__feedbackMsg || "" }, { headers: authHeaders });
                            alert("Feedback sent");
                          } catch (err) {
                            alert("Could not send feedback");
                          }
                        }}
                        className="rounded border border-white/30 bg-white/10 px-3 py-1 text-[11px]"
                      >
                        Send feedback
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await axios.post(`/api/admin/users/${selectedUser}/verification-feedback`, { role: selectedUserData.__feedbackRole || "Teacher", message: selectedUserData.__feedbackMsg || "", reject: true }, { headers: authHeaders });
                            alert("Rejected with feedback");
                            const userRes = await axios.get(`/api/admin/users/${selectedUser}`, { headers: authHeaders });
                            setSelectedUserData(userRes.data.user);
                          } catch (err) {
                            alert("Could not reject");
                          }
                        }}
                        className="rounded border border-red-400/50 bg-red-500/20 px-3 py-1 text-[11px] text-red-300"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Learner History */}
                <div className="glass-card p-4">
                  <h4 className="mb-3 text-sm font-semibold">
                    As Learner ({userHistory.asLearner?.length || 0})
                  </h4>
                  <div className="max-h-64 space-y-2 overflow-auto text-xs">
                    {userHistory.asLearner?.length === 0 ? (
                      <p className="text-white/60">No learner sessions</p>
                    ) : (
                      userHistory.asLearner.map((s) => {
                        const teachersForSkill = (users || []).filter((u) =>
                          (u.skillsToTeach || []).some((st) =>
                            String(st.name || "").toLowerCase() === String(s.skillName || "").toLowerCase()
                          )
                        );
                        return (
                          <div key={s._id} className="rounded border border-white/10 bg-black/20 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{s.skillName}</p>
                                <p className="mt-1 text-white/60">
                                  Teacher: {s.teacherId?.name || "Unassigned"} · Status: {s.status}
                                </p>
                                {s.details && <p className="mt-1 text-white/50 text-[10px]">{s.details}</p>}
                                <p className="mt-1 text-white/50 text-[10px]">
                                  Created: {new Date(s.createdAt).toLocaleString()}
                                </p>
                                {s.status === "Pending" && teachersForSkill.length > 0 && (
                                  <div className="mt-2">
                                    <label className="text-[10px] text-white/50">Assign teacher & accept:</label>
                                    <select
                                      className="mt-0.5 block w-full max-w-[180px] rounded-md bg-black/40 px-2 py-1 text-[10px] outline-none"
                                      value={s.teacherId?._id || s.teacherId || ""}
                                      onChange={(e) => {
                                        const tid = e.target.value;
                                        if (tid) handleUpdateSession(s._id, { teacherId: tid, status: "Accepted" });
                                      }}
                                    >
                                      <option value="">Select teacher...</option>
                                      {teachersForSkill.map((t) => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <select
                                  value={s.status}
                                  onChange={(e) => handleUpdateSession(s._id, { status: e.target.value })}
                                  className="rounded-md bg-black/40 px-2 py-1 text-[10px] outline-none"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Accepted">Accepted</option>
                                  <option value="Completed">Completed</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(s._id)}
                                  className="rounded-md border border-red-400/50 bg-red-500/20 px-2 py-1 text-[10px] text-red-300"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                
                {/* Teaching History */}
                <div className="glass-card p-4">
                  <h4 className="mb-3 text-sm font-semibold">
                    As Teacher ({userHistory.asTeacher?.length || 0})
                  </h4>
                  <div className="max-h-64 space-y-2 overflow-auto text-xs">
                    {userHistory.asTeacher?.length === 0 ? (
                      <p className="text-white/60">No teaching sessions</p>
                    ) : (
                      userHistory.asTeacher.map((s) => (
                        <div key={s._id} className="rounded border border-white/10 bg-black/20 p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{s.skillName}</p>
                              <p className="mt-1 text-white/60">
                                Learner: {s.learnerId?.name || "Unknown"} · Status: {s.status}
                              </p>
                              {s.meetingLink && (
                                <a
                                  href={s.meetingLink.startsWith("http") ? s.meetingLink : `https://${s.meetingLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 text-blue-300 hover:underline text-[10px]"
                                >
                                  Meeting Link
                                </a>
                              )}
                              {s.scheduledFor && (
                                <p className="mt-1 text-white/50 text-[10px]">
                                  Scheduled: {new Date(s.scheduledFor).toLocaleString()}
                                </p>
                              )}
                              <p className="mt-1 text-white/50 text-[10px]">
                                Created: {new Date(s.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <select
                                value={s.status}
                                onChange={(e) => handleUpdateSession(s._id, {status: e.target.value})}
                                className="rounded-md bg-black/40 px-2 py-1 text-[10px] outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteSession(s._id)}
                                className="rounded-md border border-red-400/50 bg-red-500/20 px-2 py-1 text-[10px] text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Chat History - Grouped by conversation */}
                <div className="glass-card p-4">
                  <h4 className="mb-3 text-sm font-semibold">
                    Chat History ({userHistory.chats?.length || 0})
                  </h4>
                  {(() => {
                    if (!userHistory.chats || userHistory.chats.length === 0) {
                      return <p className="text-white/60">No chat messages</p>;
                    }
                    
                    // Group messages by conversation partner
                    const conversations = new Map();
                    userHistory.chats.forEach((m) => {
                      const senderId = m.senderId?._id || m.senderId || "";
                      const receiverId = m.receiverId?._id || m.receiverId || "";
                      const senderName = m.senderId?.name || "Unknown";
                      const receiverName = m.receiverId?.name || "Unknown";
                      
                      // Determine conversation partner
                      const partnerId = senderId === selectedUser ? receiverId : senderId;
                      const partnerName = senderId === selectedUser ? receiverName : senderName;
                      
                      if (!conversations.has(partnerId)) {
                        conversations.set(partnerId, {
                          partnerName,
                          messages: []
                        });
                      }
                      conversations.get(partnerId).messages.push(m);
                    });
                    
                    return (
                      <div className="space-y-4 max-h-96 overflow-auto">
                        {Array.from(conversations.entries()).map(([partnerId, conv]) => (
                          <div key={partnerId} className="rounded-lg border border-white/10 bg-black/20 p-3">
                            <p className="mb-2 text-xs font-semibold text-amber-200 border-b border-white/10 pb-2">
                              Conversation with {conv.partnerName}
                            </p>
                            <div className="space-y-2">
                              {conv.messages
                                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                                .map((m) => {
                                  const isSender = (m.senderId?._id || m.senderId) === selectedUser;
                                  return (
                                    <div
                                      key={m._id}
                                      className={`rounded-lg p-2 ${
                                        isSender
                                          ? "ml-4 bg-gradient-to-r from-nexus-500/30 to-purple-500/30"
                                          : "mr-4 bg-white/5"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-[11px] font-medium text-white/90">
                                          {m.senderId?.name || "Unknown"}
                                        </p>
                                        <p className="text-[10px] text-white/50">
                                          {new Date(m.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <p className="text-[11px] text-white/80">{m.content}</p>
                                      {m.isEdited && (
                                        <p className="mt-1 text-[9px] text-white/50 italic">(edited)</p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-auto text-xs">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-nexus-900/95 text-[11px] text-white/60">
                    <tr>
                      <th className="border-b border-white/10 px-3 py-2">Name</th>
                      <th className="border-b border-white/10 px-3 py-2">Email</th>
                      <th className="border-b border-white/10 px-3 py-2">Role</th>
                      <th className="border-b border-white/10 px-3 py-2">Verified</th>
                      <th className="border-b border-white/10 px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-white/5">
                        <td className="border-b border-white/5 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar src={u.profilePic} name={u.name} size="sm" />
                            <button
                              type="button"
                              onClick={() => loadUserHistory(u._id)}
                              className="font-medium text-nexus-200 hover:underline"
                            >
                              {u.name}
                            </button>
                          </div>
                        </td>
                        <td className="border-b border-white/5 px-3 py-2">{u.email}</td>
                        <td className="border-b border-white/5 px-3 py-2">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u._id, e.target.value)}
                            className="rounded-md bg-black/40 px-2 py-1 text-[11px] outline-none"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="border-b border-white/5 px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px]">Teacher</span>
                              <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.isTeacherVerified)}
                                  onChange={() => handleToggleVerify(u._id, "Teacher", Boolean(u.isTeacherVerified))}
                                />
                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${u.isTeacherVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                                  {u.isTeacherVerified ? "Verified" : "Unverified"}
                                </span>
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px]">Learner</span>
                              <label className="inline-flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(u.isLearnerVerified)}
                                  onChange={() => handleToggleVerify(u._id, "Learner", Boolean(u.isLearnerVerified))}
                                />
                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${u.isLearnerVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                                  {u.isLearnerVerified ? "Verified" : "Unverified"}
                                </span>
                              </label>
                            </div>
                          </div>
                        </td>
                        <td className="border-b border-white/5 px-3 py-2">
                          <button
                            type="button"
                            onClick={() => loadUserHistory(u._id)}
                            className="rounded-full border border-blue-400/50 bg-blue-500/20 px-2 py-0.5 text-[11px] text-blue-200 hover:bg-blue-500/30"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "sessions" && (
          <section className="glass-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">All Sessions History</h2>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" onChange={(e) => setOffersOnly(e.target.checked)} />
                <span>Show Offers only</span>
              </label>
            </div>
            <div className="max-h-[600px] overflow-auto text-xs">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-nexus-900/95 text-[11px] text-white/60">
                  <tr>
                    <th className="border-b border-white/10 px-3 py-2">Skill</th>
                    <th className="border-b border-white/10 px-3 py-2">Learner</th>
                    <th className="border-b border-white/10 px-3 py-2">Teacher</th>
                    <th className="border-b border-white/10 px-3 py-2">Status</th>
                    <th className="border-b border-white/10 px-3 py-2">Date</th>
                    <th className="border-b border-white/10 px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(offersOnly ? sessions.filter((s) => s.kind === "Offer" || s.status === "Offer") : sessions).map((s) => (
                    <tr key={s._id} className="hover:bg-white/5">
                      <td className="border-b border-white/5 px-3 py-2">{s.skillName}</td>
                      <td className="border-b border-white/5 px-3 py-2">
                        {s.learnerId?.name || "Unknown"}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2">
                        {s.teacherId?.name || "Unassigned"}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${
                            s.status === "Completed"
                              ? "bg-emerald-500/20 text-emerald-200"
                              : s.status === "Accepted"
                              ? "bg-blue-500/20 text-blue-200"
                              : "bg-yellow-500/20 text-yellow-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="border-b border-white/5 px-3 py-2 text-[11px] text-white/60">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border-b border-white/5 px-3 py-2">
                        <button type="button" onClick={() => setSessionEditModal({ open: true, session: s })} className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px] text-nexus-200">View / Edit</button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(s._id)}
                          className="ml-1 rounded border border-red-400/50 px-2 py-0.5 text-[10px] text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "messages" && (
          <section className="glass-card p-4">
            <h2 className="mb-4 text-sm font-semibold">All Platform Messages</h2>
            <p className="mb-4 text-xs text-white/60">
              Click a conversation to see full messages
            </p>
            {(() => {
              const conversations = new Map();
              messages.forEach((m) => {
                const senderId = m.senderId?._id || m.senderId || "unknown";
                const receiverId = m.receiverId?._id || m.receiverId || "unknown";
                const senderName = m.senderId?.name || "Unknown";
                const receiverName = m.receiverId?.name || "Unknown";
                const key = [senderId, receiverId].sort().join("-");
                if (!conversations.has(key)) {
                  conversations.set(key, {
                    users: [senderName, receiverName],
                    userIds: [senderId, receiverId],
                    messages: []
                  });
                }
                conversations.get(key).messages.push(m);
              });

              const sortedConversations = Array.from(conversations.entries()).sort((a, b) => {
                const aLast = a[1].messages[a[1].messages.length - 1]?.createdAt || 0;
                const bLast = b[1].messages[b[1].messages.length - 1]?.createdAt || 0;
                return new Date(bLast) - new Date(aLast);
              });

              return (
                <div className="max-h-[600px] space-y-3 overflow-auto">
                  {sortedConversations.map(([key, conv]) => {
                    const expanded = expandedMessageKey === key;
                    const lastMsg = conv.messages
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    const preview = lastMsg?.content?.slice(0, 50) || "No messages";
                    return (
                      <div key={key} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedMessageKey(expanded ? null : key)}
                          className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="flex -space-x-2">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-nexus-500 to-purple-500 border-2 border-nexus-900 flex items-center justify-center text-sm font-bold text-white">
                              {conv.users[0]?.[0] || "?"}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-nexus-900 flex items-center justify-center text-sm font-bold text-white">
                              {conv.users[1]?.[0] || "?"}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-amber-200 truncate">
                              {conv.users[0]} ↔ {conv.users[1]}
                            </p>
                            <p className="text-[11px] text-white/60 truncate">{preview}{preview.length >= 50 ? "…" : ""}</p>
                          </div>
                          <span className="text-[10px] text-white/50 shrink-0">
                            {conv.messages.length} msg{conv.messages.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-white/60">{expanded ? "▼" : "▶"}</span>
                        </button>
                        {expanded && (
                          <div className="border-t border-white/10 p-4 space-y-2 max-h-72 overflow-auto bg-black/30">
                            {conv.messages
                              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                              .map((m) => {
                                const isFirst = (m.senderId?._id || m.senderId) === conv.userIds[0];
                                return (
                                  <div
                                    key={m._id}
                                    className={`rounded-lg p-2 ${
                                      isFirst
                                        ? "ml-4 bg-gradient-to-r from-nexus-500/30 to-purple-500/30"
                                        : "mr-4 bg-white/5"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-[11px] font-medium text-white/90">
                                        {m.senderId?.name || "Unknown"}
                                      </p>
                                      <p className="text-[10px] text-white/50">
                                        {new Date(m.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-white/80 whitespace-pre-wrap">{m.content}</p>
                                    {m.isEdited && (
                                      <p className="mt-1 text-[9px] text-white/50 italic">(edited)</p>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        {activeTab === "reviews" && (
          <section className="glass-card p-4">
            <h2 className="mb-4 text-sm font-semibold">All Reviews</h2>
            <div className="max-h-[600px] space-y-2 overflow-auto text-xs">
              {reviews.map((r) => (
                <AdminReviewCard
                  key={r._id}
                  review={r}
                  onUpdate={async (updates) => {
                    const { data } = await axios.put(
                      `/api/admin/reviews/${r._id}`,
                      updates,
                      { headers: authHeaders }
                    );
                    setReviews((prev) => prev.map((rev) => (rev._id === r._id ? data.review : rev)));
                  }}
                  onDelete={async () => {
                    if (!confirm("Delete this review?")) return;
                    await axios.delete(`/api/admin/reviews/${r._id}`, { headers: authHeaders });
                    setReviews((prev) => prev.filter((rev) => rev._id !== r._id));
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "payments" && (
          <section className="space-y-6">
            <div className="glass-card p-5 border-2 border-amber-500/30 rounded-xl">
              <h2 className="mb-2 text-base font-bold text-amber-200">SkillNexus Platform Settings</h2>
              <p className="text-[11px] text-white/60 mb-4">Add company bank details so learners pay the platform. Platform fee is deducted before paying teachers.</p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-[11px] text-white/60">Platform fee %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={platformConfig?.platformFeePercent ?? 10}
                    onChange={async (e) => {
                      const v = Number(e.target.value);
                      if (isNaN(v) || v < 0 || v > 100) return;
                      try {
                        const { data } = await axios.put("/api/admin/platform-config", { platformFeePercent: v }, { headers: authHeaders });
                        setPlatformConfig(data.config);
                      } catch (err) { console.error(err); }
                    }}
                    className="ml-2 w-20 rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
                  />
                </div>
                <p className="text-[11px] text-white/50">Learner pays 100% → Platform keeps fee % → Teacher gets rest</p>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-amber-100 mb-2">SkillNexus Bank Details (National / International)</p>
                <p className="text-[11px] text-white/50 mb-3">Add bank accounts & QR codes where learners will pay. You can add multiple (e.g. Nepal bank, international).</p>
                {(platformConfig?.paymentDetails || []).map((pd, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-black/20 p-3 mb-2 text-[11px] flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{(pd.bankName || "Bank")} {(pd.country || "")} {pd.type && `· ${pd.type}`}</p>
                      {pd.bankDetails && <p className="text-white/70 mt-1 whitespace-pre-wrap">{pd.bankDetails}</p>}
                      {pd.qrCodeUrl && <img src={pd.qrCodeUrl} alt="QR" className="mt-2 max-h-20 rounded border border-white/10" onError={(e) => e.target.style.display = "none"} />}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setNewBankDetail({ ...pd, _editIdx: idx })}
                        className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px] text-nexus-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = (platformConfig?.paymentDetails || []).filter((_, i) => i !== idx);
                          const { data } = await axios.put("/api/admin/platform-config", { paymentDetails: next }, { headers: authHeaders });
                          setPlatformConfig(data.config);
                        }}
                        className="rounded border border-red-400/50 px-2 py-0.5 text-[10px] text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {newBankDetail ? (
                  <div className="rounded-lg border border-nexus-500/30 bg-black/30 p-3 space-y-2 text-[11px]">
                    <input placeholder="Bank name (e.g. NIC Asia, Everest Bank)" value={newBankDetail.bankName || ""} onChange={(e) => setNewBankDetail({ ...newBankDetail, bankName: e.target.value })} className="w-full rounded bg-black/40 px-2 py-1 outline-none" />
                    <input placeholder="Country (e.g. Nepal, US)" value={newBankDetail.country || ""} onChange={(e) => setNewBankDetail({ ...newBankDetail, country: e.target.value })} className="w-full rounded bg-black/40 px-2 py-1 outline-none" />
                    <select value={newBankDetail.type || "national"} onChange={(e) => setNewBankDetail({ ...newBankDetail, type: e.target.value })} className="rounded bg-black/40 px-2 py-1 outline-none">
                      <option value="national">National</option>
                      <option value="international">International</option>
                    </select>
                    <textarea placeholder="Account number, branch, SWIFT, etc." value={newBankDetail.bankDetails || ""} onChange={(e) => setNewBankDetail({ ...newBankDetail, bankDetails: e.target.value })} rows={3} className="w-full rounded bg-black/40 px-2 py-1 outline-none" />
                    <ImageUriInput value={newBankDetail.qrCodeUrl || ""} uploadType="qr" onChange={(v) => setNewBankDetail({ ...newBankDetail, qrCodeUrl: v })} placeholder="QR code image URL or upload" label="QR" />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const current = platformConfig?.paymentDetails || [];
                          const { _editIdx, ...detail } = newBankDetail;
                          const details = typeof _editIdx === "number"
                            ? current.map((d, i) => (i === _editIdx ? { bankName: detail.bankName, country: detail.country, bankDetails: detail.bankDetails, qrCodeUrl: detail.qrCodeUrl, type: detail.type || "national" } : d))
                            : [...current, { bankName: detail.bankName, country: detail.country, bankDetails: detail.bankDetails, qrCodeUrl: detail.qrCodeUrl, type: detail.type || "national" }];
                          const { data } = await axios.put("/api/admin/platform-config", { paymentDetails: details }, { headers: authHeaders });
                          setPlatformConfig(data.config);
                          setNewBankDetail(null);
                        }}
                        className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200"
                      >
                        Save
                      </button>
                      <button type="button" onClick={() => setNewBankDetail(null)} className="rounded border border-white/20 px-2 py-1 text-[10px] text-white/70">Cancel</button>
                    </div>
                  </div>
                ) : (
                      <button
                        type="button"
                        onClick={() => setNewBankDetail({ bankName: "", country: "", bankDetails: "", qrCodeUrl: "", type: "national" })}
                        className="rounded-lg border-2 border-dashed border-nexus-500/40 px-4 py-2 text-[11px] text-nexus-200 hover:bg-nexus-500/10 font-medium"
                      >
                        + Add SkillNexus bank details / QR
                      </button>
                )}
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <h2 className="mb-4 text-sm font-semibold">All payments · Who paid how much to whom</h2>
              <div className="max-h-[500px] overflow-auto text-xs">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-nexus-900/95 text-[11px] text-white/60">
                    <tr>
                      <th className="border-b border-white/10 px-2 py-2">Learner</th>
                      <th className="border-b border-white/10 px-2 py-2">Teacher</th>
                      <th className="border-b border-white/10 px-2 py-2">Skill</th>
                      <th className="border-b border-white/10 px-2 py-2">Amount paid</th>
                      <th className="border-b border-white/10 px-2 py-2">Learner currency</th>
                      <th className="border-b border-white/10 px-2 py-2">Fee %</th>
                      <th className="border-b border-white/10 px-2 py-2">Platform fee</th>
                      <th className="border-b border-white/10 px-2 py-2">To teacher</th>
                      <th className="border-b border-white/10 px-2 py-2">Teacher currency</th>
                      <th className="border-b border-white/10 px-2 py-2">Status</th>
                      <th className="border-b border-white/10 px-2 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => {
                      const payer = String(t.payerCurrency || "USD").toUpperCase();
                      const payout = String(t.payoutCurrency || "USD").toUpperCase();
                      const buyNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
                      const sellPayout = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
                      const rate = (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0)
                        ? t.nprToPayoutRate
                        : (sellPayout ? (Number(buyNPR || 1) / Number(sellPayout || 1)) : 0);
                      const effectivePayout = Math.round((((t.teacherAmountNPR || 0) * (rate || 0)) || 0) * 100) / 100;
                      return (
                      <tr
                        key={t._id}
                        className="hover:bg-white/5 border-b border-white/5 cursor-pointer"
                        onClick={() => setSelectedTransactionDetail(t)}
                      >
                        <td className="px-2 py-2">{t.learnerId?.name || "—"}</td>
                        <td className="px-2 py-2">{t.teacherId?.name || "—"}</td>
                        <td className="px-2 py-2">{t.skillName}</td>
                        <td className="px-2 py-2">{payer} {Number(t.amountPaid).toLocaleString()}</td>
                        <td className="px-2 py-2">{payer}</td>
                        <td className="px-2 py-2">{t.platformFeePercent}%</td>
                        <td className="px-2 py-2">NPR {Number(t.platformFeeAmountNPR || 0).toLocaleString()}</td>
                        <td className="px-2 py-2 text-amber-200">{payout} {Number(effectivePayout).toLocaleString()}</td>
                        <td className="px-2 py-2">{payout}</td>
                        <td className="px-2 py-2">
                          <span className={t.status === "paid_to_teacher" ? "status-paid" : t.status === "reverted_to_learner" ? "status-reverted" : t.status === "complaint_raised" ? "status-complaint" : "status-pending"}>
                            {t.status === "paid_to_teacher" ? "Paid to teacher" : t.status === "reverted_to_learner" ? "Reverted to learner" : t.status === "complaint_raised" ? "Complaint" : "Pending payout"}
                          </span>
                        </td>
                        <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                          {t.status === "pending_payout" && (
                            <>
                              <button
                                type="button"
                                onClick={() => setExpandedPayoutId(expandedPayoutId === t._id ? null : t._id)}
                                className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px] text-nexus-200 mr-1"
                              >
                                Teacher details
                              </button>
                              <button type="button" onClick={() => setSelectedTransactionDetail(t)} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">Mark paid</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
                {expandedPayoutId && transactions.find((t) => t._id === expandedPayoutId)?.teacherId?.paymentDetails?.length > 0 && (
                  <div className="mt-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px]">
                    <p className="font-medium text-amber-200 mb-2">Teacher payout details (for paying teacher)</p>
                    {transactions.find((t) => t._id === expandedPayoutId)?.teacherId?.paymentDetails?.map((pd, i) => (
                      <div key={i} className="mb-2">
                        {pd.bankName} · {pd.country}
                        <p className="text-white/70 whitespace-pre-wrap">{pd.bankDetails}</p>
                        {pd.qrCodeUrl && <img src={pd.qrCodeUrl} alt="QR" className="max-h-24 rounded mt-1" onError={(e) => e.target.style.display = "none"} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {transactions.length === 0 && <p className="text-white/60 py-4">No payments yet.</p>}

              {selectedTransactionDetail && (
                <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setSelectedTransactionDetail(null)}>
                  <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-amber-500/30 shadow-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-lg font-bold theme-accent">Transaction Details</h3>
                      <button type="button" onClick={() => setSelectedTransactionDetail(null)} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 theme-primary">✕</button>
                    </div>
                    <div className="space-y-3.5 text-sm">
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Learner</span><span className="font-medium theme-primary">{selectedTransactionDetail.learnerId?.name || "—"}</span></div>
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Teacher</span><span className="font-medium theme-primary">{selectedTransactionDetail.teacherId?.name || "—"}</span></div>
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Skill</span><span className="font-medium theme-primary">{selectedTransactionDetail.skillName}</span></div>
                      <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-2"><span className="theme-muted min-w-[140px]">Amount paid (by learner)</span><span className="font-semibold theme-primary">{selectedTransactionDetail.amountPaid} {selectedTransactionDetail.payerCurrency || "USD"}</span></div>
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Platform fee ({selectedTransactionDetail.platformFeePercent}%)</span><span className="font-semibold theme-accent">NPR {Number(selectedTransactionDetail.platformFeeAmountNPR || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between items-center py-1">
                        <span className="theme-muted min-w-[140px]">To teacher</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                          {(() => {
                            const t = selectedTransactionDetail;
                            const payout = String(t.payoutCurrency || "USD").toUpperCase();
                            const buyNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
                            const sellPayout = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
                            const rate = (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0)
                              ? t.nprToPayoutRate
                              : (sellPayout ? (Number(buyNPR || 1) / Number(sellPayout || 1)) : 0);
                            const effective = Math.round((((t.teacherAmountNPR || 0) * (rate || 0)) || 0) * 100) / 100;
                            return `${payout} ${Number(effective).toLocaleString()}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="theme-muted min-w-[140px]">Conversion</span>
                        <span className="font-medium theme-primary">
                          {(() => {
                            const t = selectedTransactionDetail;
                            const payer = String(t.payerCurrency || "USD").toUpperCase();
                            const payout = String(t.payoutCurrency || "USD").toUpperCase();
                            const buy = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payer)?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payer)?.rateToUSD ?? 1;
                            const sellNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
                            const buyNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
                            const sellPayout = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
                            const payerToUSD = Number(buy || 1);
                            const USDToNPR = sellNPR > 0 ? Number(1 / sellNPR) : 0;
                            const NPRToPayout = sellPayout > 0 ? Number(buyNPR / sellPayout) : 0;
                            return `${payer}→USD ${payerToUSD} · USD→NPR ${USDToNPR.toFixed(4)} · NPR→${payout} ${Number(NPRToPayout || 0).toFixed(4)}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Learner currency</span><span className="font-medium theme-primary">{selectedTransactionDetail.payerCurrency || "USD"}</span></div>
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Teacher currency</span><span className="font-medium theme-primary">{selectedTransactionDetail.payoutCurrency || "USD"}</span></div>
                      <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Status</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${selectedTransactionDetail.status === "paid_to_teacher" ? "status-paid" : selectedTransactionDetail.status === "reverted_to_learner" ? "status-reverted" : selectedTransactionDetail.status === "complaint_raised" ? "status-complaint" : "status-pending"}`}>{selectedTransactionDetail.status === "paid_to_teacher" ? "Paid to teacher" : selectedTransactionDetail.status === "reverted_to_learner" ? "Reverted to learner" : selectedTransactionDetail.status === "complaint_raised" ? "Complaint raised" : "Pending payout"}</span></div>
                      <div className="flex justify-between text-[11px] theme-muted pt-1"><span>Paid at</span><span>{new Date(selectedTransactionDetail.paidAt).toLocaleString()}</span></div>
                      {selectedTransactionDetail.paidToTeacherAt && <div className="flex justify-between text-[11px] theme-muted"><span>Paid to teacher at</span><span>{new Date(selectedTransactionDetail.paidToTeacherAt).toLocaleString()}</span></div>}
                      {selectedTransactionDetail.revertedAt && <div className="flex justify-between text-[11px] theme-muted"><span>Reverted at</span><span>{new Date(selectedTransactionDetail.revertedAt).toLocaleString()}</span></div>}
                      {(selectedTransactionDetail.status === "pending_payout" || selectedTransactionDetail.status === "complaint_raised") && (
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                          {selectedTransactionDetail.status === "pending_payout" && (
                            <PayoutForm
                              transaction={selectedTransactionDetail}
                              authHeaders={authHeaders}
                              currencyRates={platformConfig?.currencyRates || []}
                              onUpdated={(tx) => {
                                setTransactions((prev) => prev.map((t) => t._id === tx._id ? tx : t));
                                setSelectedTransactionDetail(tx);
                              }}
                            />
                          )}
                          <button type="button" onClick={() => { setRevertModal({ open: true, tx: selectedTransactionDetail, deductionAmount: 0 }); }} className="rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200">Revert to learner</button>
                          {complaints.filter((c) => c.transaction?._id === selectedTransactionDetail._id).length > 0 && (
                            <button type="button" onClick={() => { const comp = complaints.find((c) => c.transaction?._id === selectedTransactionDetail._id); if (comp) setResolveReassignModal({ open: true, complaint: comp, meetingLink: "" }); }} className="rounded border border-nexus-400/50 bg-nexus-500/20 px-3 py-1.5 text-xs font-medium text-nexus-200">Resolve & pay teacher</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {revertModal.open && revertModal.tx && (
                <div className="modal-overlay fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
                  <div className="modal-content w-full max-w-sm p-6 rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-base font-bold theme-accent mb-3">Revert payment to learner</h3>
                    <p className="text-sm theme-muted mb-3">Refund will be sent to learner. Optionally deduct an amount before refund:</p>
                    <input type="number" min={0} max={revertModal.tx.amountPaid} step={0.01} value={revertModal.deductionAmount} onChange={(e) => setRevertModal((m) => ({ ...m, deductionAmount: Math.max(0, Math.min(revertModal.tx.amountPaid, Number(e.target.value) || 0)) }))} className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-3" placeholder="Deduction amount (0 = full refund)" />
                    <p className="text-xs theme-muted mb-4">Refund amount: {revertModal.tx.amountPaid - (revertModal.deductionAmount || 0)}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={async () => { try { const { data } = await axios.patch(`/api/admin/transactions/${revertModal.tx._id}/revert`, { deductionAmount: revertModal.deductionAmount }, { headers: authHeaders }); setTransactions((prev) => prev.map((t) => t._id === revertModal.tx._id ? data.transaction : t)); setSelectedTransactionDetail(data.transaction); setRevertModal({ open: false, tx: null, deductionAmount: 0 }); setComplaints((prev) => prev.map((c) => c.transaction?._id === revertModal.tx._id ? { ...c, transaction: data.transaction } : c)); } catch (err) { console.error(err); } }} className="flex-1 rounded border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-sm font-medium">Confirm revert</button>
                      <button type="button" onClick={() => setRevertModal({ open: false, tx: null, deductionAmount: 0 })} className="flex-1 rounded border border-slate-300 dark:border-white/20 px-3 py-2 text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Complaints section */}
              <div className="glass-card p-4 rounded-xl mt-6">
                <h2 className="mb-3 text-sm font-semibold">Payment complaints</h2>
                {complaints.length === 0 ? (
                  <p className="theme-muted text-xs py-2">No complaints yet.</p>
                ) : (
                  <div className="max-h-[300px] overflow-auto space-y-2 text-xs">
                    {complaints.map((c) => (
                      <div key={c._id} className="rounded-lg border border-white/10 dark:border-slate-300/30 p-3 theme-primary">
                        <p><span className="theme-muted">By:</span> {c.raisedBy?.name} ({c.role}) · <span className="theme-muted">Status:</span> {c.status}</p>
                        <p className="mt-1 theme-muted">{c.reason}</p>
                        {c.transaction && <p className="mt-1">Tx: {c.transaction.learnerId?.name} → {c.transaction.teacherId?.name} · {c.transaction.skillName}</p>}
                        {(c.proofUrls?.length > 0 || c.proofSubmittedByAdmin?.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {[...(c.proofUrls || []), ...(c.proofSubmittedByAdmin || [])].map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-nexus-400 dark:text-nexus-300 underline text-[10px]">Proof {i + 1}</a>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          <button type="button" onClick={() => c.transaction && setSelectedTransactionDetail(c.transaction)} className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px]">View tx</button>
                          {c.status !== "resolved" && c.status !== "reverted" && c.transaction?.status !== "paid_to_teacher" && (
                            <button type="button" onClick={() => setResolveReassignModal({ open: true, complaint: c, meetingLink: "" })} className="rounded border border-emerald-400/50 px-2 py-0.5 text-[10px]">Resolve & pay</button>
                          )}
                          {c.status !== "resolved" && c.status !== "reverted" && c.transaction && (
                            <button type="button" onClick={() => setRevertModal({ open: true, tx: c.transaction, deductionAmount: 0 })} className="rounded border border-amber-400/50 px-2 py-0.5 text-[10px]">Revert</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {resolveReassignModal.open && resolveReassignModal.complaint && (
                <div className="modal-overlay fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
                  <div className="modal-content w-full max-w-sm p-6 rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-base font-bold theme-accent mb-3">Resolve complaint & pay teacher</h3>
                    <p className="text-sm theme-muted mb-3">Add new meeting link, then mark as paid:</p>
                    <input type="text" value={resolveReassignModal.meetingLink} onChange={(e) => setResolveReassignModal((m) => ({ ...m, meetingLink: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-4" placeholder="Meeting link (optional)" />
                    <div className="flex gap-2">
                      <button type="button" onClick={async () => { try { const { data } = await axios.patch(`/api/admin/complaints/${resolveReassignModal.complaint._id}/resolve-reassign`, { meetingLink: resolveReassignModal.meetingLink }, { headers: authHeaders }); setTransactions((prev) => prev.map((t) => t._id === data.transaction._id ? data.transaction : t)); setSelectedTransactionDetail(data.transaction); setResolveReassignModal({ open: false, complaint: null, meetingLink: "" }); setComplaints((prev) => prev.map((c) => c._id === resolveReassignModal.complaint._id ? { ...c, ...data.complaint } : c)); } catch (err) { console.error(err); } }} className="flex-1 rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-2 text-sm font-medium">Confirm & pay teacher</button>
                      <button type="button" onClick={() => setResolveReassignModal({ open: false, complaint: null, meetingLink: "" })} className="flex-1 rounded border border-slate-300 dark:border-white/20 px-3 py-2 text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "earnings" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Platform earnings & expenditure</h2>
            <div className="flex flex-wrap gap-4 items-center">
              <input type="date" value={earningsFrom} onChange={(e) => setEarningsFrom(e.target.value)} className="rounded border border-slate-300 dark:border-white/20 px-2 py-1 text-xs" />
              <input type="date" value={earningsTo} onChange={(e) => setEarningsTo(e.target.value)} className="rounded border border-slate-300 dark:border-white/20 px-2 py-1 text-xs" />
              <button type="button" onClick={async () => { try { const { data } = await axios.get("/api/admin/earnings", { headers: authHeaders, params: { from: earningsFrom || undefined, to: earningsTo || undefined } }); setEarningsData(data); } catch (e) { console.error(e); } }} className="rounded border border-nexus-400/50 px-3 py-1 text-xs">Apply filter</button>
              <button
                type="button"
                onClick={() => {
                  const rateMap = {};
                  const buyMap = {};
                  const sellMap = {};
                  (currencyRates || []).forEach((r) => {
                    const code = String(r.code || "USD").toUpperCase();
                    buyMap[code] = Number(r.buyToUSD ?? r.rateToUSD ?? 1) || 1;
                    sellMap[code] = Number(r.sellToUSD ?? r.rateToUSD ?? 1) || 1;
                    rateMap[code] = Number(r.rateToUSD ?? r.buyToUSD ?? 1) || 1;
                  });
                  const report = String(reportingCurrency || "NPR").toUpperCase();
                  const toReport = (code, amount) => {
                    const src = String(code || "NPR").toUpperCase();
                    const srcRate = rateMap[src] || 1;
                    const usd = Number(amount || 0) / (srcRate || 1);
                    const repRate = rateMap[report] || 1;
                    return Math.round((usd * repRate) * 100) / 100;
                  };
                  const byCurrency = earningsData.totals?.byCurrency || {};
                  const convertedTotals = Object.entries(byCurrency).reduce(
                    (acc, [code, vals]) => {
                      acc.totalReceived += toReport(code, vals.totalReceived || 0);
                      acc.platformFees += toReport(code, vals.platformFees || 0);
                      acc.paidToTeachers += toReport(code, vals.paidToTeachers || 0);
                      return acc;
                    },
                    { totalReceived: 0, platformFees: 0, paidToTeachers: 0 }
                  );
                  const totalExpenditureRep = toReport("USD", earningsData.totals?.totalExpenditure || 0);
                  const profitLossRep = Math.round(((convertedTotals.platformFees || 0) - totalExpenditureRep) * 100) / 100;
                  const rows = (earningsData.transactions || []).map((t) => {
                    const lCurSym = getCurrencyForCountry(t.learnerId?.country).symbol;
                    const teCurSym = getCurrencyForCountry(t.teacherId?.country).symbol;
                    const paid = `${lCurSym} ${Number(t.amountPaid).toLocaleString()}`;
                    const fee = `${lCurSym} ${Number(t.platformFeeAmount).toLocaleString()}`;
                    const computedPayout = typeof t.payoutAmount === "number"
                      ? t.payoutAmount
                      : (typeof t.exchangeRate === "number" && t.exchangeRate > 0)
                        ? Math.round((t.teacherAmount * t.exchangeRate) * 100) / 100
                        : (() => {
                            const payer = String(t.payerCurrency || "USD").toUpperCase();
                            const payout = String(t.payoutCurrency || "USD").toUpperCase();
                            const buy = buyMap[payer] || 1;
                            const sell = sellMap[payout] || 1;
                            const rate = sell > 0 ? (buy / sell) : 0;
                            return Math.round((Number(t.teacherAmount || 0) * (rate || 1)) * 100) / 100;
                          })();
                    const toTeacher = `${t.payoutCurrency || teCurSym} ${Number(computedPayout).toLocaleString()}`;
                    const exRateText = typeof t.exchangeRate === "number" && t.exchangeRate > 0 ? String(t.exchangeRate) : "auto";
                    const payDetails = Array.isArray(t.teacherId?.paymentDetails) && t.teacherId.paymentDetails.length > 0
                      ? t.teacherId.paymentDetails.map((pd) => {
                          const qr = pd.qrCodeUrl ? `<br/><img src="${pd.qrCodeUrl}" alt="QR" style="height:64px;border:1px solid #ddd;border-radius:6px;margin-top:4px" />` : "";
                          return `<div><strong>${pd.bankName || "Bank"}</strong> · ${pd.country || ""}<br/>${(pd.bankDetails || "").replace(/\n/g, "<br/>")}${qr}</div>`;
                        }).join("<hr style='border:none;border-top:1px solid #eee;margin:6px 0'/>")
                      : "";
                    return `<tr><td>${t.learnerId?.name || ""}</td><td>${t.teacherId?.name || ""}${payDetails ? `<div class="muted">${payDetails}</div>` : ""}</td><td>${t.skillName || ""}</td><td>${paid}</td><td>${t.platformFeePercent || 0}%</td><td>${fee}</td><td>${toTeacher}</td><td>${t.status}</td><td>${exRateText}</td></tr>`;
                  }).join("");
                  const byCurRows = Object.entries(byCurrency).map(([code, vals]) => {
                    const recv = Number(vals.totalReceived || 0).toLocaleString();
                    const fees = Number(vals.platformFees || 0).toLocaleString();
                    const paid = Number(vals.paidToTeachers || 0).toLocaleString();
                    const recvRep = toReport(code, vals.totalReceived || 0).toLocaleString();
                    const feesRep = toReport(code, vals.platformFees || 0).toLocaleString();
                    const paidRep = toReport(code, vals.paidToTeachers || 0).toLocaleString();
                    return `<tr><td>${code}</td><td>${recv}</td><td>${fees}</td><td>${paid}</td><td>${report} ${recvRep}</td><td>${report} ${feesRep}</td><td>${report} ${paidRep}</td></tr>`;
                  }).join("");
                  const logoTag = (platformConfig && platformConfig.logoUrl)
                    ? `<img src="${platformConfig.logoUrl}" alt="Logo" />`
                    : `<div style="height:48px;width:48px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">SN</div>`;
                  const html = `
                    <html>
                      <head>
                        <meta charset="utf-8" />
                        <title>Earnings Statement</title>
                        <style>
                          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:24px}
                          h1{font-size:18px;margin:0 0 12px}
                          table{width:100%;border-collapse:collapse;margin-top:12px}
                          th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:left}
                          .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}
                          .card{border:1px solid #ddd;border-radius:8px;padding:10px}
                          .muted{color:#666;font-size:12px}
                          .subtle{color:#444;font-size:11px}
                          .brand{display:flex;align-items:center;gap:10px;margin-bottom:10px}
                          .brand img{height:48px;width:48px;border-radius:8px;border:1px solid #ddd;object-fit:contain}
                        </style>
                      </head>
                      <body>
                        <div class="brand">
                          ${logoTag}
                          <h1>SkillNexus · Earnings & Expenditure</h1>
                        </div>
                        <p class="subtle">Reporting currency: ${report}</p>
                        <div class="grid">
                          <div class="card"><div class="muted">Total received (${report})</div><div><strong>${convertedTotals.totalReceived.toLocaleString()}</strong></div></div>
                          <div class="card"><div class="muted">Platform fees (${report})</div><div><strong>${convertedTotals.platformFees.toLocaleString()}</strong></div></div>
                          <div class="card"><div class="muted">Paid to teachers (${report})</div><div><strong>${convertedTotals.paidToTeachers.toLocaleString()}</strong></div></div>
                          <div class="card"><div class="muted">Other expenditure (${report})</div><div><strong>${totalExpenditureRep.toLocaleString()}</strong></div></div>
                        </div>
                        <div class="grid">
                          <div class="card"><div class="muted">Profit / Loss (${report})</div><div><strong>${profitLossRep.toLocaleString()}</strong></div></div>
                        </div>
                        <h2 style="font-size:14px;margin:16px 0 8px">Totals by currency</h2>
                        <table>
                          <thead><tr><th>Currency</th><th>Received</th><th>Fees</th><th>Paid to teachers</th><th>Received (${report})</th><th>Fees (${report})</th><th>Paid (${report})</th></tr></thead>
                          <tbody>${byCurRows}</tbody>
                        </table>
                        <h2 style="font-size:14px;margin:18px 0 8px">Transactions</h2>
                        <table>
                          <thead><tr><th>Learner</th><th>Teacher</th><th>Skill</th><th>Amount paid</th><th>Fee %</th><th>Platform fee</th><th>To teacher</th><th>Status</th><th>Rate</th></tr></thead>
                          <tbody>${rows}</tbody>
                        </table>
                        <p class="subtle" style="margin-top:12px">Conversion uses admin-defined rates (code → USD), then USD → ${report}.</p>
                      </body>
                    </html>`;
                  const w = window.open("", "_blank");
                  if (!w) return;
                  w.document.open();
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                  w.print();
                }}
                className="rounded border border-white/20 px-3 py-1 text-xs"
              >
                Download PDF
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(() => {
                const rateMap = {};
                (currencyRates || []).forEach((r) => {
                  const code = String(r.code || "USD").toUpperCase();
                  const rate = Number(r.rateToUSD ?? r.buyToUSD ?? 1) || 1;
                  rateMap[code] = rate;
                });
                const report = String(reportingCurrency || "NPR").toUpperCase();
                const toReport = (code, amount) => {
                  const src = String(code || "NPR").toUpperCase();
                  const srcRate = rateMap[src] || 1;
                  const usd = Number(amount || 0) / (srcRate || 1);
                  const repRate = rateMap[report] || 1;
                  return Math.round((usd * repRate) * 100) / 100;
                };
                const byCurrency = earningsData.totals?.byCurrency || {};
                const converted = Object.entries(byCurrency).reduce(
                  (acc, [code, vals]) => {
                    acc.totalReceived += toReport(code, vals.totalReceived || 0);
                    acc.platformFees += toReport(code, vals.platformFees || 0);
                    acc.paidToTeachers += toReport(code, vals.paidToTeachers || 0);
                    return acc;
                  },
                  { totalReceived: 0, platformFees: 0, paidToTeachers: 0 }
                );
                return (
                  <>
                    <div className="glass-card p-4">
                      <p className="text-[11px] theme-muted">Total received ({report})</p>
                      <p className="text-xl font-bold theme-primary">{converted.totalReceived.toLocaleString()}</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-[11px] theme-muted">Platform fees ({report})</p>
                      <p className="text-xl font-bold theme-accent">{converted.platformFees.toLocaleString()}</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-[11px] theme-muted">Paid to teachers ({report})</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{converted.paidToTeachers.toLocaleString()}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-[11px] theme-muted">Reporting currency</label>
              <select
                value={reportingCurrency}
                onChange={(e) => setReportingCurrency(e.target.value)}
                className="rounded border border-white/20 px-2 py-1 text-xs bg-black/30"
              >
                {currencyRates.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
            <EarningsSummary
              totals={earningsData.totals}
              byCurrency={earningsData.totals?.byCurrency}
              reportingCurrency={reportingCurrency}
              currencyRates={currencyRates}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {(() => {
                const rateMap = {};
                (currencyRates || []).forEach((r) => {
                  const code = String(r.code || "USD").toUpperCase();
                  const rate = Number(r.rateToUSD ?? r.buyToUSD ?? 1) || 1;
                  rateMap[code] = rate;
                });
                const report = String(reportingCurrency || "NPR").toUpperCase();
                const toReport = (code, amount) => {
                  const src = String(code || "NPR").toUpperCase();
                  const srcRate = rateMap[src] || 1;
                  const usd = Number(amount || 0) / (srcRate || 1);
                  const repRate = rateMap[report] || 1;
                  return Math.round((usd * repRate) * 100) / 100;
                };
                const byCurrency = earningsData.totals?.byCurrency || {};
                const converted = Object.entries(byCurrency).reduce(
                  (acc, [code, vals]) => {
                    acc.platformFees += toReport(code, vals.platformFees || 0);
                    return acc;
                  },
                  { platformFees: 0 }
                );
                const expRep = toReport("USD", earningsData.totals?.totalExpenditure || 0);
                const profitLossRep = Math.round((converted.platformFees - expRep) * 100) / 100;
                return (
                  <>
                    <div className="glass-card p-4">
                      <p className="text-[11px] theme-muted">Other expenditure ({report})</p>
                      <p className="text-xl font-bold theme-primary">{expRep.toLocaleString()}</p>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-[11px] theme-muted">Profit / Loss ({report})</p>
                      <p className={`text-xl font-bold ${profitLossRep >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{profitLossRep.toLocaleString()}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            {earningsData.totals?.byCurrency && (
              <div className="glass-card p-4">
                <h3 className="text-sm font-semibold mb-2">Totals by currency</h3>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(earningsData.totals.byCurrency).map(([cur, vals]) => (
                    <div key={cur} className="rounded border border-white/10 p-2">
                      <p className="font-semibold mb-1">{cur}</p>
                      <p className="theme-muted">Received: {(vals.totalReceived || 0).toLocaleString()}</p>
                      <p className="theme-muted">Fees: {(vals.platformFees || 0).toLocaleString()}</p>
                      <p className="theme-muted">Paid to teachers: {(vals.paidToTeachers || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Platform Fee</h3>
              <div className="flex items-end gap-2">
                <div>
                  <label className="text-[11px] theme-muted">Fee percent</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={platformConfig?.platformFeePercent ?? 10}
                    onChange={(e) => setPlatformConfig((p) => ({ ...(p || {}), platformFeePercent: Number(e.target.value) }))}
                    onBlur={async (e) => {
                      try {
                        const { data } = await axios.put("/api/admin/platform-config", { platformFeePercent: Number(e.target.value) }, { headers: authHeaders });
                        setPlatformConfig(data.config);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="ml-2 w-24 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  />
                </div>
                <span className="text-[11px] theme-muted">% deducted from learner payment</span>
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Expenditure (besides teacher payouts)</h3>
              <form
                className="flex flex-wrap gap-2 mb-3 items-end"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const amount = Number(fd.get("amount")) || 0;
                  const category = fd.get("category") || "other";
                  const description = fd.get("description") || "";
                  const tags = (fd.get("tags") || "")
                    .split(/[,|;\\s]+/)
                    .map((t) => t.trim())
                    .filter(Boolean);
                  const attachments = (fd.get("attachments") || "")
                    .split(/[,|;\\s]+/)
                    .map((t) => t.trim())
                    .filter(Boolean);
                  try {
                    const { data } = await axios.post("/api/admin/expenditures", { amount, category, description, tags, attachments }, { headers: authHeaders });
                    setExpenditures((prev) => [data, ...prev]);
                    e.target.reset();
                  } catch (err) { console.error(err); }
                }}
              >
                <div>
                  <label className="block text-[11px] theme-muted mb-1">Amount</label>
                  <input type="number" name="amount" placeholder="0.00" min={0} step={0.01} className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-32" required />
                </div>
                <div>
                  <label className="block text-[11px] theme-muted mb-1">Category</label>
                  <input type="text" name="category" placeholder="Category" className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-36" />
                </div>
                <div className="min-w-[180px]">
                  <label className="block text-[11px] theme-muted mb-1">Tags (comma)</label>
                  <input type="text" name="tags" placeholder="education,infra" className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-full" />
                </div>
                <div className="min-w-[220px] flex-1">
                  <label className="block text-[11px] theme-muted mb-1">Receipt URLs (comma)</label>
                  <input type="text" name="attachments" placeholder="https://..." className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-full" />
                </div>
                <div className="min-w-[220px] flex-1">
                  <label className="block text-[11px] theme-muted mb-1">Description</label>
                  <input type="text" name="description" placeholder="Short note" className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-full" />
                </div>
                <button type="submit" className="rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-xs">Add</button>
              </form>
              <div className="mb-2 flex flex-wrap gap-2">
                <input type="text" placeholder="Filter category" className="rounded border border-white/20 px-2 py-1 text-[11px]" onChange={(e) => setExpCategoryFilter(e.target.value)} />
                <input type="text" placeholder="Filter tag" className="rounded border border-white/20 px-2 py-1 text-[11px]" onChange={(e) => setExpTagFilter(e.target.value)} />
              </div>
              <div className="max-h-56 overflow-auto space-y-2 text-xs">
                {expenditures
                  .filter((e) => !expCategoryFilter || String(e.category || "").toLowerCase().includes(expCategoryFilter.toLowerCase()))
                  .filter((e) => !expTagFilter || (Array.isArray(e.tags) && e.tags.some((t) => String(t).toLowerCase().includes(expTagFilter.toLowerCase()))))
                  .map((e) => (
                  <div key={e._id} className="rounded border border-white/10 p-2">
                    <div className="flex justify-between items-center">
                      <span>${e.amount} · {e.category} · {e.description || "—"}</span>
                      <span className="text-[10px] theme-muted">{new Date(e.date).toLocaleDateString()}</span>
                    </div>
                    {(e.tags?.length > 0 || e.attachments?.length > 0) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {e.tags?.map((t, i) => (
                          <span key={`t-${i}`} className="rounded bg-white/10 px-2 py-0.5 text-[10px]">{t}</span>
                        ))}
                        {e.attachments?.map((u, i) => (
                          <a key={`a-${i}`} href={u} target="_blank" rel="noopener noreferrer" className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px]">Receipt {i + 1}</a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {expenditures.length === 0 && <p className="theme-muted py-2">No expenditures recorded.</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Platform settings</h2>
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Logo</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ImageUriInput value={platformConfig?.logoUrl || ""} uploadType="logo" onChange={async (v) => { try { await axios.put("/api/admin/platform-config", { ...(platformConfig || {}), logoUrl: v }, { headers: authHeaders }); setPlatformConfig((p) => ({ ...(p || {}), logoUrl: v })); } catch (e) { console.error(e); } }} placeholder="Logo URL or upload" />
                {platformConfig?.logoUrl && (
                  <div className="rounded border border-white/10 bg-black/20 p-3 flex items-center justify-center">
                    <img src={platformConfig.logoUrl} alt="Logo preview" className="max-h-40 md:max-h-56" onError={(e) => e.target.style.display = "none"} />
                  </div>
                )}
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Google Sign‑in</h3>
              <p className="text-xs theme-muted mb-2">Paste your Google Identity Services client id to enable “Continue with Google”.</p>
              <input
                type="text"
                value={platformConfig?.googleClientId || ""}
                onChange={(e) => setPlatformConfig((p) => ({ ...(p || {}), googleClientId: e.target.value }))}
                onBlur={async (e) => {
                  try {
                    const { data } = await axios.put("/api/admin/platform-config", { googleClientId: e.target.value }, { headers: authHeaders });
                    setPlatformConfig(data.config);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                placeholder="e.g. 1234567890-abc.apps.googleusercontent.com"
              />
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Privacy & Terms</h3>
              <p className="text-xs theme-muted mb-2">Edit legal documents shown to users.</p>
              <div className="flex gap-2">
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="rounded border border-nexus-400/50 px-3 py-1 text-xs">View Privacy</a>
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="rounded border border-nexus-400/50 px-3 py-1 text-xs">View Terms</a>
              </div>
              {(() => {
                const ensureDocs = async () => {
                  const privacyDoc = (legalDocs || []).find((d) => d.type === "privacy");
                  const termsDoc = (legalDocs || []).find((d) => d.type === "terms");
                  const seedPrivacy = !privacyDoc || !privacyDoc.content;
                  const seedTerms = !termsDoc || !termsDoc.content;
                  if (!seedPrivacy && !seedTerms) return;
                  const privacyContent = `
                    <h2>Introduction</h2>
                    <p>SkillNexus (“we”, “our”, “us”) provides a platform connecting learners with teachers worldwide. This Privacy Policy explains what data we collect, how we use it, and your rights.</p>
                    <h2>Scope</h2>
                    <p>This policy applies to all SkillNexus services, websites, mobile access, and communications.</p>
                    <h2>Information We Collect</h2>
                    <ul>
                      <li><strong>Account</strong>: name, email, password (hashed), country, role</li>
                      <li><strong>Profile</strong>: skills, biography, languages, links, avatar</li>
                      <li><strong>Transactions</strong>: amounts, currencies, rates, payout details</li>
                      <li><strong>Content</strong>: messages, session notes, reviews, complaints</li>
                      <li><strong>Usage</strong>: device/browser data, IP, logs, timestamps</li>
                      <li><strong>Cookies/Analytics</strong>: preferences, session and analytics identifiers</li>
                    </ul>
                    <h2>How We Use Information</h2>
                    <ul>
                      <li>Provide, secure, and improve the platform</li>
                      <li>Process payments, payouts, currency conversions, and accounting</li>
                      <li>Prevent fraud, abuse, and enforce policies</li>
                      <li>Communicate service updates and support</li>
                      <li>Comply with legal obligations</li>
                    </ul>
                    <h2>Legal Bases</h2>
                    <ul>
                      <li>Consent (where required)</li>
                      <li>Contract performance (providing services)</li>
                      <li>Legitimate interests (security, improvements)</li>
                      <li>Legal compliance</li>
                    </ul>
                    <h2>Sharing</h2>
                    <ul>
                      <li>With service providers (hosting, analytics, communications, payment)</li>
                      <li>With counter-parties as needed (e.g., teacher payout details)</li>
                      <li>For legal requests, disputes, or business transfers</li>
                    </ul>
                    <h2>International Transfers</h2>
                    <p>Data may be processed outside your country. We use appropriate safeguards consistent with applicable law.</p>
                    <h2>Retention</h2>
                    <p>We keep data only as long as necessary for services, accounting, and legal compliance, then delete or anonymize.</p>
                    <h2>Your Rights</h2>
                    <ul>
                      <li>Access, rectify, delete</li>
                      <li>Object or restrict processing</li>
                      <li>Data portability</li>
                      <li>Withdraw consent where applicable</li>
                    </ul>
                    <p>To exercise rights, contact support and we will respond within a reasonable timeframe.</p>
                    <h2>Security</h2>
                    <p>We implement technical and organizational measures to protect data against unauthorized access, loss, or misuse.</p>
                    <h2>Children</h2>
                    <p>SkillNexus is not intended for children under 13 (or applicable age). We remove data if collected inadvertently.</p>
                    <h2>Cookies & Tracking</h2>
                    <ul>
                      <li>Strictly necessary (auth, session)</li>
                      <li>Preferences (theme, language)</li>
                      <li>Analytics (usage metrics)</li>
                    </ul>
                    <h2>Automated Decisions</h2>
                    <p>We do not make automated decisions producing legal effects; limited automated checks may flag fraud risks.</p>
                    <h2>Changes</h2>
                    <p>We may update this policy. Significant changes will be notified in-app or by email.</p>
                    <h2>Contact</h2>
                    <p>Privacy inquiries: support@skillnexus.example.</p>
                  `;
                  const termsContent = `
                    <h2>Acceptance</h2>
                    <p>By using SkillNexus, you agree to these Terms and the Privacy Policy.</p>
                    <h2>Eligibility & Accounts</h2>
                    <ul>
                      <li>You must provide accurate information and keep credentials secure.</li>
                      <li>You are responsible for all activity under your account.</li>
                    </ul>
                    <h2>Platform Role</h2>
                    <p>We provide a marketplace connecting learners and teachers. We are not a party to user-to-user arrangements beyond payment processing and policy enforcement.</p>
                    <h2>Payments, Fees, Taxes</h2>
                    <ul>
                      <li>Learners pay the platform; a platform fee is deducted.</li>
                      <li>Teachers receive payouts of the remainder.</li>
                      <li>Currency conversion uses admin-configured rates; rates may vary.</li>
                      <li>Users are responsible for taxes applicable to their earnings or purchases.</li>
                    </ul>
                    <h2>Payouts & Chargebacks</h2>
                    <ul>
                      <li>Payouts may require KYC and valid payout details.</li>
                      <li>Chargebacks or disputes may result in holds, reversals, or deductions.</li>
                    </ul>
                    <h2>Sessions & Cancellations</h2>
                    <ul>
                      <li>Scheduling and reschedules occur in-app.</li>
                      <li>Refunds or reassignments are handled via complaints and admin review.</li>
                    </ul>
                    <h2>Content</h2>
                    <ul>
                      <li>Users retain rights to their content.</li>
                      <li>You grant us a limited license to host and display content to provide services.</li>
                    </ul>
                    <h2>Prohibited Conduct</h2>
                    <ul>
                      <li>No illegal, harmful, fraudulent, or infringing activities.</li>
                      <li>No harassment, hate speech, or privacy violations.</li>
                    </ul>
                    <h2>Reviews & Ratings</h2>
                    <p>Reviews must be honest and respectful. We may moderate for policy violations.</p>
                    <h2>Disputes</h2>
                    <p>Raise disputes through the complaints feature; admins may decide refunds or reassignments.</p>
                    <h2>Disclaimer</h2>
                    <p>Services are provided “as is” without warranties of outcomes.</p>
                    <h2>Limitation of Liability</h2>
                    <p>To the maximum extent permitted by law, we are not liable for indirect or consequential damages.</p>
                    <h2>Indemnity</h2>
                    <p>You agree to indemnify us against claims arising from your use or content.</p>
                    <h2>Termination</h2>
                    <p>We may suspend or terminate accounts for violations; you may delete your account at any time.</p>
                    <h2>Governing Law</h2>
                    <p>These Terms are governed by the laws of the jurisdiction where SkillNexus is operated.</p>
                    <h2>Changes</h2>
                    <p>We may update these Terms; significant changes will be notified.</p>
                    <h2>Contact</h2>
                    <p>Terms inquiries: support@skillnexus.example.</p>
                  `;
                  try {
                    if (seedPrivacy) {
                      await axios.put(`/api/admin/legal/privacy`, { title: "Privacy Policy", content: privacyContent }, { headers: authHeaders });
                    }
                    if (seedTerms) {
                      await axios.put(`/api/admin/legal/terms`, { title: "Terms of Service", content: termsContent }, { headers: authHeaders });
                    }
                    const { data } = await axios.get("/api/admin/legal", { headers: authHeaders });
                    setLegalDocs(data.legal || []);
                  } catch (e) {
                    // ignore
                  }
                };
                ensureDocs();
                return null;
              })()}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const title = "Privacy Policy";
                    const content = `
                      <h2>Introduction</h2>
                      <p>SkillNexus (“we”, “our”, “us”) provides a platform connecting learners with teachers worldwide. This Privacy Policy explains data practices.</p>
                      <h2>Information We Collect</h2>
                      <ul>
                        <li>Account and profile data</li>
                        <li>Transactions and payout references</li>
                        <li>Messages, reviews, complaints</li>
                        <li>Device, IP, usage logs</li>
                        <li>Cookies and analytics identifiers</li>
                      </ul>
                      <h2>Use of Data</h2>
                      <ul>
                        <li>Provide and improve services</li>
                        <li>Payments, payouts, currency conversion</li>
                        <li>Fraud prevention and security</li>
                        <li>Legal compliance</li>
                      </ul>
                      <h2>Legal Bases</h2>
                      <ul>
                        <li>Consent</li>
                        <li>Contract</li>
                        <li>Legitimate interests</li>
                        <li>Compliance</li>
                      </ul>
                      <h2>Sharing</h2>
                      <p>Service providers, counterparties where required, legal requests.</p>
                      <h2>International Transfers</h2>
                      <p>Safeguards used consistent with applicable law.</p>
                      <h2>Retention</h2>
                      <p>Held only as long as necessary, then deleted or anonymized.</p>
                      <h2>Your Rights</h2>
                      <ul>
                        <li>Access, rectification, deletion</li>
                        <li>Objection or restriction</li>
                        <li>Portability</li>
                        <li>Withdraw consent</li>
                      </ul>
                      <h2>Security</h2>
                      <p>Technical and organizational measures protect your data.</p>
                      <h2>Children</h2>
                      <p>Not intended for under 13; data removed if collected inadvertently.</p>
                      <h2>Cookies</h2>
                      <ul>
                        <li>Necessary, preferences, analytics</li>
                      </ul>
                      <h2>Changes</h2>
                      <p>We may update and notify significant changes.</p>
                      <h2>Contact</h2>
                      <p>support@skillnexus.example.</p>
                    `;
                    try {
                      const { data } = await axios.put(`/api/admin/legal/privacy`, { title, content }, { headers: authHeaders });
                      setLegalDocs((prev) => {
                        const next = Array.isArray(prev) ? [...prev] : [];
                        const idx = next.findIndex((x) => x.type === "privacy");
                        if (idx >= 0) next[idx] = data;
                        else next.push(data);
                        return next;
                      });
                    } catch (e) { console.error(e); }
                  }}
                  className="rounded border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[11px]"
                >
                  Load recommended Privacy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const title = "Terms of Service";
                    const content = `
                      <h2>Acceptance</h2>
                      <p>By using SkillNexus, you agree to these Terms and Privacy Policy.</p>
                      <h2>Accounts</h2>
                      <ul>
                        <li>Accurate information required; credentials must be protected.</li>
                        <li>You are responsible for activity under your account.</li>
                      </ul>
                      <h2>Payments & Fees</h2>
                      <ul>
                        <li>Learners pay platform; teachers receive remainder after fees.</li>
                        <li>FX conversion uses admin-configured rates; may vary.</li>
                      </ul>
                      <h2>Sessions</h2>
                      <ul>
                        <li>Scheduling handled in-app; cancellations and reschedules allowed per policy.</li>
                        <li>Refunds/reassignments via complaints and admin review.</li>
                      </ul>
                      <h2>Content & Conduct</h2>
                      <ul>
                        <li>No illegal, harmful, fraudulent, infringing content or behavior.</li>
                      </ul>
                      <h2>IP & License</h2>
                      <p>Users retain rights; limited license to host/display for service provision.</p>
                      <h2>Disputes</h2>
                      <p>Use complaints feature; admin decisions may include refunds or reassignments.</p>
                      <h2>Disclaimer</h2>
                      <p>Services provided “as is”.</p>
                      <h2>Liability</h2>
                      <p>We are not liable for indirect or consequential damages to the extent permitted by law.</p>
                      <h2>Indemnity</h2>
                      <p>You agree to indemnify for claims arising from your use or content.</p>
                      <h2>Termination</h2>
                      <p>We may suspend/terminate for violations; you may delete account.</p>
                      <h2>Governing Law</h2>
                      <p>Jurisdiction where SkillNexus operates.</p>
                      <h2>Changes</h2>
                      <p>Terms may be updated; significant changes notified.</p>
                      <h2>Contact</h2>
                      <p>support@skillnexus.example.</p>
                    `;
                    try {
                      const { data } = await axios.put(`/api/admin/legal/terms`, { title, content }, { headers: authHeaders });
                      setLegalDocs((prev) => {
                        const next = Array.isArray(prev) ? [...prev] : [];
                        const idx = next.findIndex((x) => x.type === "terms");
                        if (idx >= 0) next[idx] = data;
                        else next.push(data);
                        return next;
                      });
                    } catch (e) { console.error(e); }
                  }}
                  className="rounded border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[11px]"
                >
                  Load recommended Terms
                </button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {["privacy", "terms"].map((type) => {
                  const doc = (legalDocs || []).find((d) => d.type === type) || { title: "", content: "" };
                  return (
                    <div key={type}>
                      <p className="text-xs font-semibold mb-2">{type === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</p>
                      <LegalEditor
                        type={type}
                        doc={doc}
                        authHeaders={authHeaders}
                        onSaved={(data) => {
                          setLegalDocs((prev) => {
                            const next = Array.isArray(prev) ? [...prev] : [];
                            const idx = next.findIndex((x) => x.type === type);
                            if (idx >= 0) next[idx] = data;
                            else next.push(data);
                            return next;
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Currencies & Country mapping</h3>
              <p className="text-xs theme-muted mb-2">Add global currencies and set country → currency mapping.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold mb-2">Currencies</p>
                  <div className="space-y-2">
                    {(platformConfig?.currencyRates || []).map((c, i) => (
                      <div key={`${c.code}-${i}`} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                        <input
                          type="text"
                          defaultValue={c.code}
                          className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                          onBlur={(e) => {
                            const next = (platformConfig?.currencyRates || []).map((x, idx) => idx === i ? { ...x, code: e.target.value.toUpperCase() } : x);
                            setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                            axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                          }}
                        />
                        <span className="text-[10px] text-white/40 md:hidden">Code</span>
                        <input
                          type="text"
                          defaultValue={c.name || ""}
                          placeholder="Name"
                          className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                          onBlur={(e) => {
                            const next = (platformConfig?.currencyRates || []).map((x, idx) => idx === i ? { ...x, name: e.target.value } : x);
                            setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                            axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                          }}
                        />
                        <span className="text-[10px] text-white/40 md:hidden">Name</span>
                        <input
                          type="number"
                          min={0}
                          step={0.0001}
                          defaultValue={c.buyToUSD ?? c.rateToUSD ?? 1}
                          placeholder="Buy→USD"
                          className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                          onBlur={(e) => {
                            const next = (platformConfig?.currencyRates || []).map((x, idx) => idx === i ? { ...x, buyToUSD: Number(e.target.value) || 0 } : x);
                            setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                            axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                          }}
                        />
                        <span className="text-[10px] text-white/40 md:hidden">Buy→USD</span>
                        <input
                          type="number"
                          min={0}
                          step={0.0001}
                          defaultValue={c.sellToUSD ?? c.rateToUSD ?? 1}
                          placeholder="Sell→USD"
                          className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                          onBlur={(e) => {
                            const next = (platformConfig?.currencyRates || []).map((x, idx) => idx === i ? { ...x, sellToUSD: Number(e.target.value) || 0 } : x);
                            setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                            axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                          }}
                        />
                        <span className="text-[10px] text-white/40 md:hidden">Sell→USD</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (platformConfig?.currencyRates || []).filter((_, idx) => idx !== i);
                            setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                            axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                          }}
                          className="rounded border border-red-400/50 bg-red-500/20 px-2 py-1 text-[10px] text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [ ...(platformConfig?.currencyRates || []), { code: "", name: "", buyToUSD: 1, sellToUSD: 1 } ];
                        setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                      }}
                      className="rounded-lg border-2 border-dashed border-nexus-500/40 px-3 py-1 text-[11px] text-nexus-200"
                    >
                      + Add currency
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2">Country → Currency</p>
                  <div className="space-y-2">
                    {(platformConfig?.countryCurrency || []).map((m, i) => (
                      <div key={`${m.countryCode}-${i}`} className="flex items-center gap-2">
                        {Array.isArray(platformConfig?.countries) && platformConfig.countries.length > 0 ? (
                          <select
                            defaultValue={m.countryCode}
                            className="w-36 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                            onChange={(e) => {
                              const next = (platformConfig?.countryCurrency || []).map((x, idx) => idx === i ? { ...x, countryCode: e.target.value.toUpperCase() } : x);
                              setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                              axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                            }}
                          >
                            <option value="">Select country</option>
                            {platformConfig.countries.map((c) => (
                              <option key={c.code} value={String(c.code).toUpperCase()}>
                                {c.name || c.code} ({String(c.code).toUpperCase()})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            defaultValue={m.countryCode}
                            placeholder="Country code (e.g., US)"
                            className="w-28 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                            onBlur={(e) => {
                              const next = (platformConfig?.countryCurrency || []).map((x, idx) => idx === i ? { ...x, countryCode: e.target.value.toUpperCase() } : x);
                              setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                              axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                            }}
                          />
                        )}
                        <input
                          type="text"
                          defaultValue={m.currencyCode}
                          placeholder="Currency code (e.g., USD)"
                          className="w-28 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                          onBlur={(e) => {
                            const next = (platformConfig?.countryCurrency || []).map((x, idx) => idx === i ? { ...x, currencyCode: e.target.value.toUpperCase() } : x);
                            setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                            axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (platformConfig?.countryCurrency || []).filter((_, idx) => idx !== i);
                            setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                            axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                          }}
                          className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const next = [ ...(platformConfig?.countryCurrency || []), { countryCode: "", currencyCode: "" } ];
                        setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                      }}
                      className="rounded-lg border-2 border-dashed border-nexus-500/40 px-3 py-1 text-[11px] text-nexus-200"
                    >
                      + Add mapping
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold mb-2">Countries</p>
                <p className="text-[11px] theme-muted mb-2">Manage country codes and names used across the app.</p>
                <div className="space-y-2">
                  {(platformConfig?.countries || []).map((c, i) => (
                    <div key={`${c.code}-${i}`} className="flex items-center gap-2">
                      <input type="text" defaultValue={c.code} placeholder="Code (e.g., US)" className="w-28 rounded bg-black/40 px-2 py-1 text-xs outline-none" onBlur={(e) => {
                        const next = (platformConfig?.countries || []).map((x, idx) => idx === i ? { ...x, code: e.target.value.toUpperCase() } : x);
                        setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                        axios.put("/api/admin/platform-config", { countries: next }, { headers: authHeaders }).catch(console.error);
                      }} />
                      <input type="text" defaultValue={c.name || ""} placeholder="Name (e.g., United States)" className="w-60 rounded bg-black/40 px-2 py-1 text-xs outline-none" onBlur={(e) => {
                        const next = (platformConfig?.countries || []).map((x, idx) => idx === i ? { ...x, name: e.target.value } : x);
                        setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                        axios.put("/api/admin/platform-config", { countries: next }, { headers: authHeaders }).catch(console.error);
                      }} />
                      <button type="button" onClick={() => {
                        const next = (platformConfig?.countries || []).filter((_, idx) => idx !== i);
                        setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                        axios.put("/api/admin/platform-config", { countries: next }, { headers: authHeaders }).catch(console.error);
                      }} className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">Delete</button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button type="button" onClick={async () => {
                      const sample = [
                        { code: "US", name: "United States" },
                        { code: "NP", name: "Nepal" },
                        { code: "IN", name: "India" },
                        { code: "PK", name: "Pakistan" },
                        { code: "GB", name: "United Kingdom" },
                        { code: "EU", name: "European Union" }
                      ];
                      try {
                        const { data } = await axios.put("/api/admin/platform-config", { countries: sample }, { headers: authHeaders });
                        setPlatformConfig(data.config);
                      } catch (e) { console.error(e); }
                    }} className="rounded border border-nexus-500/40 bg-nexus-500/20 px-3 py-1 text-[11px]">Populate sample countries</button>
                    <button type="button" onClick={async () => {
                      const rates = [
                        { code: "USD", name: "US Dollar", buyToUSD: 1, sellToUSD: 1 },
                        { code: "NPR", name: "Nepalese Rupee", buyToUSD: 0.0075, sellToUSD: 0.0074 },
                        { code: "INR", name: "Indian Rupee", buyToUSD: 0.012, sellToUSD: 0.0118 },
                        { code: "PKR", name: "Pakistani Rupee", buyToUSD: 0.0036, sellToUSD: 0.0035 },
                        { code: "EUR", name: "Euro", buyToUSD: 1.07, sellToUSD: 1.06 },
                        { code: "GBP", name: "British Pound", buyToUSD: 1.26, sellToUSD: 1.25 }
                      ];
                      try {
                        const { data } = await axios.put("/api/admin/platform-config", { currencyRates: rates }, { headers: authHeaders });
                        setPlatformConfig(data.config);
                      } catch (e) { console.error(e); }
                    }} className="rounded border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[11px]">Populate sample currencies</button>
                    <button type="button" onClick={async () => {
                      const mapping = [
                        { countryCode: "US", currencyCode: "USD" },
                        { countryCode: "GB", currencyCode: "GBP" },
                        { countryCode: "EU", currencyCode: "EUR" },
                        { countryCode: "NP", currencyCode: "NPR" },
                        { countryCode: "IN", currencyCode: "INR" },
                        { countryCode: "PK", currencyCode: "PKR" }
                      ];
                      try {
                        const { data } = await axios.put("/api/admin/platform-config", { countryCurrency: mapping }, { headers: authHeaders });
                        setPlatformConfig(data.config);
                      } catch (e) { console.error(e); }
                    }} className="rounded border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[11px]">Populate sample mappings</button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
                          const json = await res.json();
                          const rates = json?.rates || {};
                          const pick = ["USD","NPR","INR","PKR","EUR","GBP"];
                          const next = pick.map((code) => {
                            const rate = Number(rates[code]) || (code === "USD" ? 1 : 0);
                            const toUSD = code === "USD" ? 1 : 1 / rate;
                            return { code, name: code, buyToUSD: toUSD, sellToUSD: toUSD };
                          });
                          const { data } = await axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders });
                          setPlatformConfig(data.config);
                        } catch (e) {
                          console.error("Fetch latest rates error", e);
                        }
                      }}
                      className="rounded border border-blue-500/40 bg-blue-500/20 px-3 py-1 text-[11px]"
                    >
                      Fetch latest rates (USD base)
                    </button>
                  </div>
                  <button type="button" onClick={() => {
                    const next = [ ...(platformConfig?.countries || []), { code: "", name: "" } ];
                    setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                  }} className="rounded-lg border-2 border-dashed border-nexus-500/40 px-3 py-1 text-[11px] text-nexus-200">+ Add country</button>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {sessionEditModal.open && sessionEditModal.session && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/60 p-4" onClick={() => setSessionEditModal({ open: false, session: null })}>
            <div className="w-full max-w-2xl rounded-2xl border-2 border-nexus-500/30 bg-nexus-900 p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold theme-accent mb-3">Edit Session</h3>
              <div className="grid gap-3 md:grid-cols-2 text-xs">
                <div>
                  <p className="text-white/60">Skill</p>
                  <input type="text" defaultValue={sessionEditModal.session.skillName} className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none" onBlur={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, skillName: e.target.value } }))} />
                </div>
                <div>
                  <p className="text-white/60">Status</p>
                  <select defaultValue={sessionEditModal.session.status} className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none" onChange={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, status: e.target.value } }))}>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <p className="text-white/60">Meeting link</p>
                  <input type="text" defaultValue={sessionEditModal.session.meetingLink || ""} className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none" onBlur={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, meetingLink: e.target.value } }))} />
                </div>
                <div>
                  <p className="text-white/60">Scheduled for</p>
                  <input type="datetime-local" defaultValue={sessionEditModal.session.scheduledFor ? new Date(sessionEditModal.session.scheduledFor).toISOString().slice(0,16) : ""} className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none" onBlur={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null } }))} />
                </div>
                <div>
                  <p className="text-white/60">Free or paid</p>
                  <select defaultValue={sessionEditModal.session.isFree ? "free" : "paid"} className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none" onChange={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, isFree: e.target.value === "free" } }))}>
                    <option value="free">Free</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <p className="text-white/60">Budget currency</p>
                  <select
                    defaultValue={(() => {
                      const cur = sessionEditModal.session.budgetCurrency;
                      if (cur) return String(cur).toUpperCase();
                      const country = sessionEditModal.session.learnerId?.country || "";
                      const map = (platformConfig?.countryCurrency || []).find((m) => String(m.countryCode || "").toUpperCase() === String(country || "").toUpperCase());
                      return String(map?.currencyCode || "USD").toUpperCase();
                    })()}
                    className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none"
                    onChange={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, budgetCurrency: e.target.value.toUpperCase() } }))}
                  >
                    {Array.isArray(platformConfig?.currencyRates) && platformConfig.currencyRates.length > 0
                      ? platformConfig.currencyRates.map((c) => (
                          <option key={c.code} value={String(c.code).toUpperCase()}>{String(c.code).toUpperCase()}</option>
                        ))
                      : ["USD","NPR","INR","PKR","EUR","GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-white/60">Amount (budget)</p>
                  <input type="number" min={0} step={0.01} defaultValue={sessionEditModal.session.budget || 0} className="mt-1 w-full rounded bg-black/40 px-2 py-1 outline-none" onBlur={(e) => setSessionEditModal((m) => ({ ...m, session: { ...m.session, budget: Number(e.target.value) || 0 } }))} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={async () => { try { const { data } = await axios.put(`/api/admin/sessions/${sessionEditModal.session._id}`, sessionEditModal.session, { headers: authHeaders }); setSessions((prev) => prev.map((s) => s._id === data.session._id ? data.session : s)); setSessionEditModal({ open: false, session: null }); } catch (e) { console.error(e); } }} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-200">Save</button>
                <button type="button" onClick={() => setSessionEditModal({ open: false, session: null })} className="rounded border border-white/20 px-3 py-1.5 text-xs">Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {sessionDeleteModal.open && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm bg-black/60 p-4" onClick={() => setSessionDeleteModal({ open: false, sessionId: null })}>
            <div className="w-full max-w-sm rounded-2xl border-2 border-red-500/30 bg-nexus-900 p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-red-300 mb-3">Delete Session</h3>
              <p className="text-xs text-white/70 mb-4">Are you sure you want to permanently delete this session? This action cannot be undone.</p>
              <div className="flex gap-2">
                <button type="button" onClick={async () => { try { await axios.delete(`/api/admin/sessions/${sessionDeleteModal.sessionId}`, { headers: authHeaders }); setSessions((prev) => prev.filter((s) => s._id !== sessionDeleteModal.sessionId)); setSessionDeleteModal({ open: false, sessionId: null }); } catch (e) { console.error(e); } }} className="flex-1 rounded border border-red-400/50 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300">Delete</button>
                <button type="button" onClick={() => setSessionDeleteModal({ open: false, sessionId: null })} className="flex-1 rounded border border-white/20 px-3 py-1.5 text-xs">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default AdminPage;
