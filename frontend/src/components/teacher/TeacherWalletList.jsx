import React from "react";

const TeacherWalletList = ({ items = [], onSelect, formatAmount, convertByCurrency, userCountry }) => {
  if (!items || items.length === 0) return <p className="text-sm text-white/70">No payouts yet.</p>;
  return (
    <ul className="max-h-40 space-y-1 overflow-auto text-[11px]">
      {items.map((t) => {
        const net =
          t.status === "paid_to_teacher" && typeof t.payoutAmount === "number"
            ? t.payoutAmount
            : convertByCurrency(t.teacherAmount || 0, t.payerCurrency || "USD", t.payoutCurrency || "USD");
        return (
          <li
            key={t._id}
            onClick={() => onSelect({ tx: t, role: "teacher" })}
            className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 cursor-pointer hover:bg-white/5"
          >
            <div className="flex justify-between items-center">
              <span>{t.skillName} · {t.learnerId?.name}</span>
              <span className="text-amber-200">{formatAmount(net, userCountry)}</span>
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
  );
};

export default TeacherWalletList;
