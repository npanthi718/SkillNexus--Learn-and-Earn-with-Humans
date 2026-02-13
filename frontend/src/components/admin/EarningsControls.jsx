import React from "react";
import axios from "axios";
import { getCurrencyForCountry } from "../../utils/currency.js";
import FilterChips from "../shared/FilterChips.jsx";

const EarningsControls = ({
  earningsFrom,
  earningsTo,
  setEarningsFrom,
  setEarningsTo,
  currencyRates,
  reportingCurrency,
  earningsData,
  platformConfig,
  authHeaders,
  setEarningsData
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <input type="date" value={earningsFrom} onChange={(e) => setEarningsFrom(e.target.value)} className="rounded border border-slate-300 dark:border:white/20 px-2 py-1 text-xs" />
      <input type="date" value={earningsTo} onChange={(e) => setEarningsTo(e.target.value)} className="rounded border border-slate-300 dark:border:white/20 px-2 py-1 text-xs" />
      <FilterChips
        options={[
          { label: "This week", value: "week" },
          { label: "This month", value: "month" },
          { label: "Last month", value: "last-month" },
        ]}
        value="custom"
        onChange={(preset) => {
          const today = new Date();
          const iso = (d) => d.toISOString().slice(0, 10);
          if (preset === "week") {
            const day = today.getDay();
            const diffToMon = (day + 6) % 7;
            const monday = new Date(today);
            monday.setDate(today.getDate() - diffToMon);
            setEarningsFrom(iso(monday));
            setEarningsTo(iso(today));
          } else if (preset === "month") {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setEarningsFrom(iso(start));
            setEarningsTo(iso(end));
          } else if (preset === "last-month") {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            setEarningsFrom(iso(start));
            setEarningsTo(iso(end));
          }
        }}
      />
      <button
        type="button"
        onClick={async () => {
          try {
            const { data } = await axios.get("/api/admin/earnings", { headers: authHeaders, params: { from: earningsFrom || undefined, to: earningsTo || undefined } });
            setEarningsData(data);
          } catch (e) {
            console.error(e);
          }
        }}
        className="rounded border border-nexus-400/50 px-3 py-1 text-xs"
      >
        Apply filter
      </button>
      <button
        type="button"
        onClick={() => {
          const rateMap = {};
          const buyMap = {};
          const sellMap = {};
          (currencyRates || []).forEach((r) => {
            const code = String(r.code || "USD").toUpperCase();
            buyMap[code] = Number(r.buyToUSD ?? r.rateToUSD ?? 1) || 1;
            sellMap[code] = Number(r.sellToUSD ?? r.rateToUSD ?? 1) || 1;
            rateMap[code] = Number(r.rateToUSD ?? r.buyToUSD ?? 1) || 1;
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
          const convertedTotals = Object.entries(byCurrency).reduce(
            (acc, [code, vals]) => {
              acc.totalReceived += toReport(code, vals.totalReceived || 0);
              acc.platformFees += toReport(code, vals.platformFees || 0);
              acc.paidToTeachers += toReport(code, vals.paidToTeachers || 0);
              return acc;
            },
            { totalReceived: 0, platformFees: 0, paidToTeachers: 0 }
          );
          const totalExpenditureRep = toReport("USD", earningsData.totals?.totalExpenditure || 0);
          const profitLossRep = Math.round(((convertedTotals.platformFees || 0) - totalExpenditureRep) * 100) / 100;
          const rows = (earningsData.transactions || []).map((t) => {
            const lCurSym = getCurrencyForCountry(t.learnerId?.country).symbol;
            const teCurSym = getCurrencyForCountry(t.teacherId?.country).symbol;
            const paid = `${lCurSym} ${Number(t.amountPaid).toLocaleString()}`;
            const fee = `${lCurSym} ${Number(t.platformFeeAmount).toLocaleString()}`;
            const computedPayout = typeof t.payoutAmount === "number"
              ? t.payoutAmount
              : (typeof t.exchangeRate === "number" && t.exchangeRate > 0)
                ? Math.round((t.teacherAmount * t.exchangeRate) * 100) / 100
                : (() => {
                    const payer = String(t.payerCurrency || "USD").toUpperCase();
                    const payout = String(t.payoutCurrency || "USD").toUpperCase();
                    const buy = buyMap[payer] || 1;
                    const sell = sellMap[payout] || 1;
                    const rate = sell > 0 ? (buy / sell) : 0;
                    return Math.round((Number(t.teacherAmount || 0) * (rate || 1)) * 100) / 100;
                  })();
            const toTeacher = `${t.payoutCurrency || teCurSym} ${Number(computedPayout).toLocaleString()}`;
            const exRateText = typeof t.exchangeRate === "number" && t.exchangeRate > 0 ? String(t.exchangeRate) : "auto";
            const payDetails = Array.isArray(t.teacherId?.paymentDetails) && t.teacherId.paymentDetails.length > 0
              ? t.teacherId.paymentDetails.map((pd) => {
                  const qr = pd.qrCodeUrl ? `<br/><img src="${pd.qrCodeUrl}" alt="QR" style="height:64px;border:1px solid #ddd;border-radius:6px;margin-top:4px" />` : "";
                  return `<div><strong>${pd.bankName || "Bank"}</strong> · ${pd.country || ""}<br/>${(pd.bankDetails || "").replace(/\n/g, "<br/>")}${qr}</div>`;
                }).join("<hr style='border:none;border-top:1px solid #eee;margin:6px 0'/>")
              : "";
            return `<tr><td>${t.learnerId?.name || ""}</td><td>${t.teacherId?.name || ""}${payDetails ? `<div class="muted">${payDetails}</div>` : ""}</td><td>${t.skillName || ""}</td><td>${paid}</td><td>${t.platformFeePercent || 0}%</td><td>${fee}</td><td>${toTeacher}</td><td>${t.status}</td><td>${exRateText}</td></tr>`;
          }).join("");
          const nprRows = (earningsData.transactions || []).map((t) => {
            const payout = String(t.payoutCurrency || "USD").toUpperCase();
            const buyNPR = buyMap["NPR"] || 1;
            const sellPayout = sellMap[payout] || 1;
            const rate = (typeof t.nprToPayoutRate === "number" && t.nprToPayoutRate > 0)
              ? t.nprToPayoutRate
              : (sellPayout ? (Number(buyNPR || 1) / Number(sellPayout || 1)) : 0);
            const payoutAmt = (typeof t.payoutAmount === "number" && t.payoutAmount > 0)
              ? t.payoutAmount
              : Math.round((((t.teacherAmountNPR || 0) * (rate || 0)) || 0) * 100) / 100;
            return `<tr><td>${t.learnerId?.name || ""}</td><td>${t.teacherId?.name || ""}</td><td>${t.skillName || ""}</td><td>NPR ${Number(t.amountPaidNPR || 0).toLocaleString()}</td><td>NPR ${Number(t.platformFeeAmountNPR || 0).toLocaleString()}</td><td>NPR ${Number(t.teacherAmountNPR || 0).toLocaleString()}</td><td>${Number(rate || 0).toFixed(6)} NPR→${payout}</td><td>${payout} ${Number(payoutAmt || 0).toLocaleString()}</td></tr>`;
          }).join("");
          const byCurRows = Object.entries(byCurrency).map(([code, vals]) => {
            const recv = Number(vals.totalReceived || 0).toLocaleString();
            const fees = Number(vals.platformFees || 0).toLocaleString();
            const paid = Number(vals.paidToTeachers || 0).toLocaleString();
            const recvRep = toReport(code, vals.totalReceived || 0).toLocaleString();
            const feesRep = toReport(code, vals.platformFees || 0).toLocaleString();
            const paidRep = toReport(code, vals.paidToTeachers || 0).toLocaleString();
            return `<tr><td>${code}</td><td>${recv}</td><td>${fees}</td><td>${paid}</td><td>${report} ${recvRep}</td><td>${report} ${feesRep}</td><td>${report} ${paidRep}</td></tr>`;
          }).join("");
          const logoTag = (platformConfig && platformConfig.logoUrl)
            ? `<img src="${platformConfig.logoUrl}" alt="Logo" />`
            : `<div style="height:48px;width:48px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#06b6d4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">SN</div>`;
          const html = `
            <html>
              <head>
                <meta charset="utf-8" />
                <title>Earnings Statement</title>
                <style>
                  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:24px}
                  h1{font-size:18px;margin:0 0 12px}
                  table{width:100%;border-collapse:collapse;margin-top:12px}
                  th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:left}
                  .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}
                  .card{border:1px solid #ddd;border-radius:8px;padding:10px}
                  .muted{color:#666;font-size:12px}
                  .subtle{color:#444;font-size:11px}
                  .brand{display:flex;align-items:center;gap:10px;margin-bottom:10px}
                  .brand img{height:48px;width:48px;border-radius:8px;border:1px solid #ddd;object-fit:contain}
                </style>
              </head>
              <body>
                <div class="brand">
                  ${logoTag}
                  <h1>SkillNexus · Earnings & Expenditure</h1>
                </div>
                <p class="subtle">Reporting currency: ${report}</p>
                <div class="grid">
                  <div class="card"><div class="muted">Total received (${report})</div><div><strong>${convertedTotals.totalReceived.toLocaleString()}</strong></div></div>
                  <div class="card"><div class="muted">Platform fees (${report})</div><div><strong>${convertedTotals.platformFees.toLocaleString()}</strong></div></div>
                  <div class="card"><div class="muted">Paid to teachers (${report})</div><div><strong>${convertedTotals.paidToTeachers.toLocaleString()}</strong></div></div>
                  <div class="card"><div class="muted">Other expenditure (${report})</div><div><strong>${totalExpenditureRep.toLocaleString()}</strong></div></div>
                </div>
                <div class="grid">
                  <div class="card"><div class="muted">Profit / Loss (${report})</div><div><strong>${profitLossRep.toLocaleString()}</strong></div></div>
                </div>
                <h2 style="font-size:14px;margin:16px 0 8px">Totals by currency</h2>
                <table>
                  <thead><tr><th>Currency</th><th>Received</th><th>Fees</th><th>Paid to teachers</th><th>Received (${report})</th><th>Fees (${report})</th><th>Paid (${report})</th></tr></thead>
                  <tbody>${byCurRows}</tbody>
                </table>
                <h2 style="font-size:14px;margin:18px 0 8px">Transactions</h2>
                <table>
                  <thead><tr><th>Learner</th><th>Teacher</th><th>Skill</th><th>Amount paid</th><th>Fee %</th><th>Platform fee</th><th>To teacher</th><th>Status</th><th>Rate</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
                <h2 style="font-size:14px;margin:18px 0 8px">Transactions · NPR summary</h2>
                <table>
                  <thead><tr><th>Learner</th><th>Teacher</th><th>Skill</th><th>Received (NPR)</th><th>Fee (NPR)</th><th>Net (NPR)</th><th>Rate NPR→Payout</th><th>Payout amount</th></tr></thead>
                  <tbody>${nprRows}</tbody>
                </table>
                <p class="subtle" style="margin-top:12px">Conversion uses admin-defined rates (code → USD), then USD → ${report}.</p>
              </body>
            </html>`;
          const w = window.open("", "_blank");
          if (!w) return;
          w.document.open();
          w.document.write(html);
          w.document.close();
          w.focus();
          w.print();
        }}
        className="rounded border border-white/20 px-3 py-1 text-xs"
      >
        Download PDF
      </button>
    </div>
  );
};

export default EarningsControls;
