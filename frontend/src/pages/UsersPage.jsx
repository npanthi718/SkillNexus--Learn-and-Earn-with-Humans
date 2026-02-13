import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import VisibilityMount from "../components/shared/VisibilityMount.jsx";
import Loader from "../components/shared/Loader.jsx";

const UsersPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [me, setMe] = useState(null);
  const [relations, setRelations] = useState({});
  const [viewTab, setViewTab] = useState("all");
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [mutualCounts, setMutualCounts] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  const load = async () => {
    setLoading(true);
    try {
      const reqs = [axios.get("/api/users/public", { params: { q } })];
      if (token) reqs.push(axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }));
      const [listRes, meRes] = await Promise.all(reqs);
      setUsers(listRes.data.users || []);
      setMe(meRes?.data?.user || null);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
    if (!token) return;
    const fetchRelations = async () => {
      try {
        const entries = await Promise.all(
          users.map((u) =>
            axios
              .get(`/api/users/relation/${u.id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then((res) => [u.id, res.data.status])
              .catch(() => [u.id, "none"])
          )
        );
        setRelations(Object.fromEntries(entries));
      } catch {}
    };
    if (users.length > 0) fetchRelations();
  }, [users]);
  useEffect(() => {
    if (!token) return;
    const loadExtra = async () => {
      try {
        const [friendsRes, reqsRes] = await Promise.all([
          axios.get("/api/users/friends", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { friends: [] } })),
          axios.get("/api/users/friend-requests", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { requests: [] } }))
        ]);
        setFriends(friendsRes.data.friends || []);
        setFriendRequests(reqsRes.data.requests || []);
      } catch {}
    };
    loadExtra();
  }, [token]);

  useEffect(() => {
    const run = async () => {
      try {
        if (!token || !me || viewTab !== "suggestions") return;
        const myFriendIds = new Set((friends || []).map((f) => String(f.id)));
        const candidates = (users || []).filter((u) => String(u.id) !== String(me._id)).slice(0, 12);
        const entries = await Promise.all(
          candidates.map((u) =>
            axios
              .get(`/api/users/${u.id}/public`)
              .then((res) => {
                const otherFriends = (res.data.friends || []).map((fid) => String(fid));
                const mutual = otherFriends.filter((fid) => myFriendIds.has(fid)).length;
                return [u.id, mutual];
              })
              .catch(() => [u.id, 0])
          )
        );
        setMutualCounts(Object.fromEntries(entries));
      } catch {}
    };
    run();
  }, [users, friends, me, viewTab, token]);

  const getStatus = (otherId) => relations[otherId] || "none";

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const tab = params.get("tab");
    if (tab && ["all", "suggestions", "friends", "requests"].includes(tab)) {
      setViewTab(tab);
    }
  }, [location.search]);

  const sendFriend = async (otherId) => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${otherId}/request`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get(`/api/users/relation/${otherId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRelations((prev) => ({ ...prev, [otherId]: data.status }));
    } catch {}
  };
  const acceptFriend = async (otherId) => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${otherId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get(`/api/users/relation/${otherId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRelations((prev) => ({ ...prev, [otherId]: data.status }));
    } catch {}
  };
  const cancelRequest = async (otherId) => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${otherId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get(`/api/users/relation/${otherId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRelations((prev) => ({ ...prev, [otherId]: data.status }));
    } catch {}
  };
  const unfriend = async (otherId) => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${otherId}/unfriend`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get(`/api/users/relation/${otherId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRelations((prev) => ({ ...prev, [otherId]: data.status }));
    } catch {}
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Discover users</p>
          <h2 className={`mt-1 text-lg font-semibold ${isLight ? "text-slate-800" : ""}`}>People on SkillNexus {me && <span className="ml-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">Logged in</span>}</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`hidden sm:inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"}`}
          aria-label="Go back"
        >
          ← Back
        </button>
        <input
          type="text"
          placeholder="Search by name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900" : "border-white/10 bg-black/30 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button type="button" onClick={() => setViewTab("all")} className={`rounded-full px-3 py-1 border ${viewTab === "all" ? "border-nexus-400/60 bg-nexus-500/20 text-nexus-200" : "border-white/20"}`}>All</button>
        <button type="button" onClick={() => setViewTab("suggestions")} className={`rounded-full px-3 py-1 border ${viewTab === "suggestions" ? "border-purple-400/60 bg-purple-500/20 text-purple-200" : "border-white/20"}`}>Suggestions</button>
        <button type="button" onClick={() => setViewTab("requests")} className={`rounded-full px-3 py-1 border ${viewTab === "requests" ? "border-amber-400/60 bg-amber-500/20 text-amber-200" : "border-white/20"}`}>Requests {friendRequests.length > 0 ? `(${friendRequests.length})` : ""}</button>
        <button type="button" onClick={() => setViewTab("friends")} className={`rounded-full px-3 py-1 border ${viewTab === "friends" ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200" : "border-white/20"}`}>Friends {friends.length > 0 ? `(${friends.length})` : ""}</button>
      </div>
      {loading ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Loading users...</p>
      ) : viewTab === "friends" ? (
        <VisibilityMount placeholder={<Loader size="xs" />}>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((f) => (
            <article key={f.id} className="glass-card p-4 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={f.profilePic} size="md" />
                <div>
                  <button type="button" onClick={() => navigate(`/profile/${f.id}`)} className="font-semibold theme-primary hover:underline">{f.name}</button>
                  <span className="ml-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">Friend</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => navigate(`/chat/${f.id}`)} className="rounded-full border border-white/15 px-3 py-0.5 text-[11px] text-white/80 hover:bg-white/10">Chat</button>
              </div>
            </article>
            ))}
          </section>
        </VisibilityMount>
      ) : viewTab === "requests" ? (
        friendRequests.length === 0 ? (
          <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>No pending requests.</p>
        ) : (
          <VisibilityMount placeholder={<Loader size="xs" />}>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {friendRequests.map((r) => (
              <article key={r.fromUserId} className="glass-card p-4 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={r.profilePic} size="md" />
                  <div>
                    <button type="button" onClick={() => navigate(`/profile/${r.fromUserId}`)} className="font-semibold theme-primary hover:underline">{r.name}</button>
                    <span className="ml-2 rounded-full border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">Request</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => acceptFriend(r.fromUserId)} className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-0.5 text-[11px] text-emerald-200">Accept</button>
                  <button type="button" onClick={() => navigate(`/profile/${r.fromUserId}`)} className="rounded-full border border-white/15 px-3 py-0.5 text-[11px] text-white/80 hover:bg-white/10">View</button>
                </div>
              </article>
              ))}
            </section>
          </VisibilityMount>
        )
      ) : users.length === 0 ? (
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>No users found.</p>
      ) : (
        <VisibilityMount placeholder={<Loader size="xs" />}>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(users || []).filter((u) => {
            const isMe = me && String(me._id) === String(u.id);
            if (viewTab === "suggestions") {
              const st = getStatus(u.id);
              return !isMe && st !== "friends" && st !== "sent" && st !== "received";
            }
            return !isMe;
          }).map((u) => {
            const status = getStatus(u.id);
            const isMe = me && String(me._id) === String(u.id);
            return (
              <article key={u.id} className="glass-card p-4 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={u.profilePic} size="md" />
                  <div>
                    <button type="button" onClick={() => navigate(`/profile/${u.id}`)} className="font-semibold theme-primary hover:underline">{u.name}</button>
                    <p className="text-[11px] theme-muted">{(u.teachingLanguages || []).join(", ")}</p>
                    {viewTab === "suggestions" && typeof mutualCounts[u.id] === "number" && mutualCounts[u.id] > 0 && (
                      <span className="mt-1 inline-block rounded-full border border-purple-400/50 bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-200">
                        {mutualCounts[u.id]} mutual friend{mutualCounts[u.id] > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm">{u.bio || "—"}</p>
                <div className="mt-3 flex items-center gap-2">
                  {isMe && (
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-0.5 text-[11px] text-emerald-200">This is you</span>
                  )}
                  {status === "friends" ? (
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-0.5 text-[11px] text-emerald-200">Friends</span>
                  ) : status === "sent" ? (
                    <>
                      <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-0.5 text-[11px] text-amber-200">Request sent</span>
                      <button type="button" onClick={() => cancelRequest(u.id)} className="rounded-full border border-white/15 px-3 py-0.5 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
                    </>
                  ) : status === "received" ? (
                    <>
                      <button type="button" onClick={() => acceptFriend(u.id)} className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-0.5 text-[11px] text-emerald-200">Accept request</button>
                      <button type="button" onClick={() => navigate(`/profile/${u.id}`)} className="rounded-full border border-white/15 px-3 py-0.5 text-[11px] text-white/80 hover:bg-white/10">View</button>
                    </>
                  ) : (
                    !isMe && <button type="button" onClick={() => sendFriend(u.id)} className="rounded-full border border-white/15 px-3 py-0.5 text-[11px] text-white/80 hover:bg-white/10">Add friend</button>
                  )}
                  {status === "friends" && (
                    <button type="button" onClick={() => unfriend(u.id)} className="rounded-full border border-red-400/50 bg-red-500/20 px-3 py-0.5 text-[11px] text-red-200">Unfriend</button>
                  )}
                  {!isMe && <button type="button" onClick={() => navigate(`/chat/${u.id}`)} className="rounded-full border border-white/15 px-3 py-0.5 text-[11px] text-white/80 hover:bg-white/10">Chat</button>}
                </div>
              </article>
            );
          })}
          </section>
        </VisibilityMount>
      )}
    </main>
  );
};

export default UsersPage;
