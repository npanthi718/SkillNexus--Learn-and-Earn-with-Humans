import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/shared/Avatar.jsx";

const GroupChatPage = () => {
  const { groupId } = useParams();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [chatMeta, setChatMeta] = useState({ name: "" });
  const [members, setMembers] = useState([]);
  const [meId, setMeId] = useState("");
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  useEffect(() => {
    if (!token) { navigate("/auth"); return; }
    const load = async () => {
      try {
        const meRes = await axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        setMeId(meRes.data.user._id);
        const { data } = await axios.get(`/api/group-chats/${groupId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        setMessages(data.messages || []);
        setChatMeta(data.chat || { name: "" });
        setMembers(data.chat?.members || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load group chat");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, navigate, token]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    try {
      const { data } = await axios.post(`/api/group-chats/${groupId}/messages`, { content: text }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => [...prev, { ...data.message, senderId: { _id: meId } }]);
      setInput("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send message");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const canEditMessage = (message) => {
    const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId?._id || "";
    if (senderId !== meId) return false;
    const messageTime = new Date(message.createdAt || message.timestamp);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return messageTime > fifteenMinutesAgo;
  };

  const saveEdit = async (messageId) => {
    if (!editContent.trim()) { setEditingId(null); return; }
    try {
      const { data } = await axios.put(`/api/group-chats/messages/${messageId}`, { content: editContent }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...data.message, senderId: m.senderId } : m)));
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not edit message");
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className={`text-sm ${isLight ? "text-slate-600" : "text-white/70"}`}>Opening group chat...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 px-4 py-6 text-sm">
      <div className="glass-card flex items-center justify-between px-4 py-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Messenger</p>
          <p className={`text-base font-semibold ${isLight ? "text-slate-800" : ""}`}>Group: {chatMeta.name || "Study Group"}</p>
          {members.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              {members.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center gap-1">
                  <Avatar src={m.profilePic} name={m.name} size="xs" />
                  <span className={`text-[10px] ${isLight ? "text-slate-600" : "text-white/70"}`}>{m.name}</span>
                </div>
              ))}
              {members.length > 6 && (
                <span className="text-[10px] text-white/50">+{members.length - 6} more</span>
              )}
            </div>
          )}
        </div>
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg border px-3 py-1 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10">← Back</button>
      </div>

      <section className="glass-card flex flex-1 flex-col p-4">
        <div className="chat-scroll flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
          {messages.length === 0 ? (
            <p className={`mt-10 text-center text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
              No messages yet. Introduce yourselves and share goals.
            </p>
          ) : (
            messages.map((m) => {
              const dt = new Date(m.createdAt || m.timestamp);
              const senderId = (typeof m.senderId === "object" && m.senderId?._id)
                ? String(m.senderId._id)
                : String(m.senderId || "");
              const isMine = senderId === String(meId);
              const avatarSrc = m.senderId?.profilePic || "";
              const avatarName = m.senderId?.name || (isMine ? "Me" : "Member");
              return (
                <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2 group`}>
                  {!isMine && <Avatar src={avatarSrc} name={avatarName} size="sm" />}
                  <div className="relative">
                    {editingId === m._id ? (
                      <div className="max-w-[80%] rounded-2xl bg-white/10 p-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg bg-black/40 px-3 py-2 text-sm outline-none"
                          autoFocus
                          onBlur={() => saveEdit(m._id)}
                          onKeyDown={(e) => {
                            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                              saveEdit(m._id);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                              setEditContent("");
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white" : "bg-slate-600/40 dark:bg-white/10 text-slate-900 dark:text-white/90"}`}>
                        <p>{m.content}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>
                            {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {m.isEdited && <span className="text-[9px] text-white/50 italic">(edited)</span>}
                        </div>
                      </div>
                    )}
                    {isMine && editingId !== m._id && (
                      <div className="absolute right-0 top-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {canEditMessage(m) && (
                          <button type="button" onClick={() => { setEditingId(m._id); setEditContent(m.content); }} className="rounded bg-white/20 px-2 py-1 text-[9px] text-white/80 hover:bg-white/30">
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {isMine && <Avatar src={avatarSrc} name="Me" size="sm" />}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a group message..."
            className={`flex-1 rounded-full border px-3 py-2.5 text-sm outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900 focus:border-nexus-400 focus:ring-2 focus:ring-nexus-200" : "border-white/10 bg-black/40 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
          />
          <button type="submit" className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-4 py-2 text-xs font-medium shadow-lg shadow-nexus-500/30">
            Send
          </button>
        </form>
        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      </section>
    </main>
  );
};

export default GroupChatPage;
