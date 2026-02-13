import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardToggle from "../components/DashboardToggle.jsx";
import { useToast } from "../components/Toast.jsx";
import { formatAmount, getCurrencyForCountry, convertAmount } from "../utils/currency.js";
import ImageUriInput from "../components/ImageUriInput.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/Avatar.jsx";

const DashboardPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [myTeaching, setMyTeaching] = useState([]);
  const [newRequest, setNewRequest] = useState({
    skillName: "",
    details: "",
    budget: "",
    isFree: false,
    groupEnabled: false,
    groupEmailsList: [],
    groupEmailsInfo: [],
    groupEmailInput: "",
    splitMode: "single"
  });
  const [showGroupAddedBanner, setShowGroupAddedBanner] = useState(false);
  const [reviewModal, setReviewModal] = useState({ open: false, sessionId: null, revieweeId: null, revieweeName: null });
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [paymentDetailsModal, setPaymentDetailsModal] = useState({ open: false, teacher: null, session: null, isPlatform: false });
  const [platformPaymentDetails, setPlatformPaymentDetails] = useState(null);
  const [wallet, setWallet] = useState({ asLearner: [], asTeacher: [] });
  const [selectedWalletTx, setSelectedWalletTx] = useState(null);
  const [complaintModal, setComplaintModal] = useState({ open: false, tx: null, role: null, reason: "", proofUrls: "" });
  const [meetingModal, setMeetingModal] = useState({ open: false, sessionId: null, link: "", when: "" });
  const [teacherPricingModal, setTeacherPricingModal] = useState({ open: false, sessionId: null, isFree: false, budget: "" });
  const [walletTab, setWalletTab] = useState("learner");
  const [friendRequests, setFriendRequests] = useState([]);
  const [learnerView, setLearnerView] = useState("pending");
  const [teacherView, setTeacherView] = useState("active");
  const [learnerEditModal, setLearnerEditModal] = useState({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" });
  const [learnerDeleteModal, setLearnerDeleteModal] = useState({ open: false, requestId: null });
  const [publicOffers, setPublicOffers] = useState([]);
  const [currencies, setCurrencies] = useState({ currencyRates: [], countryCurrency: [], platformFeePercent: 10 });
  const [offerPreview, setOfferPreview] = useState({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 });
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currencyRates = { USD: 1, NPR: 0.0075, INR: 0.012, PKR: 0.0036, EUR: 1.08, GBP: 1.27 };
  const convertByCurrency = (amount, fromCode, toCode) => {
    const inUsd = (amount || 0) * (currencyRates[String(fromCode || "USD").toUpperCase()] || 1);
    const toRate = currencyRates[String(toCode || "USD").toUpperCase()] || 1;
    return Math.round((toRate === 0 ? inUsd : inUsd / toRate) * 100) / 100;
  };

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    const fetchUser = async () => {
      try {
        const authRes = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(authRes.data.user);

        const [requestsRes, teachingRes, platformRes, walletRes, offersRes, notifRes] = await Promise.all([
          axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { requests: [] } })),
          axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { sessions: [] } })),
          axios.get("/api/platform/payment-details").catch(() => ({ data: {} })),
          axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { asLearner: [], asTeacher: [] } })),
          axios.get("/api/sessions/offers").catch(() => ({ data: { offers: [] } })),
          axios.get("/api/notifications", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { notifications: [] } }))
        ]);
        setMyRequests(requestsRes.data.requests || []);
        setMyTeaching(teachingRes.data.sessions || []);
        setPlatformPaymentDetails(platformRes.data);
        setWallet(walletRes.data);
        setPublicOffers(offersRes.data.offers || []);
        try {
          const curRes = await axios.get("/api/platform/currencies");
          setCurrencies({
            currencyRates: curRes.data.currencyRates || [],
            countryCurrency: curRes.data.countryCurrency || [],
            platformFeePercent: (platformRes.data.platformFeePercent ?? 10)
          });
        } catch {}
        const frRes = await axios.get("/api/users/friend-requests", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { requests: [] } }));
        setFriendRequests(frRes.data.requests || []);
        const notifs = notifRes.data.notifications || [];
        const hasGroupAdded = notifs.some((n) => (n.type === "group_added" || (n.type === "request_accepted" && String(n.link || "").startsWith("/group/"))) && !n.read);
        setShowGroupAddedBanner(hasGroupAdded);
      } catch (err) {
        localStorage.removeItem("sn_token");
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, token]);

  const handleToggle = async (desiredTeacherMode) => {
    if (!token) return;
    if (!!user.isTeacherMode === !!desiredTeacherMode) return;
    try {
      const { data } = await axios.patch(
        "/api/auth/toggle-teacher-mode",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser((prev) => (prev ? { ...prev, isTeacherMode: data.isTeacherMode } : prev));
    } catch (err) {
      const msg = err.response?.data?.message || "Could not update mode";
      setError(msg);
      showToast(msg, "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sn_token");
    navigate("/auth");
  };

  const handleRequestChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRequest((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const members = (newRequest.groupEnabled ? (newRequest.groupEmailsList || []) : [])
        .slice(0, 10)
        .map((email) => ({ email }));
      const payload = {
        skillName: newRequest.skillName,
        details: newRequest.details,
        isFree: newRequest.isFree,
        budget: newRequest.isFree ? 0 : Number(newRequest.budget) || 0,
        groupMembers: members,
        paymentSplitMode: newRequest.splitMode
      };
      const { data } = await axios.post("/api/sessions/requests", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyRequests((prev) => [data.request, ...prev]);
      setNewRequest({ skillName: "", details: "", budget: "", isFree: false, groupEnabled: false, groupEmailsList: [], groupEmailInput: "", splitMode: "single" });
    } catch (err) {
      const invalid = err.response?.data?.invalidEmails || [];
      if (invalid.length > 0) {
        const msg = `These emails are not registered: ${invalid.join(", ")}`;
        setError(msg);
        showToast(msg, "error");
      } else {
        setError("Could not create request");
        showToast("Could not create request", "error");
      }
    }
  };

  const handleCompleteSession = async (sessionId, revieweeId, revieweeName) => {
    try {
      await axios.post(
        `/api/sessions/${sessionId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh sessions
      const [requestsRes, teachingRes] = await Promise.all([
        axios.get("/api/sessions/my-requests", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("/api/sessions/my-teaching", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setMyRequests(requestsRes.data.requests || []);
      setMyTeaching(teachingRes.data.sessions || []);
      
      // Open review modal
      setReviewModal({ open: true, sessionId, revieweeId, revieweeName });
    } catch (err) {
      setError("Could not mark session as complete");
      showToast("Could not mark session as complete", "error");
    }
  };

  const openGroupChat = async (sessionId) => {
    try {
      const { data } = await axios.post(`/api/group-chats/session/${sessionId}/create`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const chatId = data.chat?._id || data.chat?.id;
      if (chatId) navigate(`/group/${chatId}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Could not open group chat", "error");
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal.sessionId || !reviewData.rating) {
      setError("Please provide a rating");
      return;
    }
    try {
      await axios.post(
        `/api/reviews/${reviewModal.sessionId}`,
        { rating: reviewData.rating, comment: reviewData.comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviewModal({ open: false, sessionId: null, revieweeId: null, revieweeName: null });
      setReviewData({ rating: 5, comment: "" });
      
      // Refresh sessions
      const [requestsRes, teachingRes] = await Promise.all([
        axios.get("/api/sessions/my-requests", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("/api/sessions/my-teaching", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setMyRequests(requestsRes.data.requests || []);
      setMyTeaching(teachingRes.data.sessions || []);
    } catch (err) {
      setError("Could not submit review");
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintModal.tx) return;
    try {
      const proofUrls = complaintModal.proofUrls
        ? complaintModal.proofUrls.split("\n").map((u) => String(u).trim()).filter(Boolean)
        : [];
      await axios.post(
        "/api/complaints",
        {
          transactionId: complaintModal.tx._id,
          reason: complaintModal.reason || "No reason",
          proofUrls
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const walletRes = await axios.get("/api/transactions/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWallet(walletRes.data);
      setComplaintModal({ open: false, tx: null, role: null, reason: "", proofUrls: "" });
      setSelectedWalletTx(null);
      showToast("Complaint submitted", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Loading your SkillNexus...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border px-3 py-1.5 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button onClick={() => navigate("/requests")} className="glass-card p-5 text-left hover:bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl">📋</div>
          <p className="mt-2 text-lg font-semibold">Request Board</p>
          <p className="text-xs text-white/60">Post or browse learning requests</p>
        </button>
        <button onClick={() => navigate("/teach-board")} className="glass-card p-5 text-left hover:bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl">🧑‍🏫</div>
          <p className="mt-2 text-lg font-semibold">Teach Board</p>
          <p className="text-xs text-white/60">Offer teaching sessions</p>
        </button>
        <button onClick={() => navigate("/messages")} className="glass-card p-5 text-left hover:bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl">💬</div>
          <p className="mt-2 text-lg font-semibold">Messages</p>
          <p className="text-xs text-white/60">Chat with learners/teachers</p>
        </button>
        <button onClick={() => navigate("/wallet")} className="glass-card p-5 text-left hover:bg-white/5 rounded-xl border border-white/10">
          <div className="text-2xl">💼</div>
          <p className="mt-2 text-lg font-semibold">Wallet</p>
          <p className="text-xs text-white/60">Payments and payouts</p>
        </button>
      </section>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-nexus-900/50 via-purple-900/30 to-nexus-900/50 p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-nexus-300 font-medium">
              Welcome back to SkillNexus
            </p>
            <p className="mt-2 text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {user.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/me/profile")}
              className="rounded-xl border border-nexus-400/30 bg-nexus-500/20 px-4 py-2 text-xs font-medium text-nexus-200 hover:bg-nexus-500/30 transition-colors"
            >
              View my profile
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <DashboardToggle isTeacherMode={user.isTeacherMode} onToggle={handleToggle} isTeacherVerified={!!user.isTeacherVerified} />

      {(!user.isTeacherVerified || (user.skillsToTeach?.length > 0 && (!user.teacherCertificates?.length && !user.verificationPhotos?.length))) && (
        <div className="glass-card p-4 border-2 border-emerald-500/20">
          <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300 font-medium">Get verified</p>
          <p className="mt-1 text-xs theme-muted">Upload your ID/photo and certificates to get teacher verification. Admin will review.</p>
          <button type="button" onClick={() => navigate("/me/profile")} className="mt-2 rounded border border-emerald-400/50 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/20">Upload certificates →</button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200" role="alert">
          {error}
        </div>
      )}

      
      
      <section className="grid gap-4 pt-2 text-xs sm:grid-cols-2 sm:text-sm">
        {!user.isTeacherMode ? (
            <>
              <div className="glass-card p-5 rounded-xl border border-white/10 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-3 font-medium">
                  Friend requests
                </p>
                {friendRequests.length === 0 ? (
                  <p className="text-[12px] text-white/70">No pending requests.</p>
                ) : (
                  <div className="space-y-2">
                    {friendRequests.map((fr) => (
                      <div key={fr.fromUserId} className="flex items-center justify-between rounded border border-white/10 p-2">
                        <div className="flex items-center gap-2">
                          <img src={fr.profilePic || ""} alt="" onError={(e) => e.target.style.display = "none"} className="h-6 w-6 rounded object-cover" />
                          <button type="button" onClick={() => navigate(`/profile/${fr.fromUserId}`)} className="text-[12px] font-medium theme-primary hover:underline">{fr.name}</button>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={async () => { await axios.post(`/api/users/friends/${fr.fromUserId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } }); setFriendRequests((prev) => prev.filter((x) => x.fromUserId !== fr.fromUserId)); }} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">Accept</button>
                          <button type="button" onClick={async () => { await axios.post(`/api/users/friends/${fr.fromUserId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } }); setFriendRequests((prev) => prev.filter((x) => x.fromUserId !== fr.fromUserId)); }} className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            <div className="glass-card p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
                Learner · Create request
              </p>
              <form className="mt-3 space-y-2" onSubmit={handleCreateRequest}>
                <div>
                  <label className="text-[11px] text-white/70">What do you need help with?</label>
                  <input
                    type="text"
                    name="skillName"
                    value={newRequest.skillName}
                    onChange={handleRequestChange}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                    placeholder="e.g. React state, SQL joins, DSA..."
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-white/70">Extra details</label>
                  <textarea
                    name="details"
                    value={newRequest.details}
                    onChange={handleRequestChange}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                    placeholder="Describe your goal or current issue..."
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-[11px] text-white/70">
                    <input
                      type="checkbox"
                      name="isFree"
                      checked={newRequest.isFree}
                      onChange={handleRequestChange}
                    />
                    I&apos;m asking for free help
                  </label>
                  {!newRequest.isFree && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] theme-muted">{getCurrencyForCountry(user?.country).symbol}</span>
                      <input
                        type="number"
                        name="budget"
                        value={newRequest.budget}
                        onChange={handleRequestChange}
                        min={0}
                        className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                        placeholder="200"
                      />
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 p-2">
                  <label className="flex items-center gap-2 text-[11px] text-white/70">
                    <input
                      type="checkbox"
                      name="groupEnabled"
                      checked={newRequest.groupEnabled || false}
                      onChange={(e) => setNewRequest((p) => ({ ...p, groupEnabled: e.target.checked }))}
                    />
                    Study in group
                  </label>
                  {(newRequest.groupEnabled || false) && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] text-white/70">Add participant</label>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="email"
                            value={newRequest.groupEmailInput || ""}
                            onChange={(e) => setNewRequest((p) => ({ ...p, groupEmailInput: e.target.value }))}
                            placeholder="friend@example.com"
                            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const email = String(newRequest.groupEmailInput || "").trim();
                              if (!email) return;
                              const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
                              const addLocal = (exists, user) => {
                                setNewRequest((p) => ({
                                  ...p,
                                  groupEmailsList: [ ...(p.groupEmailsList || []), email ].slice(0, 10),
                                  groupEmailsInfo: [ ...(p.groupEmailsInfo || []), { email, exists: !!exists, name: user?.name || "", profilePic: user?.profilePic || "" } ].slice(0, 10),
                                  groupEmailInput: ""
                                }));
                              };
                              if (token) {
                                axios.get("/api/users/check-email", { params: { email } })
                                  .then((res) => addLocal(res.data.exists, res.data.user))
                                  .catch(() => addLocal(false, null));
                              } else {
                                addLocal(false, null);
                              }
                            }}
                            className="rounded-lg border border-white/20 px-3 py-1 text-[11px] hover:bg-white/10"
                          >
                            + Add
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(newRequest.groupEmailsList || []).map((em, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-2 py-0.5 text-[11px]">
                              {em}
                              {(() => {
                                const info = (newRequest.groupEmailsInfo || []).find((x) => x.email === em);
                                if (!info) return null;
                                return info.exists ? (
                                  <span className="rounded bg-emerald-600/30 px-1.5 py-0.5 text-[10px] text-emerald-200">Registered</span>
                                ) : (
                                  <span className="rounded bg-red-600/30 px-1.5 py-0.5 text-[10px] text-red-200">Not registered</span>
                                );
                              })()}
                              <button
                                type="button"
                                onClick={() => setNewRequest((p) => ({ ...p, groupEmailsList: (p.groupEmailsList || []).filter((e) => e !== em) }))}
                                className="rounded-full px-2 text-[11px] hover:bg-white/10"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                        <p className="mt-1 text-[10px] text-white/50">Max 10 participants.</p>
                      </div>
                      <div>
                        <label className="text-[11px] text-white/70">Payment split</label>
                        <div className="mt-1 flex gap-3 text-[11px]">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="splitMode"
                              value="single"
                              checked={newRequest.splitMode === "single"}
                              onChange={handleRequestChange}
                            />
                            Paid by self (you)
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="splitMode"
                              value="equal"
                              checked={newRequest.splitMode === "equal"}
                              onChange={handleRequestChange}
                            />
                            Split equally among invited learners
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={(newRequest.groupEnabled && (newRequest.groupEmailsInfo || []).some((i) => !i.exists))}
                  className="glass-button mt-2 w-full bg-gradient-to-r from-nexus-500 to-purple-500 py-1.5 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
                >
                  Post to request board
                </button>
              </form>
            </div>
            <div className="glass-card p-5 rounded-xl border border-white/10 shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-3 font-medium">
                Learner · My requests
              </p>
              {showGroupAddedBanner && (
                <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-[11px] text-emerald-200">
                  You have been added to a group session. Open the Accepted tab to view and chat.
                </div>
              )}
              {(() => {
                const pending = myRequests.filter((r) => r.status === "Pending");
                const accepted = myRequests.filter((r) => r.status === "Accepted");
                const completed = myRequests.filter((r) => r.status === "Completed");
                
                return (
                  <div className="space-y-4">
                    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-1">
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          onClick={() => setLearnerView("pending")}
                          className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "pending" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
                        >
                          Sent
                        </button>
                        <button
                          onClick={() => setLearnerView("accepted")}
                          className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "accepted" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
                        >
                          Accepted
                        </button>
                        <button
                          onClick={() => setLearnerView("completed")}
                          className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "completed" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setLearnerView("offers")}
                          className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "offers" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
                        >
                          Teacher offers
                        </button>
                      </div>
                    </div>
                    {(pending.length > 0) && learnerView === "pending" && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-300 mb-2">
                          📋 Sent ({pending.length})
                        </p>
                        <div className="space-y-2">
                          {pending.map((r) => (
                            <div key={r._id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                              <p className="text-[11px] font-semibold">{r.skillName}</p>
                              <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                                {r.details || "No details."}
                              </p>
                              <p className="mt-1 text-[11px] text-yellow-300">
                                Status: {r.status}
                                {r.teacherId?.name ? ` · Teacher: ${r.teacherId.name}` : ""}
                              </p>
                              {r.scheduledFor && (
                                <p className="mt-1 text-[11px] text-white/60">
                                  When:{" "}
                                  {new Date(r.scheduledFor).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                  })}
                                </p>
                              )}
                              {r.meetingLink && r.status !== "Completed" && (
                                <a
                                  href={r.meetingLink.startsWith("http") ? r.meetingLink : `https://${r.meetingLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 block text-[11px] text-nexus-200 underline hover:text-nexus-100"
                                >
                                  Join meeting →
                                </a>
                              )}
                              {(() => {
                                if (!(r.status === "Accepted" && !r.isFree && r.budget > 0)) return null;
                                const uid = user?._id;
                                const hasPaid = (r.paidMemberIds || []).some((pid) => String(pid) === String(uid));
                                const shouldShow =
                                  r.paymentSplitMode === "equal"
                                    ? !hasPaid
                                    : String(r.learnerId?._id || r.learnerId) === String(uid) && !r.paymentCompletedByLearner;
                                if (!shouldShow) return null;
                                return (
                                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px]">
                                  <p className="font-medium text-amber-200">Pay to SkillNexus (platform)</p>
                                  <>
                                  <div className="mt-1 text-white/70">
                                    <p>Pay to the company using the details below, then mark as paid.</p>
                                    <div className="mt-1 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPaymentDetailsModal({
                                          open: true,
                                          teacher: null,
                                          session: r,
                                          isPlatform: true
                                        })}
                                        className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200"
                                      >
                                        Pay now
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPaymentDetailsModal({
                                          open: true,
                                          teacher: null,
                                          session: r,
                                          isPlatform: true
                                        })}
                                        className="text-nexus-200 underline hover:text-nexus-100"
                                      >
                                        View company bank details & QR
                                      </button>
                                    </div>
                                  </div>
                                      <div className="mt-2 flex gap-2">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              await axios.post(
                                                `/api/sessions/${r._id}/payment-done`,
                                                {},
                                                { headers: { Authorization: `Bearer ${token}` } }
                                              );
                                              const [reqRes, walletRes] = await Promise.all([
                                                axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }),
                                                axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } })
                                              ]);
                                              setMyRequests(reqRes.data.requests || []);
                                              setWallet(walletRes.data);
                                              showToast("Payment recorded.", "success");
                                            } catch (err) {
                                              setError("Could not update payment status");
                                              showToast(err.response?.data?.message || "Could not record payment", "error");
                                            }
                                          }}
                                          className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
                                        >
                                          Mark as paid
                                        </button>
                                        <span className="text-white/50 text-[10px] self-center">or skip until you join</span>
                                      </div>
                                  </>
                                </div>
                                );
                              })()}
                              {r.teacherId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/chat/${r.teacherId._id || r.teacherId}`)
                                  }
                                  className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Chat with teacher
                                </button>
                              )}
                              {r.status === "Pending" && (
                                <div className="mt-2 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLearnerEditModal({ open: true, request: r, skillName: r.skillName || "", details: r.details || "", isFree: !!r.isFree, budget: String(r.budget || 0) })}
                                    className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLearnerDeleteModal({ open: true, requestId: r._id })}
                                    className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-red-300 hover:bg-red-500/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                              {r.status === "Accepted" && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteSession(
                                    r._id,
                                    r.teacherId?._id || r.teacherId,
                                    r.teacherId?.name || "Teacher"
                                  )}
                                  className="mt-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/30"
                                >
                                  Mark as Complete
                                </button>
                              )}
                              {r.status === "Accepted" && (r.groupMembers?.length || 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGroupChat(r._id)}
                                  className="mt-2 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Open group chat
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(accepted.length > 0) && learnerView === "accepted" && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-300 mb-2">
                          ✅ Accepted ({accepted.length})
                        </p>
                        <div className="space-y-2">
                          {accepted.map((r) => (
                            <div key={r._id} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2">
                              <p className="text-[11px] font-semibold">
                                {r.skillName}
                                {(() => {
                                  const totalParticipants = 1 + (r.groupMembers?.length || 0);
                                  const paidCount = (r.paidMemberIds?.length || 0);
                                  const unpaid = Math.max(0, totalParticipants - paidCount);
                                  return (r.paymentSplitMode === "equal" && unpaid > 0) ? (
                                    <span className="ml-2 rounded-full border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">
                                      Unpaid {unpaid}
                                    </span>
                                  ) : null;
                                })()}
                              </p>
                              <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                                {r.details || "No details."}
                              </p>
                              <p className="mt-1 text-[11px] text-blue-300">
                                Status: {r.status}
                                {r.teacherId?.name ? ` · Teacher: ${r.teacherId.name}` : ""}
                              </p>
                              {r.scheduledFor && (
                                <p className="mt-1 text-[11px] text-white/60">
                                  Scheduled:{" "}
                                  {new Date(r.scheduledFor).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                  })}
                                </p>
                              )}
                              {(r.groupMembers?.length || 0) > 0 && (
                                <div className="mt-1 text-[11px] theme-muted">
                                  <span className="mr-2">Participants:</span>
                                  <span className="inline-flex flex-wrap items-center gap-2">
                                    {[r.learnerId, ...(r.groupMembers || []).map((gm) => gm.userId || gm)].filter(Boolean).map((u, idx) => {
                                      const name = u?.name || (typeof u === "string" ? "" : "");
                                      const profilePic = u?.profilePic || "";
                                      return (
                                        <span key={idx} className="inline-flex items-center gap-1">
                                          <Avatar src={profilePic} name={name || "Member"} size="xs" />
                                          <span>{name || "Member"}</span>
                                        </span>
                                      );
                                    })}
                                  </span>
                                </div>
                              )}
                              {r.meetingLink && (
                                <a
                                  href={r.meetingLink.startsWith("http") ? r.meetingLink : `https://${r.meetingLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 block text-[11px] text-nexus-200 underline hover:text-nexus-100"
                                >
                                  Join meeting →
                                </a>
                              )}
                              {(() => {
                                if (!(r.status === "Accepted" && !r.isFree && r.budget > 0)) return null;
                                const uid = user?._id;
                                const hasPaid = (r.paidMemberIds || []).some((pid) => String(pid) === String(uid));
                                const shouldShow =
                                  r.paymentSplitMode === "equal"
                                    ? !hasPaid
                                    : String(r.learnerId?._id || r.learnerId) === String(uid) && !r.paymentCompletedByLearner;
                                if (!shouldShow) return null;
                                return (
                                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px]">
                                  <p className="font-medium text-amber-200">Pay to SkillNexus (platform)</p>
                                  <div className="mt-1 text-white/70">
                                    <p>Pay to the company using the details below, then mark as paid.</p>
                                    <div className="mt-1 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPaymentDetailsModal({
                                          open: true,
                                          teacher: null,
                                          session: r,
                                          isPlatform: true
                                        })}
                                        className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200"
                                      >
                                        Pay now
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPaymentDetailsModal({
                                          open: true,
                                          teacher: null,
                                          session: r,
                                          isPlatform: true
                                        })}
                                        className="text-nexus-200 underline hover:text-nexus-100"
                                      >
                                        View company bank details & QR
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <p className="mb-1 text-white/80">
                                      {(() => {
                                        const toCur = getCurrencyForCountry(user?.country).symbol;
                                        const fromCur = r.budgetCurrency || (getCurrencyForCountry(r.teacherId?.country).symbol);
                                        const totalParticipants = 1 + (r.groupMembers?.length || 0);
                                        const perShare = (r.budget || 0) / (r.paymentSplitMode === "equal" ? Math.max(1, totalParticipants) : 1);
                                        const amt = convertByCurrency(perShare, fromCur, toCur);
                                        return <>Amount to pay: {formatAmount(amt, user?.country)}</>;
                                      })()}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await axios.post(
                                            `/api/sessions/${r._id}/payment-done`,
                                            {},
                                            { headers: { Authorization: `Bearer ${token}` } }
                                          );
                                          const [reqRes, walletRes] = await Promise.all([
                                            axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }),
                                            axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } })
                                          ]);
                                          setMyRequests(reqRes.data.requests || []);
                                          setWallet(walletRes.data);
                                          showToast("Payment recorded.", "success");
                                        } catch (err) {
                                          setError("Could not update payment status");
                                          showToast(err.response?.data?.message || "Could not record payment", "error");
                                        }
                                      }}
                                      className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
                                    >
                                      Mark as paid
                                    </button>
                                  </div>
                                </div>
                                );
                              })()}
                              {(() => {
                                const requiresPayment = !r.isFree && r.budget > 0;
                                const totalParticipants = 1 + (r.groupMembers?.length || 0);
                                const paidCount = (r.paidMemberIds?.length || 0);
                                const groupPaid = r.paymentSplitMode === "equal" ? (paidCount >= totalParticipants) : !!r.paymentCompletedByLearner;
                                const canComplete = !requiresPayment || groupPaid;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (canComplete) {
                                        handleCompleteSession(
                                          r._id,
                                          r.teacherId?._id || r.teacherId,
                                          r.teacherId?.name || "Teacher"
                                        );
                                      } else {
                                        const outstanding = [
                                          r.learnerId,
                                          ...(r.groupMembers || []).map((gm) => ({ _id: gm.userId, name: gm.name, email: gm.email }))
                                        ].filter(Boolean).filter((p) => {
                                          const id = p?._id || p;
                                          return id && !(r.paidMemberIds || []).some((pid) => String(pid) === String(id));
                                        }).map((p) => p?.name || p?.email || "Member");
                                        showToast(`Cannot complete: ${outstanding.join(", ")} still need to pay.`, "error");
                                      }
                                    }}
                                    className={`mt-2 rounded-lg px-3 py-1 text-[11px] border ${canComplete ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30" : "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"}`}
                                  >
                                    {canComplete ? "Mark as Complete" : r.paymentSplitMode === "equal" ? `Waiting payments ${paidCount}/${totalParticipants}` : "Complete after payment"}
                                  </button>
                                );
                              })()}
                              {r.paymentSplitMode === "equal" && !r.isFree && r.budget > 0 && (
                                <div className="mt-2 text-[11px]">
                                  <p className="theme-muted">Remind unpaid participants</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {[r.learnerId, ...(r.groupMembers || []).map((gm) => ({ _id: gm.userId, name: gm.name, email: gm.email }))].filter(Boolean).map((p, idx) => {
                                      const id = p?._id || p;
                                      const name = p?.name || p?.email || "Member";
                                      const hasPaid = (r.paidMemberIds || []).some((pid) => String(pid) === String(id));
                                      if (!id || hasPaid) return null;
                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={async () => {
                                            try {
                                              await axios.post(`/api/sessions/${r._id}/remind/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                              showToast(`Reminder sent to ${name}`, "success");
                                            } catch (err) {
                                              showToast(err.response?.data?.message || "Could not send reminder", "error");
                                            }
                                          }}
                                          className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] hover:bg-white/10"
                                        >
                                          Message {name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const allIds = [r.learnerId, ...(r.groupMembers || []).map((gm) => gm.userId)].filter(Boolean);
                                          const unpaid = allIds.filter((id) => !(r.paidMemberIds || []).some((pid) => String(pid) === String(id)));
                                          await Promise.all(unpaid.map((id) => axios.post(`/api/sessions/${r._id}/remind/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } })));
                                          showToast("Reminders sent to all unpaid participants", "success");
                                        } catch (err) {
                                          showToast(err.response?.data?.message || "Could not send all reminders", "error");
                                        }
                                      }}
                                      className="rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200"
                                    >
                                      Remind all unpaid
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(completed.length > 0) && learnerView === "completed" && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-300 mb-2">
                          ✅ Completed ({completed.length})
                        </p>
                        <div className="space-y-2">
                          {completed.map((r) => (
                            <div key={r._id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                              <p className="text-[11px] font-semibold">{r.skillName}</p>
                              <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                                {r.details || "No details."}
                              </p>
                              <p className="mt-1 text-[11px] text-emerald-300">
                                Status: {r.status}
                                {r.teacherId?.name ? ` · Teacher: ${r.teacherId.name}` : ""}
                              </p>
                              {r.scheduledFor && (
                                <p className="mt-1 text-[11px] text-white/60">
                                  Completed:{" "}
                                  {new Date(r.scheduledFor).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                  })}
                                </p>
                              )}
                              {r.teacherId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/chat/${r.teacherId._id || r.teacherId}`)
                                  }
                                  className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Chat with teacher
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {learnerView === "offers" && (
                      <div>
                        <p className="text-xs font-semibold text-purple-300 mb-2">
                          🧑‍🏫 Teacher offers ({publicOffers.length})
                        </p>
                        <div className="space-y-2">
                          {publicOffers.map((o) => (
                            <div key={o._id} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2">
                              <p className="text-[11px] font-semibold">{o.skillName}</p>
                              <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                                {o.details || "No details."}
                              </p>
                              <p className="mt-1 text-[11px] text-purple-300">
                                Teacher: {o.teacherId?.name || "Unknown"}
                              </p>
                              <p className="mt-1 text-[11px] text-white/70">
                                {formatAmount(o.budget || 0, o.budgetCurrency || o.teacherId?.country)} · Your price:{" "}
                                {(() => {
                                  const toCur = getCurrencyForCountry(user?.country).symbol;
                                  const amt = convertByCurrency(o.budget || 0, (o.budgetCurrency || toCur), toCur);
                                  return formatAmount(amt, user?.country);
                                })()}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                      onClick={async () => {
                        const ccMap = {};
                        for (const m of (currencies.countryCurrency || [])) {
                          if (m.countryCode && m.currencyCode) ccMap[String(m.countryCode).toUpperCase()] = String(m.currencyCode).toUpperCase();
                        }
                        const rateFor = (code, kind) => {
                          const r = (currencies.currencyRates || []).find((x) => String(x.code || "").toUpperCase() === String(code || "").toUpperCase());
                          if (!r) return 1;
                          if (kind === "buy") return Number(r.buyToUSD ?? r.rateToUSD ?? 1) || 1;
                          return Number(r.sellToUSD ?? r.rateToUSD ?? 1) || 1;
                        };
                        const learnerCur = ccMap[String(user?.country || "").toUpperCase()] || "USD";
                        const offerCur = String(o.budgetCurrency || ccMap[String(o.teacherId?.country || "").toUpperCase()] || "USD").toUpperCase();
                        const payoutCur = ccMap[String(o.teacherId?.country || "").toUpperCase()] || "USD";
                        const buyOffer = rateFor(offerCur, "buy");
                        const sellLearner = rateFor(learnerCur, "sell");
                        const sellNPR = rateFor("NPR", "sell");
                        const buyNPR = rateFor("NPR", "buy");
                        const sellPayout = rateFor(payoutCur, "sell");
                        const totalUSD = (Number(o.budget || 0) || 0) * (buyOffer || 1);
                        const learnerPays = Math.round(((totalUSD / (sellLearner || 1)) || 0) * 100) / 100;
                        const nprAmount = Math.round(((totalUSD / (sellNPR || 1)) || 0) * 100) / 100;
                        const feePercent = Number(currencies.platformFeePercent || 10);
                        const feeNPR = Math.round(((nprAmount * feePercent) / 100) * 100) / 100;
                        const netNPR = Math.max(0, Math.round(((nprAmount - feeNPR) || 0) * 100) / 100);
                        const teacherReceives = Math.round(((netNPR * (buyNPR || 1) / (sellPayout || 1)) || 0) * 100) / 100;
                        setOfferPreview({ open: true, offer: o, payerCur: learnerCur, payoutCur, learnerPays, feeNPR, netNPR, teacherReceives });
                      }}
                                  className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
                                >
                                  Accept offer
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {pending.length === 0 && accepted.length === 0 && completed.length === 0 && (
                      <p className="text-[11px] text-white/70">
                        Once you post, your requests will show up here with their status.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <>
            <div className="glass-card p-5 rounded-xl border border-white/10 shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-3 font-medium">
                Teacher · My accepted sessions
              </p>
              {(() => {
                const [pending, completed] = [
                  myTeaching.filter((s) => s.status !== "Completed"),
                  myTeaching.filter((s) => s.status === "Completed")
                ];
                
                return (
                  <div className="space-y-4">
                    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-1">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => setTeacherView("active")}
                          className={`w-full rounded-lg px-3 py-2 text-[11px] ${teacherView === "active" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setTeacherView("completed")}
                          className={`w-full rounded-lg px-3 py-2 text-[11px] ${teacherView === "completed" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
                        >
                          Completed
                        </button>
                      </div>
                    </div>
                    {(pending.length > 0) && teacherView === "active" && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-300 mb-2">
                          📋 Active Sessions ({pending.length})
                        </p>
                        <div className="space-y-2">
                          {pending.map((s) => (
                            <div key={s._id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                              <p className="text-[11px] font-semibold">
                                {s.skillName}
                                {(() => {
                                  const total = 1 + (s.groupMembers?.length || 0);
                                  const paid = (s.paidMemberIds?.length || 0);
                                  const unpaid = Math.max(0, total - paid);
                                  return (s.paymentSplitMode === "equal" && unpaid > 0)
                                    ? (
                                      <span className="ml-2 rounded-full border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">
                                        Unpaid {unpaid}
                                      </span>
                                    )
                                    : null;
                                })()}
                              </p>
                              <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                                {s.details || "No details."}
                              </p>
                              <p className="mt-1 text-[11px] text-yellow-300">
                                Status: {s.status}
                                {s.learnerId?.name ? ` · Learner: ${s.learnerId.name}` : ""}
                              </p>
                              {(s.groupMembers?.length || 0) > 0 && (
                                <div className="mt-1 text-[11px] theme-muted">
                                  <span className="mr-2">Participants:</span>
                                  <span className="inline-flex flex-wrap items-center gap-2">
                                    {[s.learnerId, ...(s.groupMembers || []).map((gm) => gm.userId || gm)].filter(Boolean).map((u, idx) => {
                                      const name = u?.name || (typeof u === "string" ? "" : "");
                                      const profilePic = u?.profilePic || "";
                                      return (
                                        <span key={idx} className="inline-flex items-center gap-1">
                                          <Avatar src={profilePic} name={name || "Member"} size="xs" />
                                          <span>{name || "Member"}</span>
                                        </span>
                                      );
                                    })}
                                  </span>
                                  {(() => {
                                    const total = 1 + (s.groupMembers?.length || 0);
                                    const paid = (s.paidMemberIds?.length || 0);
                                    return (
                                      <span className="ml-2 text-yellow-300">
                                        Payment progress {paid}/{total}
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                              {s.status !== "Completed" && (s.groupMembers?.length || 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGroupChat(s._id)}
                                  className="mt-2 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Open group chat
                                </button>
                              )}
                              {s.scheduledFor && (
                                <p className="mt-1 text-[11px] text-white/60">
                                  Scheduled:{" "}
                                  {new Date(s.scheduledFor).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                  })}
                                </p>
                              )}
                              {s.meetingLink && s.status !== "Completed" && (
                                <a
                                  href={s.meetingLink.startsWith("http") ? s.meetingLink : `https://${s.meetingLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 block text-[11px] text-nexus-200 underline hover:text-nexus-100"
                                >
                                  Join meeting →
                                </a>
                              )}
                              {s.learnerId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/chat/${s.learnerId._id || s.learnerId}`)
                                  }
                                  className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Chat with learner
                                </button>
                              )}
                            {s.status === "Accepted" && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteSession(
                                    s._id,
                                    s.learnerId?._id || s.learnerId,
                                    s.learnerId?.name || "Learner"
                                  )}
                                  className="mt-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/30"
                                >
                                  Mark as Complete
                                </button>
                              )}
                              {s.status === "Accepted" && (
                                <button
                                  type="button"
                                  onClick={() => setMeetingModal({ open: true, sessionId: s._id, link: s.meetingLink || "", when: s.scheduledFor ? new Date(s.scheduledFor).toISOString().slice(0,16) : "" })}
                                  className="mt-2 rounded-lg border border-blue-400/50 bg-blue-500/20 px-3 py-1 text-[11px] text-blue-200 hover:bg-blue-500/30"
                                >
                                  {s.meetingLink || s.scheduledFor ? "Edit meeting details" : "Add meeting details"}
                                </button>
                              )}
                              {s.status === "Accepted" && !s.paymentCompletedByLearner && (
                                <button
                                  type="button"
                                  onClick={() => setTeacherPricingModal({ open: true, sessionId: s._id, isFree: !!s.isFree, budget: String(s.budget || 0) })}
                                  className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200 hover:bg-amber-500/30"
                                >
                                  Edit pricing
                                </button>
                              )}
                              {s.status === "Accepted" && (s.groupMembers?.length || 0) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGroupChat(s._id)}
                                  className="mt-2 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Open group chat
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(completed.length > 0) && teacherView === "completed" && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-300 mb-2">
                          ✅ Completed Sessions ({completed.length})
                        </p>
                        <div className="space-y-2">
                          {completed.map((s) => (
                            <div key={s._id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                              <p className="text-[11px] font-semibold">{s.skillName}</p>
                              <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                                {s.details || "No details."}
                              </p>
                              <p className="mt-1 text-[11px] text-emerald-300">
                                Status: {s.status}
                                {s.learnerId?.name ? ` · Learner: ${s.learnerId.name}` : ""}
                              </p>
                              {s.scheduledFor && (
                                <p className="mt-1 text-[11px] text-white/60">
                                  Completed:{" "}
                                  {new Date(s.scheduledFor).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short"
                                  })}
                                </p>
                              )}
                              {s.learnerId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/chat/${s.learnerId._id || s.learnerId}`)
                                  }
                                  className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                                >
                                  Chat with learner
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {pending.length === 0 && completed.length === 0 && (
                      <p className="text-[11px] text-white/70">
                        When you accept learner requests, they will appear here.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="glass-card p-4 border-2 border-amber-500/30 rounded-xl shadow-lg shadow-amber-500/5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200 font-medium">
                Teacher · Wallet & earnings
              </p>
              {(() => {
                const teacherCurrency = getCurrencyForCountry(user?.country).symbol;
                const totalNet = (wallet.asTeacher || []).reduce((s, t) => {
                  const amount = t.status === "paid_to_teacher" && typeof t.payoutAmount === "number"
                    ? t.payoutAmount
                    : convertByCurrency(t.teacherAmount || 0, t.payerCurrency || "USD", t.payoutCurrency || teacherCurrency);
                  return s + amount;
                }, 0);
                const totalFee = (wallet.asTeacher || []).reduce((s, t) => s + convertByCurrency(t.platformFeeAmount || 0, t.payerCurrency || "USD", t.payoutCurrency || teacherCurrency), 0);
                const pending = (wallet.asTeacher || []).filter((t) => t.status === "pending_payout");
                return (
                  <div className="mt-3 space-y-2">
                    <p className="text-lg font-bold text-amber-200">Net: {formatAmount(totalNet, user?.country)}</p>
                    <p className="text-[11px] text-white/50">Platform fee deducted: {formatAmount(totalFee, user?.country)}</p>
                    {(wallet.asTeacher || []).length === 0 ? (
                      <p className="text-[11px] text-white/60">No earnings yet.</p>
                    ) : (
                      <ul className="max-h-40 space-y-1 overflow-auto text-[11px]">
                        {(wallet.asTeacher || []).map((t) => {
                          const net = t.status === "paid_to_teacher" && typeof t.payoutAmount === "number"
                            ? t.payoutAmount
                            : convertByCurrency(t.teacherAmount || 0, t.payerCurrency || "USD", t.payoutCurrency || teacherCurrency);
                          return (
                            <li
                              key={t._id}
                              onClick={() => setSelectedWalletTx({ tx: t, role: "teacher" })}
                              className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 cursor-pointer hover:bg-white/5"
                            >
                              <div className="flex justify-between items-center">
                                <span>{t.skillName} · {t.learnerId?.name}</span>
                                <span className="text-amber-200">{formatAmount(net, user?.country)}</span>
                                <span className={`text-[10px] ${t.status === "paid_to_teacher" ? "text-emerald-400" : t.status === "reverted_to_learner" ? "text-slate-400" : "text-yellow-400"}`}>
                                  {t.status === "paid_to_teacher" ? "Paid" : t.status === "reverted_to_learner" ? "Reverted" : "Pending"}
                                </span>
                              </div>
                              <div className="mt-1 theme-muted">
                                <span className="mr-2">Paid: {t.amountPaid} {t.payerCurrency}</span>
                                <span className="mr-2">Fee: {t.platformFeePercent}% ({t.platformFeeAmount} {t.payerCurrency})</span>
                                <span className="mr-2">Net: {t.teacherAmount} {t.payerCurrency} → {t.payoutCurrency}</span>
                                {t.exchangeRate && <span className="mr-2">Rate {t.payerCurrency}→{t.payoutCurrency}: {t.exchangeRate}</span>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {(wallet.asTeacher || []).length > 0 && (
                      <p className="text-[10px] text-white/50">
                        Tip: Paid lines show final payout; others show expected net converted from payer currency.
                      </p>
                    )}
                    {pending.length > 0 && <p className="text-[10px] text-yellow-300">{pending.length} payout(s) pending from platform.</p>}
                  </div>
                );
              })()}
            </div>
          </>
        )}
      {offerPreview.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Payment preview</h3>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center"><span className="theme-muted">You pay</span><span className="font-semibold">{offerPreview.payerCur} {Number(offerPreview.learnerPays).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="theme-muted">Platform fee</span><span className="font-semibold">NPR {Number(offerPreview.feeNPR).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="theme-muted">Net in NPR</span><span className="font-semibold">NPR {Number(offerPreview.netNPR).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="theme-muted">Teacher receives</span><span className="font-semibold">{offerPreview.payoutCur} {Number(offerPreview.teacherReceives).toLocaleString()}</span></div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setOfferPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 })} className="rounded border px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  if (!offerPreview.offer) return;
                  try {
                    await axios.post(`/api/sessions/offers/${offerPreview.offer._id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    const reqRes = await axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } });
                    setMyRequests(reqRes.data.requests || []);
                    setPublicOffers((prev) => prev.filter((x) => x._id !== offerPreview.offer._id));
                    setOfferPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 });
                    showToast("Offer accepted.", "success");
                  } catch (err) {
                    showToast(err.response?.data?.message || "Could not accept offer", "error");
                  }
                }}
                className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
              >
                Confirm accept
              </button>
            </div>
          </div>
        </div>
      )}

        {!user.isTeacherMode && (
          <div className="glass-card p-6 border-2 border-blue-500/40 rounded-2xl shadow-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200 mb-2 font-semibold">
              Learner · Wallet
            </p>
            {(wallet.asLearner || []).length === 0 ? (
              <p className="text-sm text-white/70">No payments yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto text-sm">
                {(wallet.asLearner || []).map((t) => (
                  <li
                    key={t._id}
                    onClick={() => setSelectedWalletTx({ tx: t, role: "learner" })}
                    className="flex justify-between items-center rounded-xl border border-white/10 bg-black/20 px-3 py-2 cursor-pointer hover:bg-white/5"
                  >
                    <span>{t.skillName} · {t.teacherId?.name}</span>
                    <span className="text-emerald-200">{formatAmount(t.amountPaid || 0, user?.country)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Meeting details modal */}
      {meetingModal.open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setMeetingModal({ open: false, sessionId: null, link: "", when: "" })}>
          <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-blue-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-blue-200 mb-3">Meeting details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="theme-muted flex items-center gap-1"><span>🔗</span><span>Meeting link</span></label>
                <input value={meetingModal.link} onChange={(e) => setMeetingModal((m) => ({ ...m, link: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" placeholder="https://meet.example.com/abc" />
              </div>
              <div>
                <label className="theme-muted flex items-center gap-2"><span>📅</span><span>⏰</span><span>Date & time</span></label>
                <input
                  type="datetime-local"
                  value={meetingModal.when}
                  min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setMeetingModal((m) => ({ ...m, when: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await axios.put(`/api/sessions/${meetingModal.sessionId}/meeting`, { meetingLink: meetingModal.link, scheduledFor: meetingModal.when }, { headers: { Authorization: `Bearer ${token}` } });
                      const teachingRes = await axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } });
                      setMyTeaching(teachingRes.data.sessions || []);
                      setMeetingModal({ open: false, sessionId: null, link: "", when: "" });
                      showToast("Meeting updated", "success");
                    } catch (err) {
                      showToast(err.response?.data?.message || "Failed to update", "error");
                    }
                  }}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium"
                >
                  Save
                </button>
                <button type="button" onClick={() => setMeetingModal({ open: false, sessionId: null, link: "", when: "" })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher pricing modal */}
      {teacherPricingModal.open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setTeacherPricingModal({ open: false, sessionId: null, isFree: false, budget: "" })}>
          <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-amber-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-amber-200 mb-3">Edit pricing</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={teacherPricingModal.isFree} onChange={(e) => setTeacherPricingModal((m) => ({ ...m, isFree: e.target.checked }))} />
                <span>Free session</span>
              </label>
              {!teacherPricingModal.isFree && (
                <div>
                  <label className="theme-muted">Budget</label>
                  <input type="number" min={0} value={teacherPricingModal.budget} onChange={(e) => setTeacherPricingModal((m) => ({ ...m, budget: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" placeholder="200" />
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await axios.patch(`/api/sessions/${teacherPricingModal.sessionId}/pricing`, {
                        isFree: teacherPricingModal.isFree,
                        budget: teacherPricingModal.isFree ? 0 : Number(teacherPricingModal.budget || 0)
                      }, { headers: { Authorization: `Bearer ${token}` } });
                      const teachingRes = await axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } });
                      setMyTeaching(teachingRes.data.sessions || []);
                      setTeacherPricingModal({ open: false, sessionId: null, isFree: false, budget: "" });
                      showToast("Pricing updated", "success");
                    } catch (err) {
                      showToast(err.response?.data?.message || "Failed to update pricing", "error");
                    }
                  }}
                  className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-purple-500 px-4 py-2 text-sm font-medium"
                >
                  Save
                </button>
                <button type="button" onClick={() => setTeacherPricingModal({ open: false, sessionId: null, isFree: false, budget: "" })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit request modal */}
      {learnerEditModal.open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setLearnerEditModal({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" })}>
          <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-blue-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-blue-200 mb-3">Edit request</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="theme-muted">Skill</label>
                <input value={learnerEditModal.skillName} onChange={(e) => setLearnerEditModal((m) => ({ ...m, skillName: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" />
              </div>
              <div>
                <label className="theme-muted">Details</label>
                <textarea value={learnerEditModal.details} onChange={(e) => setLearnerEditModal((m) => ({ ...m, details: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" rows={3} />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={learnerEditModal.isFree} onChange={(e) => setLearnerEditModal((m) => ({ ...m, isFree: e.target.checked }))} />
                  <span className="text-xs">Free help</span>
                </label>
                {!learnerEditModal.isFree && (
                  <input type="number" min={0} value={learnerEditModal.budget} onChange={(e) => setLearnerEditModal((m) => ({ ...m, budget: e.target.value }))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none w-28" placeholder="200" />
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!learnerEditModal.request) return;
                    try {
                      await axios.put(`/api/sessions/requests/${learnerEditModal.request._id}`, {
                        skillName: learnerEditModal.skillName,
                        details: learnerEditModal.details,
                        isFree: learnerEditModal.isFree,
                        budget: learnerEditModal.isFree ? 0 : Number(learnerEditModal.budget || 0)
                      }, { headers: { Authorization: `Bearer ${token}` } });
                      const reqRes = await axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } });
                      setMyRequests(reqRes.data.requests || []);
                      setLearnerEditModal({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" });
                      showToast("Request updated", "success");
                    } catch (err) {
                      showToast(err.response?.data?.message || "Failed to update", "error");
                    }
                  }}
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium"
                >
                  Save
                </button>
                <button type="button" onClick={() => setLearnerEditModal({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete request modal */}
      {learnerDeleteModal.open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setLearnerDeleteModal({ open: false, requestId: null })}>
          <div className="modal-content w-full max-w-sm p-6 rounded-2xl border-2 border-red-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-red-200 mb-2">Delete request?</h3>
            <p className="text-sm text-white/70">This action cannot be undone.</p>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => setLearnerDeleteModal({ open: false, requestId: null })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  if (!learnerDeleteModal.requestId) return;
                  try {
                    await axios.delete(`/api/sessions/requests/${learnerDeleteModal.requestId}`, { headers: { Authorization: `Bearer ${token}` } });
                    setMyRequests((prev) => prev.filter((x) => x._id !== learnerDeleteModal.requestId));
                    setLearnerDeleteModal({ open: false, requestId: null });
                    showToast("Request deleted", "success");
                  } catch (err) {
                    showToast(err.response?.data?.message || "Failed to delete", "error");
                  }
                }}
                className="flex-1 rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm text-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet transaction detail modal */}
      {selectedWalletTx && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setSelectedWalletTx(null)}>
          <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-nexus-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold theme-accent">Transaction Details</h3>
              <button type="button" onClick={() => setSelectedWalletTx(null)} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 theme-primary">✕</button>
            </div>
            {selectedWalletTx.role === "learner" ? (
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Skill</span><span className="font-medium theme-primary">{selectedWalletTx.tx.skillName}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Teacher</span><span className="font-medium theme-primary">{selectedWalletTx.tx.teacherId?.name}</span></div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-2"><span className="theme-muted min-w-[120px]">Amount paid</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{formatAmount(selectedWalletTx.tx.amountPaid || 0, user?.country)}</span></div>
                <div className="flex justify-between text-[11px] theme-muted pt-1"><span>Date</span><span>{new Date(selectedWalletTx.tx.paidAt).toLocaleString()}</span></div>
                {selectedWalletTx.tx.status !== "paid_to_teacher" && selectedWalletTx.tx.status !== "reverted_to_learner" && (
                  <button type="button" onClick={() => setComplaintModal({ open: true, tx: selectedWalletTx.tx, role: "learner", reason: "", proofUrls: "" })} className="mt-3 rounded border border-amber-400/50 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">Raise complaint</button>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Skill</span><span className="font-medium theme-primary">{selectedWalletTx.tx.skillName}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Learner</span><span className="font-medium theme-primary">{selectedWalletTx.tx.learnerId?.name}</span></div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-2"><span className="theme-muted min-w-[120px]">Gross (learner paid)</span><span className="font-medium theme-primary">{formatAmount(selectedWalletTx.tx.amountPaid || 0, user?.country)}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Platform fee ({selectedWalletTx.tx.platformFeePercent}%)</span><span className="theme-accent">-{formatAmount(selectedWalletTx.tx.platformFeeAmount || 0, user?.country)}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Net (to you)</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{formatAmount(selectedWalletTx.tx.teacherAmount || 0, user?.country)}</span></div>
                {selectedWalletTx.tx.payoutAmount !== undefined && selectedWalletTx.tx.payoutAmount !== null && (
                  <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Payout amount</span><span className="font-semibold">{`${selectedWalletTx.tx.payoutCurrency || ""} ${Number(selectedWalletTx.tx.payoutAmount).toLocaleString()}`}</span></div>
                )}
                {selectedWalletTx.tx.exchangeRate && (
                  <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Exchange rate</span><span className="font-medium">{selectedWalletTx.tx.exchangeRate}</span></div>
                )}
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Payout status</span><span className={selectedWalletTx.tx.status === "paid_to_teacher" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{selectedWalletTx.tx.status === "paid_to_teacher" ? "Paid" : selectedWalletTx.tx.status === "complaint_raised" ? "Complaint" : selectedWalletTx.tx.status === "reverted_to_learner" ? "Reverted" : "Pending"}</span></div>
                <div className="flex justify-between text-[11px] theme-muted pt-1"><span>Date</span><span>{new Date(selectedWalletTx.tx.paidAt).toLocaleString()}</span></div>
                {selectedWalletTx.tx.status !== "paid_to_teacher" && selectedWalletTx.tx.status !== "reverted_to_learner" && (
                  <button type="button" onClick={() => setComplaintModal({ open: true, tx: selectedWalletTx.tx, role: "teacher", reason: "", proofUrls: "" })} className="mt-3 rounded border border-amber-400/50 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">Raise complaint</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raise complaint modal */}
      {complaintModal.open && complaintModal.tx && (
        <div className="modal-overlay fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="modal-content w-full max-w-md p-6 rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold theme-accent mb-3">Raise payment complaint</h3>
            <p className="text-sm theme-muted mb-3">Describe the issue. You can add proof URLs (one per line).</p>
            <label className="block text-sm font-medium theme-muted mb-1">Reason for complaint</label>
            <textarea value={complaintModal.reason} onChange={(e) => setComplaintModal((m) => ({ ...m, reason: e.target.value }))} className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-3" rows={3} placeholder="Describe the issue..." />
            <label className="block text-sm font-medium theme-muted mb-1">Proof (URL or upload)</label>
            <div className="mb-4">
              <ImageUriInput
                value={complaintModal.proofUrls}
                onChange={(v) => setComplaintModal((m) => ({ ...m, proofUrls: v }))}
                placeholder="Paste proof URL or upload images"
                label="Proof"
                multiple
                uploadType="proof"
              />
              <p className="mt-1 text-xs theme-muted">You can provide a link or upload a screenshot.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSubmitComplaint} className="flex-1 rounded border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-sm font-medium">Submit</button>
              <button type="button" onClick={() => setComplaintModal({ open: false, tx: null, role: null, reason: "", proofUrls: "" })} className="flex-1 rounded border border-slate-300 dark:border-white/20 px-3 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment details modal: company (platform) or teacher */}
      {paymentDetailsModal.open && (paymentDetailsModal.isPlatform ? platformPaymentDetails : paymentDetailsModal.teacher) && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="modal-content w-full max-w-lg max-h-[90vh] overflow-auto p-6 border-2 border-nexus-500/30 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-amber-200">
                {paymentDetailsModal.isPlatform ? "SkillNexus · Company payment details" : `Payment details · ${paymentDetailsModal.teacher?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentDetailsModal({ open: false, teacher: null, session: null, isPlatform: false })}
                className="rounded-full p-2 hover:bg-white/10 text-white/80 border border-white/20"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              {paymentDetailsModal.session && user && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
                  <p className="font-medium text-amber-200">
                    {(() => {
                      const session = paymentDetailsModal.session;
                      const totalParticipants = 1 + (session?.groupMembers?.length || 0);
                      const perShare = (session?.budget || 0) / (session?.paymentSplitMode === "equal" ? Math.max(1, totalParticipants) : 1);
                      const fromCur = session?.budgetCurrency || (getCurrencyForCountry(session?.teacherId?.country).symbol);
                      const amt = convertAmount(perShare, fromCur, user?.country);
                      return <>Amount to pay: {formatAmount(amt, user?.country)}</>;
                    })()}
                  </p>
                </div>
              )}
              {(paymentDetailsModal.isPlatform
                ? (platformPaymentDetails?.paymentDetails || [])
                : (paymentDetailsModal.teacher?.paymentDetails || [])
              ).map((pd, idx) => (
                <div key={idx} className="rounded-xl border border-white/15 bg-black/20 p-3 text-xs">
                  {(pd.bankName || pd.country) && (
                    <p className="font-medium text-white/90">
                      {[pd.bankName, pd.country].filter(Boolean).join(" · ")}
                      {pd.type && <span className="text-white/50 ml-1">({pd.type})</span>}
                    </p>
                  )}
                  {pd.bankDetails && (
                    <p className="mt-2 text-white/70 whitespace-pre-wrap">{pd.bankDetails}</p>
                  )}
                  {pd.qrCodeUrl && (
                    <div className="mt-3">
                      <p className="text-[11px] text-white/60 mb-1">Payment QR</p>
                      <img
                        src={pd.qrCodeUrl}
                        alt="Payment QR"
                        className="max-h-40 rounded border border-white/10 object-contain"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {((paymentDetailsModal.isPlatform && !platformPaymentDetails?.paymentDetails?.length) ||
                (!paymentDetailsModal.isPlatform && !paymentDetailsModal.teacher?.paymentDetails?.length)) && (
                <p className="text-white/50 text-sm">No payment details configured yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="modal-content w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Session Completed! Review {reviewModal.revieweeName}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70">Rating (1-5)</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating: star })}
                      className={`text-2xl ${
                        star <= reviewData.rating ? "text-yellow-400" : "text-white/30"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-white/70">Comment (optional)</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none"
                  rows="3"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReviewModal({ open: false, sessionId: null, revieweeId: null, revieweeName: null });
                    setReviewData({ rating: 5, comment: "" });
                  }}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  className="flex-1 rounded-lg bg-gradient-to-r from-nexus-500 to-purple-500 px-4 py-2 text-sm font-medium"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DashboardPage;

