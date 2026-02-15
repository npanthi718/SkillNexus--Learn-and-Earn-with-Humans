import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "./Toast.jsx";

const NotificationBell = ({ token, isLight }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { showToast } = useToast();

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      let localStatuses = {};
      try {
        const raw = localStorage.getItem("sn_friend_statuses");
        localStatuses = raw ? JSON.parse(raw) : {};
      } catch {}
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
      const canceledRelated = new Set(
        dedup
          .filter((n) => n.type === "friend_request_canceled")
          .map((n) => String(n.relatedId || ""))
      );
      const cleaned = dedup.filter((n) => {
        const id = String(n.relatedId || "");
        if (n.type === "friend_request" && canceledRelated.has(id)) return false;
        return true;
      });
      const serverProcessed = new Map();
      for (const n of cleaned) {
        const id = String(n.relatedId || "");
        const t = String(n.type || "");
        const title = String(n.title || "");
        const body = String(n.body || "");
        if (t === "friend_request_accepted" || (/friend request/i.test(title) && /accepted/i.test(title + " " + body))) {
          serverProcessed.set(id, "accepted");
        } else if (t === "friend_request_rejected" || (/friend request/i.test(title) && /(rejected|declined)/i.test(title + " " + body))) {
          serverProcessed.set(id, "rejected");
        } else if (t === "friend_removed" || t === "friend_unfriended" || /unfriend/i.test(title + " " + body)) {
          serverProcessed.set(id, "unfriended");
        }
      }
      setNotifications((prev) => {
        const processedMap = new Map(
          (prev || [])
            .filter((p) => p.type === "friend_request" && p.processed)
            .map((p) => [String(p.relatedId || ""), p.processed])
        );
        const merged = cleaned.map((n) => {
          if (n.type === "friend_request") {
            const id = String(n.relatedId || "");
            const p = serverProcessed.get(id) || processedMap.get(id) || localStatuses[id];
            if (p) return { ...n, processed: p, read: true };
          }
          return n;
        });
        const final = merged.filter((n) => {
          const id = String(n.relatedId || "");
          if (n.type !== "friend_request" && (processedMap.has(id) || serverProcessed.has(id) || localStatuses[id])) return false;
          return true;
        });
        return final;
      });
      setUnreadCount(
        (cleaned.filter((n) => !n.read).length) || 0
      );
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    const refreshHandler = () => fetchNotifications();
    const focusHandler = () => fetchNotifications();
    const visibilityHandler = () => { if (!document.hidden) fetchNotifications(); };
    const cancelHandler = (e) => {
      const otherId = e?.detail?.otherId;
      if (!otherId) return;
      setNotifications((prev) => prev.filter((n) => !(n.type === "friend_request" && String(n.relatedId || "") === String(otherId))));
      setUnreadCount((c) => Math.max(0, c - 1));
    };
    let es = null;
    if (typeof window !== "undefined") {
      window.addEventListener("sn:notifications:refresh", refreshHandler);
      window.addEventListener("sn:friend_request:cancel", cancelHandler);
      window.addEventListener("focus", focusHandler);
      document.addEventListener("visibilitychange", visibilityHandler);
    }
    return () => {
      clearInterval(interval);
      try { es && es.close(); } catch {}
      if (typeof window !== "undefined") {
        window.removeEventListener("sn:notifications:refresh", refreshHandler);
        window.removeEventListener("sn:friend_request:cancel", cancelHandler);
        window.removeEventListener("focus", focusHandler);
        document.removeEventListener("visibilitychange", visibilityHandler);
      }
    };
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
    markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };
  const acceptFriend = async (otherId, notifId) => {
    try {
      setBusyId(notifId);
      await axios.post(`/api/users/friends/${otherId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notifId) markRead(notifId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notifId
            ? { ...n, read: true, processed: "accepted", title: "Friend request accepted", body: "You are friends now." }
            : n
        )
      );
      try {
        const raw = localStorage.getItem("sn_friend_statuses");
        const map = raw ? JSON.parse(raw) : {};
        map[String(otherId)] = "accepted";
        localStorage.setItem("sn_friend_statuses", JSON.stringify(map));
      } catch {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("sn:notifications:refresh"));
      }
      showToast("Friend request accepted", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not accept request", "error");
    }
    finally {
      setBusyId(null);
    }
  };
  const rejectFriend = async (otherId, notifId) => {
    try {
      setBusyId(notifId);
      await axios.post(`/api/users/friends/${otherId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (notifId) markRead(notifId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notifId
            ? { ...n, read: true, processed: "rejected", title: "Friend request rejected", body: "Request declined." }
            : n
        )
      );
      try {
        const raw = localStorage.getItem("sn_friend_statuses");
        const map = raw ? JSON.parse(raw) : {};
        map[String(otherId)] = "rejected";
        localStorage.setItem("sn_friend_statuses", JSON.stringify(map));
      } catch {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("sn:notifications:refresh"));
      }
      showToast("Friend request rejected", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not reject request", "error");
    }
    finally {
      setBusyId(null);
    }
  };

  if (!token) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) {
            fetchNotifications();
            const fast = setInterval(fetchNotifications, 3000);
            const stop = () => { clearInterval(fast); window.removeEventListener("sn:notifications:panel-close", stop); };
            window.addEventListener("sn:notifications:panel-close", stop);
          } else {
            window.dispatchEvent(new Event("sn:notifications:panel-close"));
          }
        }}
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
                    {n.type === "friend_request" && !n.processed && (
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={busyId === n._id} onClick={(e) => { e.stopPropagation(); acceptFriend(n.relatedId, n._id); }} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200 disabled:opacity-60">Accept</button>
                        <button type="button" disabled={busyId === n._id} onClick={(e) => { e.stopPropagation(); rejectFriend(n.relatedId, n._id); }} className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200 disabled:opacity-60">Reject</button>
                      </div>
                    )}
                    {n.type === "friend_request" && n.processed && (
                      <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] ${
                        n.processed === "accepted"
                          ? (isLight ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-700" : "border-emerald-400/50 bg-emerald-500/20 text-emerald-200")
                          : n.processed === "rejected"
                            ? (isLight ? "border-red-400/50 bg-red-500/15 text-red-700" : "border-red-400/50 bg-red-500/20 text-red-200")
                            : (isLight ? "border-slate-400/50 bg-slate-500/15 text-slate-700" : "border-slate-400/50 bg-slate-500/20 text-slate-200")
                      }`}>
                        {n.processed === "accepted" ? "Accepted" : n.processed === "rejected" ? "Rejected" : "Unfriended"}
                      </span>
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
