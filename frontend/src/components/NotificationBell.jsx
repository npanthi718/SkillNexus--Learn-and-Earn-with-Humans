import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NotificationBell = ({ token, isLight }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = data.notifications || [];
      const dedup = [];
      const seen = new Set();
      for (const n of list) {
        const key = `${n.type}-${String(n.relatedId || "")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        dedup.push(n);
      }
      setNotifications(dedup);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const markRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await axios.patch("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const navigate = useNavigate();

  const handleClick = (n) => {
    // default click navigates
    markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };
  
  const acceptFriend = async (otherId, notifId) => {
    try {
      await axios.post(`/api/users/friends/${otherId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notifId) markRead(notifId);
      setNotifications((prev) => prev.map((n) => n._id === notifId ? { ...n, read: true } : n));
    } catch {}
  };
  
  const rejectFriend = async (otherId, notifId) => {
    try {
      await axios.post(`/api/users/friends/${otherId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notifId) markRead(notifId);
      setNotifications((prev) => prev.map((n) => n._id === notifId ? { ...n, read: true } : n));
    } catch {}
  };

  if (!token) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        className={`relative rounded-full p-2 border ${
          isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/10"
        }`}
        title="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full z-50 mt-2 w-80 max-h-96 overflow-auto rounded-xl border shadow-xl ${
            isLight ? "bg-white border-slate-200" : "bg-nexus-900 border-white/10"
          }`}>
            <div className={`flex items-center justify-between px-3 py-2 border-b ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <span className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>Notifications</span>
              <button type="button" onClick={markAllRead} className="text-xs text-nexus-400 hover:text-nexus-300">
                Mark all read
              </button>
            </div>
            <div className="max-h-72 overflow-auto">
              {notifications.length === 0 ? (
                <p className={`px-4 py-6 text-center text-sm ${isLight ? "text-slate-500" : "text-white/50"}`}>No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-3 py-2 border-b last:border-b-0 transition ${
                      isLight ? "border-slate-100 hover:bg-slate-50" : "border-white/5 hover:bg-white/5"
                    } ${!n.read ? (isLight ? "bg-amber-50/50" : "bg-amber-500/5") : ""}`}
                  >
                    <p className={`text-sm font-medium ${isLight ? "text-slate-800" : "text-white"}`}>{n.title}</p>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-white/60"}`}>{n.body}</p>
                    <p className={`text-[10px] mt-1 ${isLight ? "text-slate-400" : "text-white/40"}`}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                    {n.type === "session_status_update" && (
                      <span
                        className={`ml-0 mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] ${
                          n.status === "Accepted"
                            ? (isLight ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-700" : "border-emerald-400/50 bg-emerald-500/20 text-emerald-200")
                            : n.status === "Completed"
                              ? (isLight ? "border-blue-400/50 bg-blue-500/15 text-blue-700" : "border-blue-400/50 bg-blue-500/20 text-blue-200")
                              : (isLight ? "border-amber-400/50 bg-amber-500/15 text-amber-700" : "border-amber-400/50 bg-amber-500/20 text-amber-200")
                        }`}
                      >
                        {n.status}
                      </span>
                    )}
                    {n.type === "friend_request" && (
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); acceptFriend(n.relatedId, n._id); }} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">Accept</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); rejectFriend(n.relatedId, n._id); }} className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
