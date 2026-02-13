import React from "react";

const FilterChips = ({ options, value, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3 py-1 text-[11px] border ${
            value === opt.value ? "border-nexus-400/60 bg-nexus-500/20 text-nexus-200" : "border-white/20 text-white/80 hover:bg-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;
