import React from "react";

const AdminQuickLinks = ({ navigate }) => {
  return (
    <section className="glass-card p-6 rounded-xl border border-white/10">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <span>🔗</span> Quick links
      </h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => navigate("/admin/users")} className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-4 py-2 text-xs text-amber-200 hover:bg-amber-500/30">Users</button>
        <button type="button" onClick={() => navigate("/admin/sessions")} className="rounded-lg border border-nexus-500/40 bg-nexus-500/20 px-4 py-2 text-xs text-nexus-200 hover:bg-nexus-500/30">Sessions</button>
        <button type="button" onClick={() => navigate("/admin/messages")} className="rounded-lg border border-blue-500/40 bg-blue-500/20 px-4 py-2 text-xs text-blue-200 hover:bg-blue-500/30">Messages</button>
        <button type="button" onClick={() => navigate("/admin/reviews")} className="rounded-lg border border-purple-500/40 bg-purple-500/20 px-4 py-2 text-xs text-purple-200 hover:bg-purple-500/30">Reviews</button>
        <button type="button" onClick={() => navigate("/admin/payments")} className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-xs text-emerald-200 hover:bg-emerald-500/30">Payments</button>
        <button type="button" onClick={() => navigate("/admin/earnings")} className="rounded-lg border border-slate-400/40 bg-slate-500/20 px-4 py-2 text-xs text-slate-200 hover:bg-slate-500/30">Statement</button>
        <button type="button" onClick={() => navigate("/admin/settings")} className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/20">Settings</button>
        <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs text-white/80 hover:bg-white/20">View site →</a>
      </div>
    </section>
  );
};

export default AdminQuickLinks;
