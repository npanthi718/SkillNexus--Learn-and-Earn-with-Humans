import React, { useState } from "react";
import axios from "axios";

const FriendRequestsCard = ({ friendRequests, setFriendRequests, navigate, token }) => {
  const [busyId, setBusyId] = useState(null);
  return (
    <div className="glass-card p-5 rounded-xl border border-white/10 shadow-lg">
      <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-3 font-medium">
        Friend requests
      </p>
      {friendRequests.length === 0 ? (
        <p className="text-[12px] text-white/70">No pending requests.</p>
      ) : (
        <div className="space-y-2">
          {friendRequests.map((fr) => (
            <div key={fr.fromUserId} className="flex items-center justify-between rounded border border-white/10 p-2">
              <div className="flex items-center gap-2">
                <img src={fr.profilePic || ""} alt="" onError={(e) => e.target.style.display = "none"} className="h-6 w-6 rounded object-cover" />
                <button type="button" onClick={() => navigate(`/profile/${fr.fromUserId}`)} className="text-[12px] font-medium theme-primary hover:underline">{fr.name}</button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyId === fr.fromUserId}
                  onClick={async () => {
                    setBusyId(fr.fromUserId);
                    await axios.post(`/api/users/friends/${fr.fromUserId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    setFriendRequests((prev) => prev.filter((x) => x.fromUserId !== fr.fromUserId));
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("sn:notifications:refresh"));
                    }
                    setBusyId(null);
                  }}
                  className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200 disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busyId === fr.fromUserId}
                  onClick={async () => {
                    setBusyId(fr.fromUserId);
                    await axios.post(`/api/users/friends/${fr.fromUserId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
                    setFriendRequests((prev) => prev.filter((x) => x.fromUserId !== fr.fromUserId));
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("sn:notifications:refresh"));
                    }
                    setBusyId(null);
                  }}
                  className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsCard;
