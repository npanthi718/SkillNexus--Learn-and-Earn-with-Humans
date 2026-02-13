import React from "react";

const AdminConversation = ({ conv }) => {
  const msgs = (conv?.messages || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="mb-2 text-xs font-semibold text-amber-200 border-b border-white/10 pb-2">
        {(conv?.users || []).join(" ↔ ")}
      </p>
      <div className="space-y-2">
        {msgs.map((m) => (
          <div key={m._id} className="rounded-lg p-2 bg-white/5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-medium text-white/90">
                {m.senderId?.name || "Unknown"}
              </p>
              <p className="text-[10px] text-white/50">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-white/80">{m.content}</p>
            {m.isEdited && (
              <p className="mt-1 text-[9px] text-white/50 italic">(edited)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminConversation;
