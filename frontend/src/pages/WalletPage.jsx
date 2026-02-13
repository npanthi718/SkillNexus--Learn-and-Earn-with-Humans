import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { formatAmount } from "../utils/currency.js";

const WalletPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ asLearner: [], asTeacher: [] });
  const [selectedWalletTx, setSelectedWalletTx] = useState(null);
  const [walletTab, setWalletTab] = useState("learner");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  useEffect(() => {
    const load = async () => {
      if (!token) { navigate("/auth"); return; }
      setLoading(true);
      try {
        const [meRes, walletRes] = await Promise.all([
          axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { asLearner: [], asTeacher: [] } }))
        ]);
        setUser(meRes.data.user || null);
        setWallet(walletRes.data || { asLearner: [], asTeacher: [] });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, navigate]);

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`rounded-lg border px-3 py-1.5 text-xs ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}
        >
          ← Back
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Wallet</p>
          <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>Your payments</h2>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setWalletTab("learner")} className={`rounded-full px-3 py-1 text-[11px] border ${walletTab === "learner" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/20"}`}>Learner Wallet</button>
          <button type="button" onClick={() => setWalletTab("teacher")} className={`rounded-full px-3 py-1 text-[11px] border ${walletTab === "teacher" ? "border-purple-400/60 bg-purple-500/20 text-purple-200" : "border-white/20"}`}>Teacher Wallet</button>
        </div>
      </div>
      {loading ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Loading wallet...</p>
      ) : (
        <>
          {walletTab === "learner" ? (
            <section className="glass-card p-5">
              <h3 className="text-sm font-semibold">Learner · Wallet</h3>
              <div className="mt-3 space-y-2">
                {(wallet.asLearner || []).length === 0 ? (
                  <p className="text-[12px] text-white/70">No payments yet.</p>
                ) : (
                  (wallet.asLearner || []).map((t) => (
                    <div key={t._id} className="flex items-center justify-between rounded border border-white/10 p-2">
                      <div>
                        <p className="text-[12px] font-medium theme-primary">{t.skillName}</p>
                        <p className="text-[11px] theme-muted">{new Date(t.paidAt).toLocaleString()}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedWalletTx({ tx: t, role: "learner" })} className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10">View</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : (
            <section className="glass-card p-5">
              <h3 className="text-sm font-semibold">Teacher · Wallet & earnings</h3>
              <div className="mt-3 space-y-2">
                {(wallet.asTeacher || []).length === 0 ? (
                  <p className="text-[12px] text-white/70">No earnings yet.</p>
                ) : (
                  (wallet.asTeacher || []).map((t) => (
                    <div key={t._id} className="rounded border border-white/10 p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[12px] font-medium theme-primary">{t.skillName}</p>
                          <p className="text-[11px] theme-muted">{new Date(t.paidAt).toLocaleString()}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedWalletTx({ tx: t, role: "teacher" })} className="rounded border border-white/15 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10">View</button>
                      </div>
                      <div className="mt-1 text-[11px] theme-muted">
                        <span className="mr-2">Paid: {t.amountPaid} {t.payerCurrency}</span>
                        <span className="mr-2">Platform fee: NPR {Number(t.platformFeeAmountNPR || 0).toLocaleString()} ({t.platformFeePercent}%)</span>
                        <span className="mr-2">Net to you: {t.payoutCurrency} {Number((typeof t.payoutAmount === "number" && t.payoutAmount > 0) ? t.payoutAmount : (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0 ? Math.round(((t.teacherAmountNPR || 0) * t.nprToPayoutRate) * 100) / 100 : t.teacherAmount)).toLocaleString()}</span>
                        {t.nprToPayoutRate && <span className="mr-2">Rate NPR→{t.payoutCurrency}: {t.nprToPayoutRate}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </>
      )}
      {selectedWalletTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setSelectedWalletTx(null)}>
          <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Transaction details</h3>
              <button type="button" onClick={() => setSelectedWalletTx(null)} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 theme-primary">✕</button>
            </div>
            {selectedWalletTx.role === "learner" ? (
              <>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Skill</span><span className="font-medium theme-primary">{selectedWalletTx.tx.skillName}</span></div>
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-2"><span className="theme-muted min-w-[120px]">Amount paid</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{formatAmount(selectedWalletTx.tx.amountPaid || 0, user?.country)}</span></div>
                <div className="flex justify-between text-[11px] theme-muted pt-1"><span>Date</span><span>{new Date(selectedWalletTx.tx.paidAt).toLocaleString()}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Skill</span><span className="font-medium theme-primary">{selectedWalletTx.tx.skillName}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Gross (learner paid)</span><span className="font-medium theme-primary">{selectedWalletTx.tx.amountPaid} {selectedWalletTx.tx.payerCurrency}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Platform fee ({selectedWalletTx.tx.platformFeePercent}%)</span><span className="theme-accent">NPR {Number(selectedWalletTx.tx.platformFeeAmountNPR || 0).toLocaleString()}</span></div>
                <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[120px]">Net (to you)</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{selectedWalletTx.tx.payoutCurrency} {Number((typeof selectedWalletTx.tx.payoutAmount === "number" && selectedWalletTx.tx.payoutAmount > 0) ? selectedWalletTx.tx.payoutAmount : (typeof selectedWalletTx.tx.nprToPayoutRate === "number" && selectedWalletTx.tx.nprToPayoutRate > 0 ? Math.round(((selectedWalletTx.tx.teacherAmountNPR || 0) * selectedWalletTx.tx.nprToPayoutRate) * 100) / 100 : selectedWalletTx.tx.teacherAmount)).toLocaleString()}</span></div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default WalletPage;
