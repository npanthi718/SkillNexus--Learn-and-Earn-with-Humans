import React from "react";

const AdminTransactionsTable = ({ earningsData, currencyRates }) => {
  const txs = earningsData?.transactions || [];
  if (txs.length === 0) return null;
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-2">Transactions · NPR summary</h3>
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="border-b border-white/10 px-2 py-2">Learner</th>
              <th className="border-b border-white/10 px-2 py-2">Teacher</th>
              <th className="border-b border-white/10 px-2 py-2">Skill</th>
              <th className="border-b border-white/10 px-2 py-2">Received (NPR)</th>
              <th className="border-b border-white/10 px-2 py-2">Fee (NPR)</th>
              <th className="border-b border-white/10 px-2 py-2">Net (NPR)</th>
              <th className="border-b border-white/10 px-2 py-2">Rate NPR→Payout</th>
              <th className="border-b border-white/10 px-2 py-2">Payout amount</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => {
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
              return (
                <tr key={t._id} className="border-b border-white/5">
                  <td className="px-2 py-2">{t.learnerId?.name || "—"}</td>
                  <td className="px-2 py-2">{t.teacherId?.name || "—"}</td>
                  <td className="px-2 py-2">{t.skillName || "—"}</td>
                  <td className="px-2 py-2">NPR {Number(t.amountPaidNPR || 0).toLocaleString()}</td>
                  <td className="px-2 py-2">NPR {Number(t.platformFeeAmountNPR || 0).toLocaleString()}</td>
                  <td className="px-2 py-2">NPR {Number(t.teacherAmountNPR || 0).toLocaleString()}</td>
                  <td className="px-2 py-2">{Number(rate || 0).toFixed(6)} · NPR→{payout}</td>
                  <td className="px-2 py-2">{payout} {Number(payoutAmt || 0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactionsTable;
