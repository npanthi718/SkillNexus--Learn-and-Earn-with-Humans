import React from "react";

const EarningsNPRReportCards = ({ earningsData, reportingCurrency, currencyRates }) => {
  const rateMap = {};
  (currencyRates || []).forEach((r) => {
    const code = String(r.code || "USD").toUpperCase();
    const rate = Number(r.rateToUSD ?? r.buyToUSD ?? 1) || 1;
    rateMap[code] = rate;
  });
  const report = String(reportingCurrency || "NPR").toUpperCase();
  const toReport = (code, amount) => {
    const src = String(code || "NPR").toUpperCase();
    const srcRate = rateMap[src] || 1;
    const usd = Number(amount || 0) / (srcRate || 1);
    const repRate = rateMap[report] || 1;
    return Math.round((usd * repRate) * 100) / 100;
  };
  const byCurrency = earningsData.totals?.byCurrency || {};
  const converted = Object.entries(byCurrency).reduce(
    (acc, [code, vals]) => {
      acc.totalReceived += toReport(code, vals.totalReceived || 0);
      acc.platformFees += toReport(code, vals.platformFees || 0);
      acc.paidToTeachers += toReport(code, vals.paidToTeachers || 0);
      return acc;
    },
    { totalReceived: 0, platformFees: 0, paidToTeachers: 0 }
  );
  const nprTotals = (earningsData.transactions || []).reduce(
    (acc, t) => {
      if (t.status !== "reverted_to_learner") {
        acc.totalReceived += Number(t.amountPaidNPR || 0);
        acc.platformFees += Number(t.platformFeeAmountNPR || 0);
        acc.paidToTeachers += Number(t.teacherAmountNPR || 0);
      }
      return acc;
    },
    { totalReceived: 0, platformFees: 0, paidToTeachers: 0 }
  );
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="glass-card p-4">
        <p className="text-[11px] theme-muted">Total received</p>
        <p className="text-xl font-bold theme-primary">NPR {nprTotals.totalReceived.toLocaleString()}</p>
        <p className="mt-1 text-[11px] theme-muted">{report} {converted.totalReceived.toLocaleString()}</p>
      </div>
      <div className="glass-card p-4">
        <p className="text-[11px] theme-muted">Platform fees</p>
        <p className="text-xl font-bold theme-accent">NPR {nprTotals.platformFees.toLocaleString()}</p>
        <p className="mt-1 text-[11px] theme-muted">{report} {converted.platformFees.toLocaleString()}</p>
      </div>
      <div className="glass-card p-4">
        <p className="text-[11px] theme-muted">Paid to teachers</p>
        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">NPR {nprTotals.paidToTeachers.toLocaleString()}</p>
        <p className="mt-1 text-[11px] theme-muted">{report} {converted.paidToTeachers.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default EarningsNPRReportCards;
