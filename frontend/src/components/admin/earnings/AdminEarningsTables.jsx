import React from "react";

const AdminEarningsTables = ({ earningsData, reportingCurrency, currencyRates }) => {
  const byCurrency = earningsData?.totals?.byCurrency || null;
  if (!byCurrency) return null;
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-2">Totals by currency</h3>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        {Object.entries(byCurrency).map(([cur, vals]) => (
          <div key={cur} className="rounded border border-white/10 p-2">
            <p className="font-semibold mb-1">{cur}</p>
            <p className="theme-muted">Received: {(vals.totalReceived || 0).toLocaleString()}</p>
            <p className="theme-muted">Fees: {(vals.platformFees || 0).toLocaleString()}</p>
            <p className="theme-muted">Paid to teachers: {(vals.paidToTeachers || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminEarningsTables;
