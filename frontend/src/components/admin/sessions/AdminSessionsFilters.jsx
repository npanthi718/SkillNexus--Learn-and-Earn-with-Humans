import React from "react";
import FilterChips from "../../shared/FilterChips.jsx";

const AdminSessionsFilters = ({ status, onStatusChange, offersOnly, setOffersOnly }) => {
  return (
    <div className="glass-card p-3 mb-3 flex items-center gap-2">
      <label className="flex items-center gap-2 text-xs">
        <span>Status</span>
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="rounded bg-black/30 px-2 py-1 text-xs outline-none">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <FilterChips
        options={[
          { label: "All", value: "all" },
          { label: "Pending", value: "pending" },
          { label: "Accepted", value: "accepted" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ]}
        value={status}
        onChange={onStatusChange}
      />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={offersOnly} onChange={(e) => setOffersOnly(e.target.checked)} />
        Offer-only
      </label>
    </div>
  );
};

export default AdminSessionsFilters;
