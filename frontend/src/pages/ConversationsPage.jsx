import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/shared/Avatar.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

const ConversationsPage = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [conversations, setConversations] = useState([]);
  const [groupParticipants, setGroupParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    const load = async () => {
      try {
        const { data } = await axios.get("/api/messages", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(data.conversations || []);
        const [reqRes, teachRes] = await Promise.all([
          axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { requests: [] } })),
          axios.get("/api/sessions/my-teaching", { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { sessions: [] } }))
        ]);
        const groups = [];
        (reqRes.data.requests || []).forEach((s) => {
          const members = (s.groupMembers || []).map((m) => m.name || m.email || m.userId).filter(Boolean);
          if (members.length > 0) groups.push({ id: s._id, title: s.skillName, members });
        });
        (teachRes.data.sessions || []).forEach((s) => {
          const members = (s.groupMembers || []).map((m) => m.name || m.email || m.userId).filter(Boolean);
          if (members.length > 0) groups.push({ id: s._id, title: s.skillName, members });
        });
        setGroupParticipants(groups);
      } catch (err) {
        console.error("Load conversations error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, token]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Loading messages...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 px-4 py-6 text-xs sm:text-sm">
      <div className="glass-card px-4 py-3">
        <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Messages</p>
        <p className={`mt-1 text-sm font-semibold ${isLight ? "text-slate-800" : ""}`}>Conversations</p>
      </div>
      <section className="glass-card p-3">
        {conversations.length === 0 ? (
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>
            No conversations yet. Start by chatting from a teacher or learner profile.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {conversations.map((c) => (
              <li
                key={c.otherUser.id}
                className="flex cursor-pointer items-center justify-between gap-3 px-2 py-2 hover:bg-white/5"
                onClick={() => navigate(`/chat/${c.otherUser.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={c.otherUser?.profilePic} name={c.otherUser?.name} size="sm" />
                  <div>
                    <p className={`text-sm font-medium ${isLight ? "text-slate-800" : ""}`}>{c.otherUser.name}</p>
                    <p className={`mt-0.5 line-clamp-1 text-[11px] ${isLight ? "text-slate-600" : "text-white/70"}`}>
                      {c.lastMessage.isMine ? "You: " : ""}
                      {c.lastMessage.content}
                    </p>
                  </div>
                </div>
                <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-white/50"}`}>
                  {c.lastMessage.createdAt &&
                    new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="glass-card px-4 py-3">
        <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Messages</p>
        <p className={`mt-1 text-sm font-semibold ${isLight ? "text-slate-800" : ""}`}>Group sessions</p>
      </div>
      <section className="glass-card p-3">
        {groupParticipants.length === 0 ? (
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>No group participants yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {groupParticipants.map((g) => (
              <li key={g.id} className="px-2 py-2">
                <p className="text-sm font-medium">Group chat</p>
                <p className="text-[11px] theme-muted">Participants: {g.members.join(", ")}</p>
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const { data } = await axios.post(`/api/group-chats/session/${g.id}/create`, {}, { headers: { Authorization: `Bearer ${token}` } });
                        const chatId = data.chat?._id || data.chat?.id;
                        if (chatId) navigate(`/group/${chatId}`);
                      } catch (err) {
                        console.error("Open group chat error", err);
                      }
                    }}
                    className={`rounded border px-2 py-0.5 text-[11px] ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/20 text-white/80 hover:bg-white/10"}`}
                  >
                    Open group chat
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default ConversationsPage;

