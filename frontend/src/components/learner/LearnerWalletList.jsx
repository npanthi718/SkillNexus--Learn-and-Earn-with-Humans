import React from "react";

const LearnerWalletList = ({ items = [], onSelect, formatAmount, userCountry }) => {
  if (!items || items.length === 0) return <p className="text-sm text-white/70">No payments yet.</p>;
  return (
    <ul className="space-y-2 max-h-64 overflow-auto text-sm">
      {items.map((t) => (
        <li
          key={t._id}
          onClick={() => onSelect({ tx: t, role: "learner" })}
          className="flex justify-between items-center rounded-xl border border-white/10 bg-black/20 px-3 py-2 cursor-pointer hover:bg-white/5"
        >
          <span>{t.skillName} · {t.teacherId?.name}</span>
          <span className="text-emerald-200">{formatAmount(t.amountPaid || 0, userCountry)}</span>
        </li>
      ))}
    </ul>
  );
};

export default LearnerWalletList;
