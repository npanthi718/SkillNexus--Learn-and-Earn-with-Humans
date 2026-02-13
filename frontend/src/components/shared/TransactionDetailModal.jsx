import React from "react";

const TransactionDetailModal = ({ selectedWalletTx, setSelectedWalletTx, user, formatAmount, setComplaintModal }) => {
  if (!selectedWalletTx) return null;
  return (
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
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-3 mt-2"><span className="theme-muted min-w-[120px]">Teacher net</span><span className="font-semibold text-amber-600 dark:text-amber-300">{formatAmount(selectedWalletTx.tx.teacherAmount || 0, user?.country)}</span></div>
            <div className="flex justify-between text-[11px] theme-muted pt-1"><span>Paid by learner</span><span>{selectedWalletTx.tx.amountPaid} {selectedWalletTx.tx.payerCurrency}</span></div>
            <div className="flex justify-between text-[11px] theme-muted"><span>Platform fee</span><span>{selectedWalletTx.tx.platformFeeAmount} {selectedWalletTx.tx.payerCurrency}</span></div>
            <div className="flex justify-between text-[11px] theme-muted"><span>Status</span><span>{selectedWalletTx.tx.status}</span></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionDetailModal;
