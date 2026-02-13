import React, { useMemo, useState } from "react";
import axios from "axios";

const PayoutForm = ({ transaction, authHeaders, onUpdated, currencyRates = [] }) => {
  const [exchangeRate, setExchangeRate] = useState(transaction?.exchangeRate || 0);
  const [payoutAmount, setPayoutAmount] = useState(transaction?.payoutAmount || 0);
  const [overrideFeePercent, setOverrideFeePercent] = useState(transaction?.platformFeePercent || 0);
  const [note, setNote] = useState("");
  const rateMap = useMemo(() => {
    const m = {};
    (currencyRates || []).forEach((r) => {
      const code = String(r.code || "").toUpperCase();
      m[code] = {
        buy: typeof r.buyToUSD === "number" ? r.buyToUSD : (typeof r.rateToUSD === "number" ? r.rateToUSD : 1),
        sell: typeof r.sellToUSD === "number" ? r.sellToUSD : (typeof r.rateToUSD === "number" ? r.rateToUSD : 1)
      };
    });
    return m;
  }, [currencyRates]);
  const payer = String(transaction?.payerCurrency || "USD").toUpperCase();
  const payout = String(transaction?.payoutCurrency || "USD").toUpperCase();
  const expectedRate = useMemo(() => {
    const nprBuy = rateMap["NPR"]?.buy || 1;
    const payoutSell = rateMap[payout]?.sell || 1;
    if (!nprBuy || !payoutSell) return 0;
    return Math.round(((nprBuy / payoutSell) + Number.EPSILON) * 100000) / 100000;
  }, [rateMap, payout]);
  const computed = useMemo(() => {
    const teacherNetNPR = (() => {
      if (typeof overrideFeePercent === "number" && overrideFeePercent >= 0) {
        const grossNPR = Number(transaction?.amountPaidNPR || 0);
        const feeNPR = Math.round(((grossNPR * overrideFeePercent) / 100) * 100) / 100;
        return Math.max(0, Math.round((grossNPR - feeNPR) * 100) / 100);
      }
      return Number(transaction?.teacherAmountNPR || 0);
    })();
    if (exchangeRate && exchangeRate > 0) {
      return Math.round((teacherNetNPR * Number(exchangeRate)) * 100) / 100;
    }
    return Number(payoutAmount || 0);
  }, [exchangeRate, payoutAmount, transaction, overrideFeePercent]);
  const diffPct = useMemo(() => {
    if (!expectedRate || !exchangeRate) return 0;
    return Math.round((((exchangeRate - expectedRate) / expectedRate) * 100) * 100) / 100;
  }, [expectedRate, exchangeRate]);
  const save = async () => {
    const { data } = await axios.patch(
      `/api/admin/transactions/${transaction._id}/pay`,
      {
        exchangeRate: Number(exchangeRate) || undefined,
        payoutAmount: Number(payoutAmount || computed) || 0,
        overrideFeePercent: Number(overrideFeePercent),
        note
      },
      { headers: authHeaders }
    );
    onUpdated && onUpdated(data.transaction);
  };
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-2">
      <p className="text-[11px] text-white/60">
        Learner paid in {transaction?.payerCurrency}, teacher receives in {transaction?.payoutCurrency}
      </p>
      <div className="text-[11px] theme-muted">
        <span className="mr-2">Admin rates:</span>
        <span className="mr-2">NPR buy→USD {rateMap["NPR"]?.buy ?? "—"}</span>
        <span className="mr-2">{payout} sell→USD {rateMap[payout]?.sell ?? "—"}</span>
        <span className="mr-2">Expected NPR→{payout} {expectedRate || "—"}</span>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-[11px] text-white/60">Override fee %</label>
          <input
            type="number"
            step="0.1"
            min={0}
            max={100}
            value={overrideFeePercent}
            onChange={(e) => setOverrideFeePercent(Number(e.target.value))}
            className="ml-2 w-24 rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
            title="If set, platform fee recalculates for this payout"
          />
        </div>
        <div>
          <label className="text-[11px] text-white/60">Exchange rate</label>
          <input
            type="number"
            step="0.0001"
            min={0}
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="ml-2 w-28 rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] text-white/60">Payout amount</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={payoutAmount || computed}
            onChange={(e) => setPayoutAmount(Number(e.target.value))}
            className="ml-2 w-28 rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-[11px] text-white/60">History note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reference or justification"
            className="ml-2 w-full rounded-md bg-black/40 px-2 py-1 text-xs outline-none"
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="rounded-md border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-200"
        >
          Save payout
        </button>
      </div>
      {expectedRate > 0 && (
        <div className={`text-[11px] ${Math.abs(diffPct) <= 5 ? "text-emerald-300" : Math.abs(diffPct) <= 12 ? "text-amber-300" : "text-red-400"}`}>
          Difference vs admin rate: {diffPct}% ({exchangeRate || "—"} actual vs {expectedRate} expected)
        </div>
      )}
      {Array.isArray(transaction?.exchangeRateHistory) && transaction.exchangeRateHistory.length > 0 && (
        <div className="mt-2 rounded bg-black/30 p-2">
          <p className="text-[11px] font-semibold mb-1">Rate history</p>
          <div className="space-y-1 text-[11px]">
            {transaction.exchangeRateHistory.map((h, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span>{new Date(h.at).toLocaleString()}</span>
                <span>{typeof h.rate === "number" ? h.rate : "—"} → {typeof h.payoutAmount === "number" ? h.payoutAmount : "—"}</span>
                <span className="text-white/60">{h.note || ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutForm;
