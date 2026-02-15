import React from "react";
import FilterChips from "../../shared/FilterChips.jsx";

const AdminReviewsFilters = ({ query, minRating, onQueryChange, onMinRatingChange }) => {
  return (
    <div className="glass-card p-3 mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by user or content"
        className="flex-1 rounded bg-black/30 px-3 py-2 text-xs outline-none"
      />
      <label className="flex items-center gap-2 text-xs">
        <span>Min rating</span>
        <input
          type="number"
          min={0}
          max={5}
          step={0.5}
          value={minRating}
          onChange={(e) => onMinRatingChange(Number(e.target.value))}
          className="w-20 rounded bg-black/30 px-2 py-1 text-xs outline-none"
        />
      </label>
      <FilterChips
        options={[
          { label: "All", value: 0 },
          { label: "3★+", value: 3 },
          { label: "4★+", value: 4 },
          { label: "5★", value: 5 },
        ]}
        value={minRating}
        onChange={(v) => onMinRatingChange(Number(v))}
      />
    </div>
  );
};

export default AdminReviewsFilters;
