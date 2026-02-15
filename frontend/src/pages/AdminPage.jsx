import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import AdminNavbar from "../components/admin/AdminNavbar.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import ImageUriInput from "../components/shared/ImageUriInput.jsx";
import LegalEditor from "../components/admin/LegalEditor.jsx";
import AdminLegalPanel from "../components/admin/legal/AdminLegalPanel.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import { getCurrencyForCountry, convertAmount, formatAmount } from "../utils/currency.js";
import EarningsSummary from "../components/admin/EarningsSummary.jsx";
import PayoutForm from "../components/admin/PayoutForm.jsx";
import StatCard from "../components/shared/StatCard.jsx";
import AdminTransactionsTable from "../components/admin/AdminTransactionsTable.jsx";
import AdminQuickLinks from "../components/admin/AdminQuickLinks.jsx";
import AdminReviewCard from "../components/admin/AdminReviewCard.jsx";
import AdminTransactionDetailModal from "../components/admin/AdminTransactionDetailModal.jsx";
import AdminRevertModal from "../components/admin/AdminRevertModal.jsx";
import AdminResolveReassignModal from "../components/admin/AdminResolveReassignModal.jsx";
import AdminUserDetailsForm from "../components/admin/AdminUserDetailsForm.jsx";
import AdminSessionsTable from "../components/admin/AdminSessionsTable.jsx";
import AdminSessionsFilters from "../components/admin/sessions/AdminSessionsFilters.jsx";
import AdminMessagesView from "../components/admin/AdminMessagesView.jsx";
import AdminReviewsPanel from "../components/admin/reviews/AdminReviewsPanel.jsx";
import AdminReviewsFilters from "../components/admin/reviews/AdminReviewsFilters.jsx";
import AdminMessagesFilters from "../components/admin/messages/AdminMessagesFilters.jsx";
import EarningsNPRReportCards from "../components/admin/EarningsNPRReportCards.jsx";
import EarningsProfitLossCards from "../components/admin/EarningsProfitLossCards.jsx";
import ComplaintsList from "../components/admin/ComplaintsList.jsx";
import EarningsControls from "../components/admin/EarningsControls.jsx";
import AdminUsersFilters from "../components/admin/users/AdminUsersFilters.jsx";
import VisibilityMount from "../components/shared/VisibilityMount.jsx";
import Loader from "../components/shared/Loader.jsx";
import AdminPlatformConfigPanel from "../components/admin/settings/AdminPlatformConfigPanel.jsx";
import AdminPlatformFeePanel from "../components/admin/settings/AdminPlatformFeePanel.jsx";
import AdminCurrencyPanel from "../components/admin/settings/AdminCurrencyPanel.jsx";
import AdminNPRSummary from "../components/admin/earnings/AdminNPRSummary.jsx";
import AdminEarningsTables from "../components/admin/earnings/AdminEarningsTables.jsx";
import AdminExpendituresPanel from "../components/admin/earnings/AdminExpendituresPanel.jsx";
import ResponsiveTableCards from "../components/shared/ResponsiveTableCards.jsx";

 

const AdminPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewQuery, setReviewQuery] = useState("");
  const [reviewMinRating, setReviewMinRating] = useState(0);
  const [messageQuery, setMessageQuery] = useState("");
  const [messageContentType, setMessageContentType] = useState("all");
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
  const [sessionStatusFilter, setSessionStatusFilter] = useState("all");
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [teacherVerifiedFilter, setTeacherVerifiedFilter] = useState("any");
  const [learnerVerifiedFilter, setLearnerVerifiedFilter] = useState("any");
  const [minTrustFilter, setMinTrustFilter] = useState(0);
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
              <StatCard icon="⏳" label="Pending" value={stats.pendingSessions} borderClass="border-yellow-500/30" />
              <StatCard icon="✅" label="Completed" value={stats.completedSessions} borderClass="border-emerald-500/30" />
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
            {(earningsData.transactions || []).length > 0 && (
              <VisibilityMount placeholder={<Loader size="xs" />}>
                <AdminTransactionsTable earningsData={earningsData} currencyRates={currencyRates} />
              </VisibilityMount>
            )}

            <AdminQuickLinks navigate={navigate} />
          </>
        )}

        {activeTab === "users" && (
          <section className="glass-card p-4">
            <h2 className="mb-4 text-sm font-semibold">All Users Management</h2>
            {selectedUser && selectedUserData && userHistory ? (
              <AdminUserDetailsForm
                selectedUser={selectedUser}
                selectedUserData={selectedUserData}
                userHistory={userHistory}
                setSelectedUser={setSelectedUser}
                setSelectedUserData={setSelectedUserData}
                setUserHistory={setUserHistory}
                handleUpdateUser={handleUpdateUser}
                handleChangeRole={handleChangeRole}
                handleToggleVerify={handleToggleVerify}
                handleAwardBadge={handleAwardBadge}
                handleRemoveBadge={handleRemoveBadge}
                handleDeleteUser={handleDeleteUser}
                authHeaders={authHeaders}
                users={users}
              />
            ) : (
              <>
                <AdminUsersFilters
                  query={userQuery}
                  role={userRoleFilter}
                  teacherVerified={teacherVerifiedFilter}
                  learnerVerified={learnerVerifiedFilter}
                  minTrust={minTrustFilter}
                  onQuery={setUserQuery}
                  onRole={setUserRoleFilter}
                  onTeacherVerified={setTeacherVerifiedFilter}
                  onLearnerVerified={setLearnerVerifiedFilter}
                  onMinTrust={setMinTrustFilter}
                />
                <VisibilityMount placeholder={<Loader size="xs" />}>
                  <div className="text-xs">
                    <ResponsiveTableCards
                      title="Users"
                      headers={[
                        { key: "name", label: "Name" },
                        { key: "email", label: "Email" },
                        { key: "role", label: "Role" },
                        { key: "verified", label: "Verified" }
                      ]}
                      rows={users.filter((u) => {
                        const q = userQuery.trim().toLowerCase();
                        if (q) {
                          const name = String(u.name || "").toLowerCase();
                          const email = String(u.email || "").toLowerCase();
                          if (!name.includes(q) && !email.includes(q)) return false;
                        }
                        if (userRoleFilter !== "all" && u.role !== userRoleFilter) return false;
                        if (teacherVerifiedFilter !== "any") {
                          const t = teacherVerifiedFilter === "true";
                          if (Boolean(u.isTeacherVerified) !== t) return false;
                        }
                        if (learnerVerifiedFilter !== "any") {
                          const l = learnerVerifiedFilter === "true";
                          if (Boolean(u.isLearnerVerified) !== l) return false;
                        }
                        const trust = Number(u.trustScore || 0);
                        if (trust < Number(minTrustFilter || 0)) return false;
                        return true;
                      })}
                      renderCell={(h, user) => {
                        if (h.key === "name") {
                          return (
                            <div className="flex items-center gap-2">
                              <Avatar src={user.profilePic} name={user.name} size="sm" />
                              <button type="button" onClick={() => loadUserHistory(user._id)} className="font-medium text-nexus-200 hover:underline">
                                {user.name}
                              </button>
                            </div>
                          );
                        }
                        if (h.key === "email") return user.email;
                        if (h.key === "role") {
                          return (
                            <select value={user.role} onChange={(e) => handleChangeRole(user._id, e.target.value)} className="rounded-md bg-black/40 px-2 py-1 text-[11px] outline-none">
                              <option value="User">User</option>
                              <option value="Admin">Admin</option>
                            </select>
                          );
                        }
                        if (h.key === "verified") {
                          return (
                            <div className="flex items-center gap-3 justify-end">
                              <label className="inline-flex cursor-pointer items-center gap-2">
                                <span className="text-[11px]">Teacher</span>
                                <input type="checkbox" checked={Boolean(user.isTeacherVerified)} onChange={() => handleToggleVerify(user._id, "Teacher", Boolean(user.isTeacherVerified))} />
                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${user.isTeacherVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                                  {user.isTeacherVerified ? "Verified" : "Unverified"}
                                </span>
                              </label>
                              <label className="inline-flex cursor-pointer items-center gap-2">
                                <span className="text-[11px]">Learner</span>
                                <input type="checkbox" checked={Boolean(user.isLearnerVerified)} onChange={() => handleToggleVerify(user._id, "Learner", Boolean(user.isLearnerVerified))} />
                                <span className={`rounded-full px-2 py-0.5 text-[10px] ${user.isLearnerVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                                  {user.isLearnerVerified ? "Verified" : "Unverified"}
                                </span>
                              </label>
                            </div>
                          );
                        }
                        return "";
                      }}
                      renderActions={(user) => (
                        <button type="button" onClick={() => loadUserHistory(user._id)} className="rounded-full border border-blue-400/50 bg-blue-500/20 px-2 py-0.5 text-[11px] text-blue-200 hover:bg-blue-500/30">
                          View Details
                        </button>
                      )}
                    />
                  </div>
                </VisibilityMount>
              </>
            )}
          </section>
        )}

        {activeTab === "sessions" && (
          <>
            <AdminSessionsFilters status={sessionStatusFilter} onStatusChange={setSessionStatusFilter} offersOnly={offersOnly} setOffersOnly={setOffersOnly} />
            <VisibilityMount placeholder={<Loader size="xs" />}>
              <AdminSessionsTable
                sessions={sessions.filter((s) => sessionStatusFilter === "all" || String(s.status || "").toLowerCase() === sessionStatusFilter)}
                offersOnly={offersOnly}
                setOffersOnly={setOffersOnly}
                setSessionEditModal={setSessionEditModal}
                handleDeleteSession={handleDeleteSession}
              />
            </VisibilityMount>
          </>
        )}

        {activeTab === "messages" && (
          <>
            <AdminMessagesFilters
              query={messageQuery}
              onChange={setMessageQuery}
              contentType={messageContentType}
              onContentTypeChange={setMessageContentType}
            />
            <AdminMessagesView messages={messages} query={messageQuery} contentType={messageContentType} />
          </>
        )}

        {activeTab === "reviews" && (
          <>
            <AdminReviewsFilters
              query={reviewQuery}
              minRating={reviewMinRating}
              onQueryChange={setReviewQuery}
              onMinRatingChange={setReviewMinRating}
            />
            <AdminReviewsPanel reviews={reviews} authHeaders={authHeaders} onSetReviews={setReviews} query={reviewQuery} minRating={reviewMinRating} />
          </>
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
              <div className="text-xs">
                <ResponsiveTableCards
                  title="Payments"
                  headers={[
                    { key: "learner", label: "Learner" },
                    { key: "teacher", label: "Teacher" },
                    { key: "skill", label: "Skill" },
                    { key: "amt", label: "Amount paid" },
                    { key: "payerCur", label: "Learner currency" },
                    { key: "feePct", label: "Fee %" },
                    { key: "feeAmt", label: "Platform fee" },
                    { key: "toTeacher", label: "To teacher" },
                    { key: "payoutCur", label: "Teacher currency" },
                    { key: "status", label: "Status" }
                  ]}
                  rows={transactions}
                  renderCell={(h, t) => {
                    const payer = String(t.payerCurrency || "USD").toUpperCase();
                    const payout = String(t.payoutCurrency || "USD").toUpperCase();
                    const buyNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
                    const sellPayout = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
                    const rate = (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0)
                      ? t.nprToPayoutRate
                      : (sellPayout ? (Number(buyNPR || 1) / Number(sellPayout || 1)) : 0);
                    const effectivePayout = Math.round((((t.teacherAmountNPR || 0) * (rate || 0)) || 0) * 100) / 100;
                    if (h.key === "learner") return t.learnerId?.name || "—";
                    if (h.key === "teacher") return t.teacherId?.name || "—";
                    if (h.key === "skill") return t.skillName;
                    if (h.key === "amt") return `${payer} ${Number(t.amountPaid).toLocaleString()}`;
                    if (h.key === "payerCur") return payer;
                    if (h.key === "feePct") return `${t.platformFeePercent}%`;
                    if (h.key === "feeAmt") return `NPR ${Number(t.platformFeeAmountNPR || 0).toLocaleString()}`;
                    if (h.key === "toTeacher") return `${payout} ${Number(effectivePayout).toLocaleString()}`;
                    if (h.key === "payoutCur") return payout;
                    if (h.key === "status") {
                      const cls = t.status === "paid_to_teacher" ? "status-paid" : t.status === "reverted_to_learner" ? "status-reverted" : t.status === "complaint_raised" ? "status-complaint" : "status-pending";
                      const txt = t.status === "paid_to_teacher" ? "Paid to teacher" : t.status === "reverted_to_learner" ? "Reverted to learner" : t.status === "complaint_raised" ? "Complaint" : "Pending payout";
                      return <span className={cls}>{txt}</span>;
                    }
                    return "";
                  }}
                  renderActions={(t) => (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpandedPayoutId(expandedPayoutId === t._id ? null : t._id)}
                        className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px] text-nexus-200 mr-1"
                      >
                        Teacher details
                      </button>
                      {t.status === "pending_payout" && (
                        <button type="button" onClick={() => setSelectedTransactionDetail(t)} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                          Mark paid
                        </button>
                      )}
                    </>
                  )}
                />
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
                <AdminTransactionDetailModal
                  open={!!selectedTransactionDetail}
                  onClose={() => setSelectedTransactionDetail(null)}
                  transaction={selectedTransactionDetail}
                  authHeaders={authHeaders}
                  platformConfig={platformConfig}
                  setTransactions={setTransactions}
                  setSelectedTransactionDetail={setSelectedTransactionDetail}
                  setComplaints={setComplaints}
                  setRevertModal={setRevertModal}
                  setResolveReassignModal={setResolveReassignModal}
                  complaints={complaints}
                />
              )}

              {revertModal.open && revertModal.tx && (
                <AdminRevertModal
                  revertModal={revertModal}
                  setRevertModal={setRevertModal}
                  authHeaders={authHeaders}
                  setTransactions={setTransactions}
                  setSelectedTransactionDetail={setSelectedTransactionDetail}
                />
              )}

              <ComplaintsList
                complaints={complaints}
                setSelectedTransactionDetail={setSelectedTransactionDetail}
                setResolveReassignModal={setResolveReassignModal}
                setRevertModal={setRevertModal}
              />

              {resolveReassignModal.open && resolveReassignModal.complaint && (
                <AdminResolveReassignModal
                  resolveReassignModal={resolveReassignModal}
                  setResolveReassignModal={setResolveReassignModal}
                  authHeaders={authHeaders}
                  setTransactions={setTransactions}
                  setSelectedTransactionDetail={setSelectedTransactionDetail}
                  setComplaints={setComplaints}
                />
              )}
            </div>
          </section>
        )}

        {activeTab === "earnings" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Platform earnings & expenditure</h2>
            <EarningsControls
              earningsFrom={earningsFrom}
              earningsTo={earningsTo}
              setEarningsFrom={setEarningsFrom}
              setEarningsTo={setEarningsTo}
              currencyRates={currencyRates}
              reportingCurrency={reportingCurrency}
              earningsData={earningsData}
              platformConfig={platformConfig}
              authHeaders={authHeaders}
              setEarningsData={setEarningsData}
            />
            <EarningsNPRReportCards
              earningsData={earningsData}
              reportingCurrency={reportingCurrency}
              currencyRates={currencyRates}
            />
            <AdminNPRSummary
              earningsData={earningsData}
              reportingCurrency={reportingCurrency}
              currencyRates={currencyRates}
            />
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
            <EarningsProfitLossCards
              earningsData={earningsData}
              reportingCurrency={reportingCurrency}
              currencyRates={currencyRates}
            />
            <AdminEarningsTables
              earningsData={earningsData}
              reportingCurrency={reportingCurrency}
              currencyRates={currencyRates}
            />
            <AdminPlatformFeePanel platformConfig={platformConfig} setPlatformConfig={setPlatformConfig} authHeaders={authHeaders} />
            <AdminExpendituresPanel expenditures={expenditures} setExpenditures={setExpenditures} authHeaders={authHeaders} />
 
          </section>
        )}

        {activeTab === "settings" && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Platform settings</h2>
            <AdminPlatformConfigPanel platformConfig={platformConfig} setPlatformConfig={setPlatformConfig} authHeaders={authHeaders} />
            <AdminLegalPanel legalDocs={legalDocs} setLegalDocs={setLegalDocs} authHeaders={authHeaders} />
            <AdminCurrencyPanel platformConfig={platformConfig} setPlatformConfig={setPlatformConfig} authHeaders={authHeaders} />
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
