// Country code (e.g. NP, US) -> currency symbol and name
export const COUNTRY_CURRENCY = {
  NP: { symbol: "NPR", name: "Nepalese Rupee" },
  US: { symbol: "USD", name: "US Dollar" },
  IN: { symbol: "INR", name: "Indian Rupee" },
  GB: { symbol: "£", name: "British Pound" },
  EU: { symbol: "€", name: "Euro" },
  AU: { symbol: "A$", name: "Australian Dollar" },
  CA: { symbol: "C$", name: "Canadian Dollar" },
  PK: { symbol: "PKR", name: "Pakistani Rupee" },
  BD: { symbol: "৳", name: "Bangladeshi Taka" },
  LK: { symbol: "LKR", name: "Sri Lankan Rupee" },
};

// Simple approximate rates to USD (for display only; update as needed)
const RATES_TO_USD = {
  NPR: 0.0075,
  USD: 1,
  INR: 0.012,
  GBP: 1.27,
  EUR: 1.08,
  PKR: 0.0036,
  LKR: 0.0031,
};

// Map common country names to 2-letter codes
const COUNTRY_NAME_TO_CODE = {
  NEPAL: "NP",
  INDIA: "IN",
  "UNITED STATES": "US",
  USA: "US",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  "EUROPEAN UNION": "EU",
  PAKISTAN: "PK",
  BANGLADESH: "BD",
  "SRI LANKA": "LK",
  AUSTRALIA: "AU",
  CANADA: "CA",
};

function normalizeToCurrencySymbol(input) {
  if (!input) return "USD";
  const raw = String(input).trim().toUpperCase();
  // If it's already a known currency code, return it
  if (RATES_TO_USD[raw] != null) return raw;
  // If it's a known country code, return its symbol
  if (COUNTRY_CURRENCY[raw]) return COUNTRY_CURRENCY[raw].symbol;
  // If it's a known country name, map to code then to symbol
  const byNameCode = COUNTRY_NAME_TO_CODE[raw];
  if (byNameCode && COUNTRY_CURRENCY[byNameCode]) {
    return COUNTRY_CURRENCY[byNameCode].symbol;
  }
  // Fallback
  return "USD";
}

export function getCurrencyForCountry(countryCode) {
  if (!countryCode) return { symbol: "USD", name: "US Dollar" };
  const sym = normalizeToCurrencySymbol(countryCode);
  // Reverse lookup to find a readable name if possible
  const entry = Object.values(COUNTRY_CURRENCY).find((v) => v.symbol === sym);
  return entry || { symbol: sym, name: sym };
}

export function formatAmount(amount, countryCode) {
  const { symbol } = getCurrencyForCountry(countryCode);
  return `${symbol} ${Number(amount).toLocaleString()}`;
}

export function convertAmount(amount, fromCountryCode, toCountryCode) {
  if (!amount || fromCountryCode === toCountryCode) return amount;
  const from = normalizeToCurrencySymbol(fromCountryCode);
  const to = normalizeToCurrencySymbol(toCountryCode);
  if (from === to) return amount;
  const fromRate = RATES_TO_USD[from] ?? 1;
  const toRate = RATES_TO_USD[to] ?? 1;
  const inUsd = amount * fromRate;
  return Math.round((toRate === 0 ? inUsd : inUsd / toRate) * 100) / 100;
}
