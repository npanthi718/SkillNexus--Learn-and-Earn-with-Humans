import React from "react";

const EarningsProfitLossCards = ({ earningsData, reportingCurrency, currencyRates }) => {
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
      acc.platformFees += toReport(code, vals.platformFees || 0);
      return acc;
    },
    { platformFees: 0 }
  );
  const expRep = toReport("USD", earningsData.totals?.totalExpenditure || 0);
  const profitLossRep = Math.round((converted.platformFees - expRep) * 100) / 100;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="glass-card p-4">
        <p className="text-[11px] theme-muted">Other expenditure ({report})</p>
        <p className="text-xl font-bold theme-primary">{expRep.toLocaleString()}</p>
      </div>
      <div className="glass-card p-4">
        <p className="text-[11px] theme-muted">Profit / Loss ({report})</p>
        <p className={`text-xl font-bold ${profitLossRep >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>{profitLossRep.toLocaleString()}</p>
      </div>
    </div>
  );
};

export default EarningsProfitLossCards;
