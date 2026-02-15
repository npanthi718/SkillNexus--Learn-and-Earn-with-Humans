import React from "react";

const FilterChips = ({ options, value, onChange }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`filter-chip rounded-full px-3 py-1 text-[11px] border ${value === opt.value ? "selected" : ""}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;
