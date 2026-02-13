import React from "react";

const StatCard = ({ icon, label, value, borderClass = "border-white/10" }) => {
  return (
    <div className={`glass-card p-4 rounded-xl border ${borderClass}`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-[11px] uppercase tracking-[0.18em] mt-1">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
};

export default StatCard;
