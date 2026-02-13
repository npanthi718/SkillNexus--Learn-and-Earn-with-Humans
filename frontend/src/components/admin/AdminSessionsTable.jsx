import React from "react";
import AdminSessionRow from "./sessions/AdminSessionRow.jsx";

export default function AdminSessionsTable({
  sessions,
  offersOnly,
  setOffersOnly,
  setSessionEditModal,
  handleDeleteSession,
}) {
  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">All Sessions History</h2>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            onChange={(e) => setOffersOnly(e.target.checked)}
          />
          <span>Show Offers only</span>
        </label>
      </div>
      <div className="max-h-[600px] overflow-auto text-xs">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-nexus-900/95 text-[11px] text-white/60">
            <tr>
              <th className="border-b border-white/10 px-3 py-2">Skill</th>
              <th className="border-b border-white/10 px-3 py-2">Learner</th>
              <th className="border-b border-white/10 px-3 py-2">Teacher</th>
              <th className="border-b border-white/10 px-3 py-2">Status</th>
              <th className="border-b border-white/10 px-3 py-2">Date</th>
              <th className="border-b border-white/10 px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(offersOnly ? sessions.filter((s) => s.kind === "Offer" || s.status === "Offer") : sessions).map((s) => (
              <AdminSessionRow key={s._id} s={s} setSessionEditModal={setSessionEditModal} handleDeleteSession={handleDeleteSession} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
