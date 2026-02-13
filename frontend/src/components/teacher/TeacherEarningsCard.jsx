import React from "react";
import TeacherWalletList from "./TeacherWalletList.jsx";
import { getCurrencyForCountry } from "../../utils/currency.js";

const TeacherEarningsCard = ({ wallet, user, formatAmount, convertByCurrency, setSelectedWalletTx }) => {
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
    <div className="glass-card p-4 border-2 border-amber-500/30 rounded-xl shadow-lg shadow-amber-500/5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200 font-medium">
        Teacher · Wallet & earnings
      </p>
      <div className="mt-3 space-y-2">
        <p className="text-lg font-bold text-amber-200">Net: {formatAmount(totalNet, user?.country)}</p>
        <p className="text-[11px] text-white/50">Platform fee deducted: {formatAmount(totalFee, user?.country)}</p>
        {(wallet.asTeacher || []).length === 0 ? (
          <p className="text-[11px] text-white/60">No earnings yet.</p>
        ) : (
          <TeacherWalletList
            items={wallet.asTeacher || []}
            onSelect={(v) => setSelectedWalletTx(v)}
            formatAmount={formatAmount}
            convertByCurrency={convertByCurrency}
            userCountry={user?.country}
          />
        )}
        {(wallet.asTeacher || []).length > 0 && (
          <p className="text-[10px] text-white/50">
            Tip: Paid lines show final payout; others show expected net converted from payer currency.
          </p>
        )}
        {pending.length > 0 && <p className="text-[10px] text-yellow-300">{pending.length} payout(s) pending from platform.</p>}
      </div>
    </div>
  );
};

export default TeacherEarningsCard;
