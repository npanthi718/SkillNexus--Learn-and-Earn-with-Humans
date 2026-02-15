import React, { useEffect, useState, Suspense, lazy } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DashboardToggle from "../components/shared/DashboardToggle.jsx";
import { useToast } from "../components/shared/Toast.jsx";
import { formatAmount, getCurrencyForCountry, convertAmount } from "../utils/currency.js";
import ImageUriInput from "../components/shared/ImageUriInput.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import Loader from "../components/shared/Loader.jsx";
import VisibilityMount from "../components/shared/VisibilityMount.jsx";
import LearnerRequestsTabs from "../components/learner/LearnerRequestsTabs.jsx";
import TeacherWalletList from "../components/teacher/TeacherWalletList.jsx";
const LearnerWalletList = lazy(() => import("../components/learner/LearnerWalletList.jsx"));
import FriendRequestsCard from "../components/learner/FriendRequestsCard.jsx";
import LearnerCreateRequestForm from "../components/learner/LearnerCreateRequestForm.jsx";
const TeacherAcceptedSessions = lazy(() => import("../components/teacher/TeacherAcceptedSessions.jsx"));
const TeacherEarningsCard = lazy(() => import("../components/teacher/TeacherEarningsCard.jsx"));

const ComplaintModal = lazy(() => import("../components/shared/ComplaintModal.jsx"));
const PaymentDetailsModal = lazy(() => import("../components/shared/PaymentDetailsModal.jsx"));
const OfferPreviewModal = lazy(() => import("../components/shared/OfferPreviewModal.jsx"));
const MeetingDetailsModal = lazy(() => import("../components/shared/MeetingDetailsModal.jsx"));
const TeacherPricingModal = lazy(() => import("../components/teacher/TeacherPricingModal.jsx"));
const LearnerEditModal = lazy(() => import("../components/learner/LearnerEditModal.jsx"));
const LearnerDeleteModal = lazy(() => import("../components/learner/LearnerDeleteModal.jsx"));
const TransactionDetailModal = lazy(() => import("../components/shared/TransactionDetailModal.jsx"));

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

        const [requestsRes, teachingRes, walletRes, offersRes, notifRes] = await Promise.all([
          axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { requests: [] } })),
          axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { sessions: [] } })),
          axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { asLearner: [], asTeacher: [] } })),
          axios.get("/api/sessions/offers").catch(() => ({ data: { offers: [] } })),
          axios.get("/api/notifications", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { notifications: [] } }))
        ]);
        setMyRequests(requestsRes.data.requests || []);
        setMyTeaching(teachingRes.data.sessions || []);
        setWallet(walletRes.data);
        setPublicOffers(offersRes.data.offers || []);
        try {
          const curRes = await axios.get("/api/platform/currencies");
          setCurrencies({
            currencyRates: curRes.data.currencyRates || [],
            countryCurrency: curRes.data.countryCurrency || [],
            platformFeePercent: (curRes.data.platformFeePercent ?? 10)
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

  const openPaymentDetails = async (next) => {
    if (next?.isPlatform) {
      try {
        if (!platformPaymentDetails) {
          const { data } = await axios.get("/api/platform/payment-details");
          setPlatformPaymentDetails(data);
        }
      } catch {
        showToast("Company payment details not available", "error");
        return;
      }
    }
    setPaymentDetailsModal({ open: true, teacher: next?.teacher || null, session: next?.session || null, isPlatform: !!next?.isPlatform });
  };

  useEffect(() => {
    const refreshSessions = async () => {
      try {
        const [requestsRes, teachingRes] = await Promise.all([
          axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { requests: [] } })),
          axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { sessions: [] } }))
        ]);
        setMyRequests(requestsRes.data.requests || []);
        setMyTeaching(teachingRes.data.sessions || []);
      } catch {}
    };
    const refreshWallet = async () => {
      try {
        const walletRes = await axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { asLearner: [], asTeacher: [] } }));
        setWallet(walletRes.data);
      } catch {}
    };
    const sessionsHandler = () => refreshSessions();
    const walletHandler = () => refreshWallet();
    if (typeof window !== "undefined") {
      window.addEventListener("sn:sessions:refresh", sessionsHandler);
      window.addEventListener("sn:wallet:refresh", walletHandler);
      window.addEventListener("sn:notifications:refresh", sessionsHandler);
      const onFocus = () => { refreshSessions(); refreshWallet(); };
      const onVis = () => { if (document.visibilityState === "visible") { refreshSessions(); refreshWallet(); } };
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVis);
      return () => {
        window.removeEventListener("sn:sessions:refresh", sessionsHandler);
        window.removeEventListener("sn:wallet:refresh", walletHandler);
        window.removeEventListener("sn:notifications:refresh", sessionsHandler);
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVis);
      };
    }
    return () => {};
  }, [token]);

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
      try { if (typeof window !== "undefined") window.dispatchEvent(new Event("sn:sessions:refresh")); } catch {}
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
      try { if (typeof window !== "undefined") window.dispatchEvent(new Event("sn:sessions:refresh")); } catch {}
    } catch (err) {
      const msg = err.response?.data?.message || "Could not mark session as complete";
      setError(msg);
      showToast(msg, "error");
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
      <VisibilityMount placeholder={<Loader size="xs" />}>
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
      </VisibilityMount>
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
              <VisibilityMount placeholder={<Loader size="xs" />}>
                <FriendRequestsCard friendRequests={friendRequests} setFriendRequests={setFriendRequests} navigate={navigate} token={token} />
              </VisibilityMount>
              <VisibilityMount placeholder={<Loader size="xs" />}>
                <LearnerCreateRequestForm newRequest={newRequest} handleRequestChange={handleRequestChange} setNewRequest={setNewRequest} user={user} />
              </VisibilityMount>
            <LearnerRequestsTabs
              myRequests={myRequests}
              learnerView={learnerView}
              setLearnerView={setLearnerView}
              publicOffers={publicOffers}
              showGroupAddedBanner={showGroupAddedBanner}
              user={user}
              token={token}
              currencies={currencies}
              navigate={navigate}
              setPaymentDetailsModal={openPaymentDetails}
              setMyRequests={setMyRequests}
              setWallet={setWallet}
              showToast={showToast}
              setError={setError}
              openGroupChat={openGroupChat}
              handleCompleteSession={handleCompleteSession}
              setLearnerEditModal={setLearnerEditModal}
              setLearnerDeleteModal={setLearnerDeleteModal}
              setOfferPreview={setOfferPreview}
              formatAmount={formatAmount}
              convertByCurrency={(amt, from, to) => convertAmount(amt, from, to, currencies.currencyRates)}
            />
          </>
        ) : (
          <VisibilityMount placeholder={<Loader size="xs" />}>
            <Suspense fallback={<Loader size="xs" />}>
              <TeacherAcceptedSessions myTeaching={myTeaching} teacherView={teacherView} setTeacherView={setTeacherView} navigate={navigate} openGroupChat={openGroupChat} handleCompleteSession={handleCompleteSession} setMeetingModal={setMeetingModal} setTeacherPricingModal={setTeacherPricingModal} />
              <TeacherEarningsCard wallet={wallet} user={user} formatAmount={formatAmount} convertByCurrency={convertByCurrency} setSelectedWalletTx={setSelectedWalletTx} />
            </Suspense>
          </VisibilityMount>
        )}
      <VisibilityMount placeholder={<Loader size="xs" />}>
        <Suspense fallback={<Loader size="xs" />}>
          <OfferPreviewModal
          offerPreview={offerPreview}
          onCancel={() =>
            setOfferPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 })
          }
          onConfirm={async () => {
            if (!offerPreview.offer) return;
            try {
              await axios.post(`/api/sessions/offers/${offerPreview.offer._id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
              const reqRes = await axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } });
              setMyRequests(reqRes.data.requests || []);
              setPublicOffers((prev) => prev.filter((x) => x._id !== offerPreview.offer._id));
              setOfferPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 });
              showToast("Offer accepted.", "success");
              try {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("sn:sessions:refresh"));
                }
              } catch {}
            } catch (err) {
              showToast(err.response?.data?.message || "Could not accept offer", "error");
            }
          }}
          />
        </Suspense>
      </VisibilityMount>

        {!user.isTeacherMode && (
          <div className="glass-card p-6 border-2 border-blue-500/40 rounded-2xl shadow-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-200 mb-2 font-semibold">
              Learner · Wallet
            </p>
            <VisibilityMount placeholder={<Loader size="xs" />}>
              <LearnerWalletList
                items={wallet.asLearner || []}
                onSelect={(v) => setSelectedWalletTx(v)}
                formatAmount={formatAmount}
                userCountry={user?.country}
              />
            </VisibilityMount>
          </div>
        )}
      </section>

      <Suspense fallback={<Loader size="xs" />}>
      <MeetingDetailsModal
        meetingModal={meetingModal}
        setMeetingModal={setMeetingModal}
        token={token}
        onSaved={async () => {
          const teachingRes = await axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } });
          setMyTeaching(teachingRes.data.sessions || []);
          try { if (typeof window !== "undefined") window.dispatchEvent(new Event("sn:sessions:refresh")); } catch {}
        }}
        showToast={showToast}
      />
      </Suspense>

      <Suspense fallback={<Loader size="xs" />}>
      <TeacherPricingModal
        teacherPricingModal={teacherPricingModal}
        setTeacherPricingModal={setTeacherPricingModal}
        token={token}
        onSaved={async () => {
          const teachingRes = await axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } });
          setMyTeaching(teachingRes.data.sessions || []);
          try { if (typeof window !== "undefined") window.dispatchEvent(new Event("sn:sessions:refresh")); } catch {}
        }}
        showToast={showToast}
      />
      </Suspense>

      <Suspense fallback={<Loader size="xs" />}>
      <LearnerEditModal
        learnerEditModal={learnerEditModal}
        setLearnerEditModal={setLearnerEditModal}
        token={token}
        onSaved={async () => {
          const reqRes = await axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } });
          setMyRequests(reqRes.data.requests || []);
          try { if (typeof window !== "undefined") window.dispatchEvent(new Event("sn:sessions:refresh")); } catch {}
        }}
        showToast={showToast}
      />
      </Suspense>

      <Suspense fallback={<Loader size="xs" />}>
      <LearnerDeleteModal
        learnerDeleteModal={learnerDeleteModal}
        setLearnerDeleteModal={setLearnerDeleteModal}
        token={token}
        onDeleted={(id) => {
          setMyRequests((prev) => prev.filter((x) => x._id !== id));
          try { if (typeof window !== "undefined") window.dispatchEvent(new Event("sn:sessions:refresh")); } catch {}
        }}
        showToast={showToast}
      />
      </Suspense>

      <Suspense fallback={<Loader size="xs" />}>
      <TransactionDetailModal
        selectedWalletTx={selectedWalletTx}
        setSelectedWalletTx={setSelectedWalletTx}
        user={user}
        formatAmount={formatAmount}
        setComplaintModal={setComplaintModal}
      />
      </Suspense>

      <Suspense fallback={<Loader size="xs" />}>
      <ComplaintModal
        complaintModal={complaintModal}
        setComplaintModal={setComplaintModal}
        handleSubmitComplaint={handleSubmitComplaint}
        ImageUriInput={ImageUriInput}
      />
      </Suspense>

      <Suspense fallback={<div className="text-xs text-white/60">Loading...</div>}>
      <PaymentDetailsModal
        paymentDetailsModal={paymentDetailsModal}
        setPaymentDetailsModal={setPaymentDetailsModal}
        platformPaymentDetails={platformPaymentDetails}
        user={user}
        formatAmount={formatAmount}
        convertByCurrency={(amt, from, to) => convertAmount(amt, from, to, currencies.currencyRates)}
      />
      </Suspense>

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

