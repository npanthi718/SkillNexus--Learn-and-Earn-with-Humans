import React from "react";
import axios from "axios";

const AdminCurrencyPanel = ({ platformConfig, setPlatformConfig, authHeaders }) => {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-3">Currencies & Country mapping</h3>
      <p className="text-xs theme-muted mb-2">Add global currencies and set country → currency mapping.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold mb-2">Currencies</p>
          <div className="space-y-2">
            {(platformConfig?.currencyRates || []).map((c, i) => (
              <div key={`${c.code}-${i}`} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                <input
                  type="text"
                  defaultValue={c.code}
                  className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  onBlur={(e) => {
                    const next = (platformConfig?.currencyRates || []).map((x, idx) => (idx === i ? { ...x, code: e.target.value.toUpperCase() } : x));
                    setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                    axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                  }}
                />
                <span className="text-[10px] text-white/40 md:hidden">Code</span>
                <input
                  type="text"
                  defaultValue={c.name || ""}
                  placeholder="Name"
                  className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  onBlur={(e) => {
                    const next = (platformConfig?.currencyRates || []).map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x));
                    setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                    axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                  }}
                />
                <span className="text-[10px] text-white/40 md:hidden">Name</span>
                <input
                  type="number"
                  min={0}
                  step={0.0001}
                  defaultValue={c.buyToUSD ?? c.rateToUSD ?? 1}
                  placeholder="Buy→USD"
                  className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  onBlur={(e) => {
                    const next = (platformConfig?.currencyRates || []).map((x, idx) => (idx === i ? { ...x, buyToUSD: Number(e.target.value) || 0 } : x));
                    setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                    axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                  }}
                />
                <span className="text-[10px] text-white/40 md:hidden">Buy→USD</span>
                <input
                  type="number"
                  min={0}
                  step={0.0001}
                  defaultValue={c.sellToUSD ?? c.rateToUSD ?? 1}
                  placeholder="Sell→USD"
                  className="w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  onBlur={(e) => {
                    const next = (platformConfig?.currencyRates || []).map((x, idx) => (idx === i ? { ...x, sellToUSD: Number(e.target.value) || 0 } : x));
                    setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                    axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                  }}
                />
                <span className="text-[10px] text-white/40 md:hidden">Sell→USD</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = (platformConfig?.currencyRates || []).filter((_, idx) => idx !== i);
                    setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
                    axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders }).catch(console.error);
                  }}
                  className="rounded border border-red-400/50 bg-red-500/20 px-2 py-1 text-[10px] text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...(platformConfig?.currencyRates || []), { code: "", name: "", buyToUSD: 1, sellToUSD: 1 }];
                setPlatformConfig((p) => ({ ...(p || {}), currencyRates: next }));
              }}
              className="rounded-lg border-2 border-dashed border-nexus-500/40 px-3 py-1 text-[11px] text-nexus-200"
            >
              + Add currency
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-2">Country → Currency</p>
          <div className="space-y-2">
            {(platformConfig?.countryCurrency || []).map((m, i) => (
              <div key={`${m.countryCode}-${i}`} className="flex items-center gap-2">
                {Array.isArray(platformConfig?.countries) && platformConfig.countries.length > 0 ? (
                  <select
                    defaultValue={m.countryCode}
                    className="w-36 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                    onChange={(e) => {
                      const next = (platformConfig?.countryCurrency || []).map((x, idx) => (idx === i ? { ...x, countryCode: e.target.value.toUpperCase() } : x));
                      setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                      axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                    }}
                  >
                    <option value="">Select country</option>
                    {platformConfig.countries.map((c) => (
                      <option key={c.code} value={String(c.code).toUpperCase()}>
                        {c.name || c.code} ({String(c.code).toUpperCase()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    defaultValue={m.countryCode}
                    placeholder="Country code (e.g., US)"
                    className="w-28 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                    onBlur={(e) => {
                      const next = (platformConfig?.countryCurrency || []).map((x, idx) => (idx === i ? { ...x, countryCode: e.target.value.toUpperCase() } : x));
                      setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                      axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                    }}
                  />
                )}
                <input
                  type="text"
                  defaultValue={m.currencyCode}
                  placeholder="Currency code (e.g., USD)"
                  className="w-28 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                  onBlur={(e) => {
                    const next = (platformConfig?.countryCurrency || []).map((x, idx) => (idx === i ? { ...x, currencyCode: e.target.value.toUpperCase() } : x));
                    setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                    axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (platformConfig?.countryCurrency || []).filter((_, idx) => idx !== i);
                    setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
                    axios.put("/api/admin/platform-config", { countryCurrency: next }, { headers: authHeaders }).catch(console.error);
                  }}
                  className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300"
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const next = [...(platformConfig?.countryCurrency || []), { countryCode: "", currencyCode: "" }];
                setPlatformConfig((p) => ({ ...(p || {}), countryCurrency: next }));
              }}
              className="rounded-lg border-2 border-dashed border-nexus-500/40 px-3 py-1 text-[11px] text-nexus-200"
            >
              + Add mapping
            </button>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <p className="text-xs font-semibold mb-2">Countries</p>
        <p className="text-[11px] theme-muted mb-2">Manage country codes and names used across the app.</p>
        <div className="space-y-2">
          {(platformConfig?.countries || []).map((c, i) => (
            <div key={`${c.code}-${i}`} className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={c.code}
                placeholder="Code (e.g., US)"
                className="w-28 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                onBlur={(e) => {
                  const next = (platformConfig?.countries || []).map((x, idx) => (idx === i ? { ...x, code: e.target.value.toUpperCase() } : x));
                  setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                  axios.put("/api/admin/platform-config", { countries: next }, { headers: authHeaders }).catch(console.error);
                }}
              />
              <input
                type="text"
                defaultValue={c.name || ""}
                placeholder="Name (e.g., United States)"
                className="w-60 rounded bg-black/40 px-2 py-1 text-xs outline-none"
                onBlur={(e) => {
                  const next = (platformConfig?.countries || []).map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x));
                  setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                  axios.put("/api/admin/platform-config", { countries: next }, { headers: authHeaders }).catch(console.error);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const next = (platformConfig?.countries || []).filter((_, idx) => idx !== i);
                  setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
                  axios.put("/api/admin/platform-config", { countries: next }, { headers: authHeaders }).catch(console.error);
                }}
                className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={async () => {
                const sample = [
                  { code: "US", name: "United States" },
                  { code: "NP", name: "Nepal" },
                  { code: "IN", name: "India" },
                  { code: "PK", name: "Pakistan" },
                  { code: "GB", name: "United Kingdom" },
                  { code: "EU", name: "European Union" },
                ];
                try {
                  const { data } = await axios.put("/api/admin/platform-config", { countries: sample }, { headers: authHeaders });
                  setPlatformConfig(data.config);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded border border-nexus-500/40 bg-nexus-500/20 px-3 py-1 text-[11px]"
            >
              Populate sample countries
            </button>
            <button
              type="button"
              onClick={async () => {
                const rates = [
                  { code: "USD", name: "US Dollar", buyToUSD: 1, sellToUSD: 1 },
                  { code: "NPR", name: "Nepalese Rupee", buyToUSD: 0.0075, sellToUSD: 0.0074 },
                  { code: "INR", name: "Indian Rupee", buyToUSD: 0.012, sellToUSD: 0.0118 },
                  { code: "PKR", name: "Pakistani Rupee", buyToUSD: 0.0036, sellToUSD: 0.0035 },
                  { code: "EUR", name: "Euro", buyToUSD: 1.07, sellToUSD: 1.06 },
                  { code: "GBP", name: "British Pound", buyToUSD: 1.26, sellToUSD: 1.25 },
                ];
                try {
                  const { data } = await axios.put("/api/admin/platform-config", { currencyRates: rates }, { headers: authHeaders });
                  setPlatformConfig(data.config);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[11px]"
            >
              Populate sample currencies
            </button>
            <button
              type="button"
              onClick={async () => {
                const mapping = [
                  { countryCode: "US", currencyCode: "USD" },
                  { countryCode: "GB", currencyCode: "GBP" },
                  { countryCode: "EU", currencyCode: "EUR" },
                  { countryCode: "NP", currencyCode: "NPR" },
                  { countryCode: "IN", currencyCode: "INR" },
                  { countryCode: "PK", currencyCode: "PKR" },
                ];
                try {
                  const { data } = await axios.put("/api/admin/platform-config", { countryCurrency: mapping }, { headers: authHeaders });
                  setPlatformConfig(data.config);
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[11px]"
            >
              Populate sample mappings
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
                  const json = await res.json();
                  const rates = json?.rates || {};
                  const pick = ["USD", "NPR", "INR", "PKR", "EUR", "GBP"];
                  const next = pick.map((code) => {
                    const rate = Number(rates[code]) || (code === "USD" ? 1 : 0);
                    const toUSD = code === "USD" ? 1 : 1 / rate;
                    return { code, name: code, buyToUSD: toUSD, sellToUSD: toUSD };
                  });
                  const { data } = await axios.put("/api/admin/platform-config", { currencyRates: next }, { headers: authHeaders });
                  setPlatformConfig(data.config);
                } catch (e) {
                  console.error("Fetch latest rates error", e);
                }
              }}
              className="rounded border border-blue-500/40 bg-blue-500/20 px-3 py-1 text-[11px]"
            >
              Fetch latest rates (USD base)
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = [...(platformConfig?.countries || []), { code: "", name: "" }];
              setPlatformConfig((p) => ({ ...(p || {}), countries: next }));
            }}
            className="rounded-lg border-2 border-dashed border-nexus-500/40 px-3 py-1 text-[11px] text-nexus-200"
          >
            + Add country
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCurrencyPanel;
