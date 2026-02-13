import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/Avatar.jsx";
import { formatAmount } from "../utils/currency.js";
import { useToast } from "../components/Toast.jsx";

const TeachOffersPage = ({ onRequireAuth }) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState("");
  const [form, setForm] = useState({ skillName: "", details: "", price: "" });
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
  const [meId, setMeId] = useState("");
  const [me, setMe] = useState(null);
  const { showToast } = useToast();
  const [editModal, setEditModal] = useState({ open: false, offer: null, skillName: "", details: "", price: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, offerId: null });
  const [currencies, setCurrencies] = useState({ currencyRates: [], countryCurrency: [] });
  const [preview, setPreview] = useState({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
      if (!token) {
        onRequireAuth && onRequireAuth("/teach-board");
        setOffers([]);
        setLoading(false);
        return;
      }
      const { data } = await axios.get("/api/sessions/offers", { params: { skill }, headers: { Authorization: `Bearer ${token}` } });
      setOffers(data.offers || []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill]);
  useEffect(() => {
    if (!token) return;
    axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setMeId(res.data.user?._id || "");
        setMe(res.data.user || null);
      })
      .catch(() => {
        setMeId("");
        setMe(null);
      });
    axios.get("/api/platform/currencies")
      .then((res) => setCurrencies({ currencyRates: res.data.currencyRates || [], countryCurrency: res.data.countryCurrency || [] }))
      .catch(() => setCurrencies({ currencyRates: [], countryCurrency: [] }));
  }, [token]);

  const createOffer = async (e) => {
    e.preventDefault();
    if (!token) { navigate("/auth"); return; }
    try {
      if (me && !me.isTeacherVerified) {
        showToast("Please get verified to post offers.", "error");
        return;
      }
      await axios.post("/api/sessions/offers", { ...form, price: Number(form.price || 0) }, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ skillName: "", details: "", price: "" });
      load();
    } catch {}
  };

  const acceptOffer = async (id, teacherId) => {
    if (!token) { navigate("/auth"); return; }
    if (meId && String(meId) === String(teacherId)) {
      showToast("You cannot accept your own offer", "error");
      return;
    }
    const offer = (offers || []).find((o) => o._id === id) || null;
    if (!offer || !me) { showToast("Offer not found", "error"); return; }
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
    const learnerCur = ccMap[String(me.country || "").toUpperCase()] || "USD";
    const offerCur = String(offer.budgetCurrency || ccMap[String(offer.teacherId?.country || "").toUpperCase()] || "USD").toUpperCase();
    const payoutCur = ccMap[String(offer.teacherId?.country || "").toUpperCase()] || "USD";
    const buyOffer = rateFor(offerCur, "buy");
    const sellLearner = rateFor(learnerCur, "sell");
    const sellNPR = rateFor("NPR", "sell");
    const buyNPR = rateFor("NPR", "buy");
    const sellPayout = rateFor(payoutCur, "sell");
    const totalUSD = (Number(offer.budget || 0) || 0) * (buyOffer || 1);
    const learnerPays = Math.round(((totalUSD / (sellLearner || 1)) || 0) * 100) / 100;
    const nprAmount = Math.round(((totalUSD / (sellNPR || 1)) || 0) * 100) / 100;
    const feePercent = Number((me.platformFeePercent ?? currencies.platformFeePercent) || 10);
    const feeNPR = Math.round(((nprAmount * feePercent) / 100) * 100) / 100;
    const netNPR = Math.max(0, Math.round(((nprAmount - feeNPR) || 0) * 100) / 100);
    const teacherReceives = Math.round(((netNPR * (buyNPR || 1) / (sellPayout || 1)) || 0) * 100) / 100;
    setPreview({ open: true, offer, payerCur: learnerCur, payoutCur, learnerPays, feeNPR, netNPR, teacherReceives });
  };
  const confirmAccept = async () => {
    if (!preview.offer) { setPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 }); return; }
    try {
      await axios.post(`/api/sessions/offers/${preview.offer._id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setOffers((prev) => prev.filter((o) => o._id !== preview.offer._id));
      setPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 });
      showToast("Offer accepted. Opening dashboard…", "success");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not accept offer", "error");
    }
  };
  const openEdit = (offer) => {
    setEditModal({
      open: true,
      offer,
      skillName: offer.skillName || "",
      details: offer.details || "",
      price: String(offer.budget || 0)
    });
  };
  const submitEdit = async (e) => {
    e.preventDefault();
    if (!token || !editModal.offer) { navigate("/auth"); return; }
    try {
      await axios.put(`/api/sessions/offers/${editModal.offer._id}`, {
        skillName: editModal.skillName,
        details: editModal.details,
        price: Number(editModal.price || 0)
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditModal({ open: false, offer: null, skillName: "", details: "", price: "" });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update offer", "error");
    }
  };
  const openDelete = (offerId) => setDeleteModal({ open: true, offerId });
  const submitDelete = async () => {
    if (!token || !deleteModal.offerId) { navigate("/auth"); return; }
    try {
      await axios.delete(`/api/sessions/offers/${deleteModal.offerId}`, { headers: { Authorization: `Bearer ${token}` } });
      setDeleteModal({ open: false, offerId: null });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || "Could not delete offer", "error");
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className={`text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Teach Board</h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`rounded-lg border px-3 py-1.5 text-xs ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}
        >
          ← Back
        </button>
      </div>
      {token && me && !me.isTeacherVerified && (
        <div className={`rounded-xl border px-3 py-2 text-xs ${isLight ? "border-amber-300 bg-amber-100 text-amber-700" : "border-amber-400/50 bg-amber-500/10 text-amber-200"}`}>
          Admin approval required to post offers. Please submit verification photos/certificates on your profile.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Teach board</p>
          <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Teachers posting offers</h2>
        </div>
        <input
          type="text"
          placeholder="Filter by skill..."
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
        />
      </div>

      <section className="grid gap-4 text-xs sm:text-sm">
        {(offers || []).length === 0 ? (
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>No offers yet.</p>
        ) : (
          offers.map((o) => (
            <article key={o._id} className="glass-card flex flex-col justify-between p-4">
              <div className="flex items-center gap-2">
                <Avatar src={o.teacherId?.profilePic} size="sm" />
                <div>
                  <p className="text-sm font-semibold theme-primary">{o.skillName}</p>
                  <p className="text-[11px] theme-muted">{o.teacherId?.name}</p>
                </div>
              </div>
              <p className="mt-2 text-sm">{o.details || "—"}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="theme-muted">{formatAmount(o.budget || 0, o.budgetCurrency || o.teacherId?.country)}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => acceptOffer(o._id, o.teacherId?._id || o.teacherId)} className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30">Accept offer</button>
                  {meId && String(meId) === String(o.teacherId?._id || o.teacherId) && o.status === "Offer" && (
                    <>
                      <button type="button" onClick={() => openEdit(o)} className="rounded-full border px-3 py-1 text-[11px] hover:bg-white/10">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(o._id)}
                        className="rounded-full border px-3 py-1 text-[11px] hover:bg-white/10 text-red-300"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-2">Post a teaching offer</h3>
        <form onSubmit={createOffer} className="grid sm:grid-cols-2 gap-2 text-xs">
          <div>
            <label className="theme-muted">Skill</label>
            <input type="text" value={form.skillName} onChange={(e) => setForm((p) => ({ ...p, skillName: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 outline-none" required />
          </div>
          <div>
            <label className="theme-muted">Price</label>
            <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="200" min={0} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 outline-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="theme-muted">Details</label>
            <textarea value={form.details} onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 outline-none" rows={3} />
          </div>
          {/* Currency is auto-selected from teacher country; no manual choice */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!!token && me && !me.isTeacherVerified}
              className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Post offer
            </button>
          </div>
        </form>
      </div>
      {preview.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Payment preview</h3>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center"><span className="theme-muted">You pay</span><span className="font-semibold">{preview.payerCur} {Number(preview.learnerPays).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="theme-muted">Platform fee</span><span className="font-semibold">NPR {Number(preview.feeNPR).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="theme-muted">Net in NPR</span><span className="font-semibold">NPR {Number(preview.netNPR).toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="theme-muted">Teacher receives</span><span className="font-semibold">{preview.payoutCur} {Number(preview.teacherReceives).toLocaleString()}</span></div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setPreview({ open: false, offer: null, payerCur: "USD", payoutCur: "USD", learnerPays: 0, feeNPR: 0, netNPR: 0, teacherReceives: 0 })} className="rounded border px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
              <button type="button" onClick={confirmAccept} className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30">Confirm accept</button>
            </div>
          </div>
        </div>
      )}
      {editModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Edit teaching offer</h3>
            <form onSubmit={submitEdit} className="mt-3 space-y-2">
              <div>
                <label className="text-[11px] text-white/70">Skill name</label>
                <input type="text" value={editModal.skillName} onChange={(e) => setEditModal((m) => ({ ...m, skillName: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 outline-none" required />
              </div>
              <div>
                <label className="text-[11px] text-white/70">Details</label>
                <textarea value={editModal.details} onChange={(e) => setEditModal((m) => ({ ...m, details: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 outline-none" rows={3} />
              </div>
              <div>
                <label className="text-[11px] text-white/70">Price</label>
                <input type="number" value={editModal.price} onChange={(e) => setEditModal((m) => ({ ...m, price: e.target.value }))} min={0} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1 outline-none" />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditModal({ open: false, offer: null, skillName: "", details: "", price: "" })} className="rounded border px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
                <button type="submit" className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm p-5 text-xs sm:text-sm">
            <h3 className="text-sm font-semibold">Delete offer?</h3>
            <p className="mt-1 text-white/70">This action cannot be undone.</p>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteModal({ open: false, offerId: null })} className="rounded border px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
              <button type="button" onClick={submitDelete} className="rounded border border-red-400/50 bg-red-500/20 px-3 py-1 text-[11px] text-red-200">Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TeachOffersPage;
