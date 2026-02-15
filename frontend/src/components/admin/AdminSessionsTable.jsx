import React from "react";
import AdminSessionRow from "./sessions/AdminSessionRow.jsx";
import ResponsiveTableCards from "../shared/ResponsiveTableCards.jsx";

export default function AdminSessionsTable({
  sessions,
  offersOnly,
  setOffersOnly,
  setSessionEditModal,
  handleDeleteSession,
}) {
  const data = (offersOnly ? sessions.filter((s) => s.kind === "Offer" || s.status === "Offer") : sessions);
  const headers = [
    { key: "skill", label: "Skill" },
    { key: "learner", label: "Learner" },
    { key: "teacher", label: "Teacher" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" }
  ];
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
      <div className="text-xs">
        <ResponsiveTableCards
          title="Sessions"
          headers={headers}
          rows={data}
          renderCell={(h, s) => {
            if (h.key === "skill") return s.skillName;
            if (h.key === "learner") return s.learnerId?.name || "Unknown";
            if (h.key === "teacher") return s.teacherId?.name || "Unassigned";
            if (h.key === "status") return (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                s.status === "Completed"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : s.status === "Accepted"
                  ? "bg-blue-500/20 text-blue-200"
                  : "bg-yellow-500/20 text-yellow-200"
              }`}>{s.status}</span>
            );
            if (h.key === "date") return new Date(s.createdAt).toLocaleDateString();
            return "";
          }}
          renderActions={(s) => (
            <>
              <button
                type="button"
                onClick={() => setSessionEditModal({ open: true, session: s })}
                className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px] text-nexus-200"
              >
                View / Edit
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSession(s._id)}
                className="rounded border border-red-400/50 px-2 py-0.5 text-[10px] text-red-300"
              >
                Delete
              </button>
            </>
          )}
        />
      </div>
    </section>
  );
}
