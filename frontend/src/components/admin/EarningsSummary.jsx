import React from "react";

const fmt = (n) => Number(n || 0).toLocaleString();

const EarningsSummary = ({ totals, byCurrency, reportingCurrency, currencyRates }) => {
  const rateMap = {};
  (currencyRates || []).forEach((r) => {
    rateMap[String(r.code).toUpperCase()] = Number(r.rateToUSD) || 1;
  });
  const report = String(reportingCurrency || "NPR").toUpperCase();
  const toReport = (code, amount) => {
    const src = String(code || "NPR").toUpperCase();
    const usdFromSrc = (rateMap[src] || 1) === 0 ? 1 : rateMap[src] || 1;
    const usd = Number(amount || 0) / usdFromSrc;
    const reportRate = rateMap[report] || 1;
    return Math.round((usd * reportRate) * 100) / 100;
  };
  const converted = (() => {
    const byCur = byCurrency || {};
    const agg = Object.entries(byCur).reduce(
      (acc, [code, t]) => {
        acc.totalReceived += toReport(code, t.totalReceived || 0);
        acc.platformFees += toReport(code, t.platformFees || 0);
        acc.paidToTeachers += toReport(code, t.paidToTeachers || 0);
        return acc;
      },
      { totalReceived: 0, platformFees: 0, paidToTeachers: 0 }
    );
    const exp = toReport("USD", totals?.totalExpenditure || 0);
    const pl = Math.round(((agg.platformFees || 0) - exp) * 100) / 100;
    return { ...agg, totalExpenditure: exp, profitLoss: pl };
  })();
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] text-white/60">Received ({report})</p>
        <p className="mt-1 text-sm font-semibold">{fmt(converted.totalReceived)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] text-white/60">Fees ({report})</p>
        <p className="mt-1 text-sm font-semibold">{fmt(converted.platformFees)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] text-white/60">Paid to teachers ({report})</p>
        <p className="mt-1 text-sm font-semibold">{fmt(converted.paidToTeachers)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] text-white/60">Expenditure ({report})</p>
        <p className="mt-1 text-sm font-semibold">{fmt(converted.totalExpenditure)}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-[11px] text-white/60">Profit/Loss ({report})</p>
        <p className="mt-1 text-sm font-semibold">{fmt(converted.profitLoss)}</p>
      </div>
      <div className="col-span-2 md:col-span-5 mt-2">
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCurrency || {}).map(([code, t]) => (
            <div key={code} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px]">
              <span className="font-semibold">{code}</span>{" "}
              <span className="text-white/60">recv</span> {fmt(t.totalReceived)}{" "}
              <span className="text-white/60">fees</span> {fmt(t.platformFees)}{" "}
              <span className="text-white/60">paid</span> {fmt(t.paidToTeachers)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsSummary;
