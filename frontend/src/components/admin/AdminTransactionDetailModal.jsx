import React from "react";
import ModalShell from "../shared/ModalShell.jsx";
import PayoutForm from "./PayoutForm.jsx";

const AdminTransactionDetailModal = ({
  open,
  onClose,
  transaction,
  authHeaders,
  platformConfig,
  setTransactions,
  setSelectedTransactionDetail,
  setComplaints,
  setRevertModal,
  setResolveReassignModal,
  complaints
}) => {
  if (!transaction) return null;
  const t = transaction;
  const payout = String(t.payoutCurrency || "USD").toUpperCase();
  const buyNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
  const sellPayout = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
  const rate = (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0)
    ? t.nprToPayoutRate
    : (sellPayout ? (Number(buyNPR || 1) / Number(sellPayout || 1)) : 0);
  const effective = Math.round((((t.teacherAmountNPR || 0) * (rate || 0)) || 0) * 100) / 100;
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      contentClass="border-2 border-amber-500/30 shadow-2xl max-h-[90vh] overflow-auto"
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold theme-accent">Transaction Details</h3>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 theme-primary">✕</button>
      </div>
      <div className="space-y-3.5 text-sm">
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Learner</span><span className="font-medium theme-primary">{t.learnerId?.name || "—"}</span></div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Teacher</span><span className="font-medium theme-primary">{t.teacherId?.name || "—"}</span></div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Skill</span><span className="font-medium theme-primary">{t.skillName}</span></div>
        <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-2"><span className="theme-muted min-w-[140px]">Amount paid (by learner)</span><span className="font-semibold theme-primary">{t.amountPaid} {t.payerCurrency || "USD"}</span></div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Platform fee ({t.platformFeePercent}%)</span><span className="font-semibold theme-accent">NPR {Number(t.platformFeeAmountNPR || 0).toLocaleString()}</span></div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">To teacher</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{`${payout} ${Number(effective).toLocaleString()}`}</span></div>
        <div className="flex justify-between items-center py-1">
          <span className="theme-muted min-w-[140px]">Conversion</span>
          <span className="font-medium theme-primary">
            {(() => {
              const payer = String(t.payerCurrency || "USD").toUpperCase();
              const buy = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payer)?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payer)?.rateToUSD ?? 1;
              const sellNPR = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
              const buyNPRLocal = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
              const sellPayoutLocal = (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ?? (platformConfig?.currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
              const payerToUSD = Number(buy || 1);
              const USDToNPR = sellNPR > 0 ? Number(1 / sellNPR) : 0;
              const NPRToPayout = sellPayoutLocal > 0 ? Number(buyNPRLocal / sellPayoutLocal) : 0;
              return `${payer}→USD ${payerToUSD} · USD→NPR ${USDToNPR.toFixed(4)} · NPR→${payout} ${Number(NPRToPayout || 0).toFixed(4)}`;
            })()}
          </span>
        </div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Learner currency</span><span className="font-medium theme-primary">{t.payerCurrency || "USD"}</span></div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Teacher currency</span><span className="font-medium theme-primary">{t.payoutCurrency || "USD"}</span></div>
        <div className="flex justify-between items-center py-1"><span className="theme-muted min-w-[140px]">Status</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${t.status === "paid_to_teacher" ? "status-paid" : t.status === "reverted_to_learner" ? "status-reverted" : t.status === "complaint_raised" ? "status-complaint" : "status-pending"}`}>{t.status === "paid_to_teacher" ? "Paid to teacher" : t.status === "reverted_to_learner" ? "Reverted to learner" : t.status === "complaint_raised" ? "Complaint raised" : "Pending payout"}</span></div>
        <div className="flex justify-between text-[11px] theme-muted pt-1"><span>Paid at</span><span>{new Date(t.paidAt).toLocaleString()}</span></div>
        {t.paidToTeacherAt && <div className="flex justify-between text-[11px] theme-muted"><span>Paid to teacher at</span><span>{new Date(t.paidToTeacherAt).toLocaleString()}</span></div>}
        {t.revertedAt && <div className="flex justify-between text-[11px] theme-muted"><span>Reverted at</span><span>{new Date(t.revertedAt).toLocaleString()}</span></div>}
        {(t.status === "pending_payout" || t.status === "complaint_raised") && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            {t.status === "pending_payout" && (
              <PayoutForm
                transaction={t}
                authHeaders={authHeaders}
                currencyRates={platformConfig?.currencyRates || []}
                onUpdated={(tx) => {
                  setTransactions((prev) => prev.map((x) => x._id === tx._id ? tx : x));
                  setSelectedTransactionDetail(tx);
                }}
              />
            )}
            <button type="button" onClick={() => { setRevertModal({ open: true, tx: t, deductionAmount: 0 }); }} className="rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200">Revert to learner</button>
            {complaints.filter((c) => c.transaction?._id === t._id).length > 0 && (
              <button type="button" onClick={() => { const comp = complaints.find((c) => c.transaction?._id === t._id); if (comp) setResolveReassignModal({ open: true, complaint: comp, meetingLink: "" }); }} className="rounded border border-nexus-400/50 bg-nexus-500/20 px-3 py-1.5 text-xs font-medium text-nexus-200">Resolve & pay teacher</button>
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
};

export default AdminTransactionDetailModal;
