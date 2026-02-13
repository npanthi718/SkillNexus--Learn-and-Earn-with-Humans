import React from "react";
import EarningsNPRReportCards from "../EarningsNPRReportCards.jsx";

const AdminNPRSummary = ({ earningsData, reportingCurrency, currencyRates }) => {
  return (
    <EarningsNPRReportCards
      earningsData={earningsData}
      reportingCurrency={reportingCurrency}
      currencyRates={currencyRates}
    />
  );
};

export default AdminNPRSummary;
