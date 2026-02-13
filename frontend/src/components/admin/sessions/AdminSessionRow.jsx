import React from "react";

const AdminSessionRow = ({ s, setSessionEditModal, handleDeleteSession }) => {
  return (
    <tr className="hover:bg-white/5">
      <td className="border-b border-white/5 px-3 py-2">{s.skillName}</td>
      <td className="border-b border-white/5 px-3 py-2">{s.learnerId?.name || "Unknown"}</td>
      <td className="border-b border-white/5 px-3 py-2">{s.teacherId?.name || "Unassigned"}</td>
      <td className="border-b border-white/5 px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            s.status === "Completed"
              ? "bg-emerald-500/20 text-emerald-200"
              : s.status === "Accepted"
              ? "bg-blue-500/20 text-blue-200"
              : "bg-yellow-500/20 text-yellow-200"
          }`}
        >
          {s.status}
        </span>
      </td>
      <td className="border-b border-white/5 px-3 py-2 text-[11px] text-white/60">
        {new Date(s.createdAt).toLocaleDateString()}
      </td>
      <td className="border-b border-white/5 px-3 py-2">
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
          className="ml-1 rounded border border-red-400/50 px-2 py-0.5 text-[10px] text-red-300"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};

export default AdminSessionRow;
