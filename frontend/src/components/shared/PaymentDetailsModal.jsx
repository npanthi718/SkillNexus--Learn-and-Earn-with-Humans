import React from "react";
import ModalShell from "../shared/ModalShell.jsx";
import { getCurrencyForCountry } from "../../utils/currency.js";

const PaymentDetailsModal = ({
  paymentDetailsModal,
  setPaymentDetailsModal,
  platformPaymentDetails,
  user,
  formatAmount,
  convertByCurrency
}) => {
  const session = paymentDetailsModal.session;
  const teacher = paymentDetailsModal.teacher;
  const isPlatform = paymentDetailsModal.isPlatform;
  const details = isPlatform ? (platformPaymentDetails?.paymentDetails || []) : (teacher?.paymentDetails || []);
  return (
    <ModalShell
      open={paymentDetailsModal.open && (isPlatform ? platformPaymentDetails : teacher)}
      onClose={() => setPaymentDetailsModal({ open: false, teacher: null, session: null, isPlatform: false })}
      contentClass="border-2 border-nexus-500/30 max-w-lg max-h-[90vh] overflow-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-amber-200">
          {isPlatform ? "SkillNexus · Company payment details" : `Payment details · ${teacher?.name}`}
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
        {session && user && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium text-amber-200">
              {(() => {
                const totalParticipants = 1 + (session?.groupMembers?.length || 0);
                const perShare = (session?.budget || 0) / (session?.paymentSplitMode === "equal" ? Math.max(1, totalParticipants) : 1);
                if (session?.isFree || !(session?.budget > 0)) {
                  return <>Amount to pay: {formatAmount(0, user?.country)} (Free)</>;
                }
                const fromCur = String(session?.budgetCurrency || getCurrencyForCountry(session?.teacherId?.country).symbol).toUpperCase();
                const toCur = getCurrencyForCountry(user?.country).symbol;
                const amt = convertByCurrency(perShare, fromCur, toCur);
                return <>Amount to pay: {formatAmount(amt, user?.country)}</>;
              })()}
            </p>
          </div>
        )}
        {details.map((pd, idx) => (
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
      </div>
    </ModalShell>
  );
};

export default PaymentDetailsModal;
