import React from "react";
import ResponsiveTableCards from "../shared/ResponsiveTableCards.jsx";

const AdminTransactionsTable = ({ earningsData, currencyRates }) => {
  const txs = earningsData?.transactions || [];
  if (txs.length === 0) return null;
  const headers = [
    { key: "learner", label: "Learner" },
    { key: "teacher", label: "Teacher" },
    { key: "skill", label: "Skill" },
    { key: "recv", label: "Received (NPR)" },
    { key: "fee", label: "Fee (NPR)" },
    { key: "net", label: "Net (NPR)" },
    { key: "rate", label: "Rate NPR→Payout" },
    { key: "payout", label: "Payout amount" }
  ];
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-2">Transactions · NPR summary</h3>
      <ResponsiveTableCards
        title="Transactions"
        headers={headers}
        rows={txs}
        renderCell={(h, t) => {
          const payout = String(t.payoutCurrency || "USD").toUpperCase();
          const buyNPR = (currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.buyToUSD ??
            (currencyRates || []).find((r) => String(r.code || "").toUpperCase() === "NPR")?.rateToUSD ?? 1;
          const sellPayout = (currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.sellToUSD ??
            (currencyRates || []).find((r) => String(r.code || "").toUpperCase() === payout)?.rateToUSD ?? 1;
          const rate = (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0)
            ? t.nprToPayoutRate
            : (sellPayout ? (Number(buyNPR || 1) / Number(sellPayout || 1)) : 0);
          const payoutAmt = (typeof t.payoutAmount === "number" && t.payoutAmount > 0)
            ? t.payoutAmount
            : Math.round((((t.teacherAmountNPR || 0) * (rate || 0)) || 0) * 100) / 100;
          if (h.key === "learner") return t.learnerId?.name || "—";
          if (h.key === "teacher") return t.teacherId?.name || "—";
          if (h.key === "skill") return t.skillName || "—";
          if (h.key === "recv") return `NPR ${Number(t.amountPaidNPR || 0).toLocaleString()}`;
          if (h.key === "fee") return `NPR ${Number(t.platformFeeAmountNPR || 0).toLocaleString()}`;
          if (h.key === "net") return `NPR ${Number(t.teacherAmountNPR || 0).toLocaleString()}`;
          if (h.key === "rate") return `${Number(rate || 0).toFixed(6)} · NPR→${payout}`;
          if (h.key === "payout") return `${payout} ${Number(payoutAmt || 0).toLocaleString()}`;
          return "";
        }}
      />
    </div>
  );
};

export default AdminTransactionsTable;
