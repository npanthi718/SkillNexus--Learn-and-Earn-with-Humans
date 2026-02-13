import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../components/shared/Toast.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";
import Avatar from "../components/shared/Avatar.jsx";

const quickReplies = [
  "Hi! Thanks for reaching out. How can I help?",
  "Can you share a bit more about your current level?",
  "Let’s schedule a quick 30-min session to get you unstuck."
];

const ChatPage = () => {
  const { otherUserId } = useParams();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meId, setMeId] = useState("");
  const [mePic, setMePic] = useState("");
  const [otherPic, setOtherPic] = useState("");
  const [otherName, setOtherName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteMenu, setShowDeleteMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, messageId: null });
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const { showToast } = useToast();

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    const load = async () => {
      try {
        const meRes = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const id = meRes.data.user._id;
        setMeId(id);
        setMePic(meRes.data.user.profilePic || "");
        const otherRes = await axios.get(`/api/users/${otherUserId}/public`);
        setOtherPic(otherRes.data.profilePic || "");
        setOtherName(otherRes.data.name || "");
        const { data } = await axios.get(`/api/messages/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(data.messages || []);
      } catch (err) {
        setError("Unable to load conversation");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, otherUserId, token]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const isSelfChat = meId && String(meId) === String(otherUserId);
  useEffect(() => {
    if (isSelfChat) {
      setError("You are messaging yourself");
    } else {
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelfChat]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setError("");
    try {
      const { data } = await axios.post(
        `/api/messages/${otherUserId}`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) => [...prev, data.message]);
      setInput("");
    } catch (err) {
      setError("Could not send message");
      showToast("Could not send message", "error");
    }
  };

  const handleEditMessage = (message) => {
    setEditingId(message._id);
    setEditContent(message.content);
  };

  const saveEdit = async (messageId) => {
    if (!editContent.trim()) {
      setEditingId(null);
      return;
    }
    setError("");
    try {
      const { data } = await axios.put(
        `/api/messages/${messageId}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...data.message, isEdited: true } : m))
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not edit message");
    }
  };

  const handleDeleteMessage = (messageId) => {
    setDeleteModal({ open: true, type: "single", messageId });
  };

  const handleDeleteAllMessages = () => {
    setDeleteModal({ open: true, type: "all", messageId: null });
  };

  const confirmDelete = async () => {
    setError("");
    try {
      if (deleteModal.type === "single") {
        await axios.delete(`/api/messages/${deleteModal.messageId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages((prev) => prev.filter((m) => m._id !== deleteModal.messageId));
      } else {
        await axios.delete("/api/messages/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages([]);
      }
      setDeleteModal({ open: false, type: null, messageId: null });
      setShowDeleteMenu(null);
    } catch (err) {
      setError("Could not delete message(s)");
    }
  };

  const canEditMessage = (message) => {
    const senderId = typeof message.senderId === "string" ? message.senderId : message.senderId?._id || "";
    if (senderId !== meId) return false;
    const messageTime = new Date(message.createdAt || message.timestamp);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return messageTime > fifteenMinutesAgo;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/70">Opening conversation...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 px-4 py-6 text-sm">
      <div className="glass-card flex items-center justify-between px-4 py-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.18em] ${isLight ? "text-slate-500" : "text-white/60"}`}>Messenger</p>
          <p className={`text-base font-semibold ${isLight ? "text-slate-800" : ""}`}>Pre-session chat</p>
        </div>
        <button
          type="button"
          onClick={handleDeleteAllMessages}
          className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30"
        >
          Delete All My Messages
        </button>
      </div>
      
      {isSelfChat && (
        <div className={`rounded-xl border px-4 py-3 ${isLight ? "border-amber-300 bg-amber-50 text-amber-700" : "border-amber-400/50 bg-amber-500/15 text-amber-200"}`}>
          <p className="text-xs font-semibold">You are messaging yourself</p>
          <p className="text-[11px] opacity-80">Use this chat to leave notes or reminders. Others won’t see these messages.</p>
        </div>
      )}

      {meId && otherUserId && String(meId) === String(otherUserId) && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          You are messaging yourself. This is visible only to you.
        </div>
      )}

      <section className="glass-card flex flex-1 flex-col p-4">
        <div className="chat-scroll flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
          {messages.length === 0 ? (
            <p className={`mt-10 text-center text-sm ${isLight ? "text-slate-500" : "text-white/60"}`}>
              No messages yet. Say hi and introduce yourself.
            </p>
          ) : (
            (() => {
              const rows = [];
              let lastDateLabel = "";
              messages.forEach((m) => {
                const dt = new Date(m.createdAt || m.timestamp);
                const today = new Date();
                const dateOnly = dt.toDateString();
                let label = dateOnly;
                const diffDays = Math.floor(
                  (today.setHours(0, 0, 0, 0) - new Date(dateOnly).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                if (diffDays === 0) label = "Today";
                else if (diffDays === 1) label = "Yesterday";

                if (label !== lastDateLabel) {
                  rows.push(
                    <div
                      key={`divider-${dateOnly}`}
                      className={`my-2 flex items-center justify-center text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}
                    >
                      <span className="rounded-full bg-white/5 px-3 py-0.5">{label}</span>
                    </div>
                  );
                  lastDateLabel = label;
                }

                const senderId = (typeof m.senderId === "object" && m.senderId?._id)
                  ? String(m.senderId._id)
                  : String(m.senderId || "");
                const isMine = senderId === String(meId);

                rows.push(
                  <div
                    key={m._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2 group`}
                  >
                    {!isMine && (
                      <Avatar src={otherPic} name={otherName} size="sm" />
                    )}
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
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMine
                              ? "bg-gradient-to-r from-nexus-500 to-purple-500 text-white"
                              : "bg-slate-600/40 dark:bg-white/10 text-slate-900 dark:text-white/90"
                          }`}
                        >
                          <p>{m.content}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>
                              {dt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                            {m.isEdited && (
                              <span className="text-[9px] text-white/50 italic">(edited)</span>
                            )}
                          </div>
                        </div>
                      )}
                      {isMine && editingId !== m._id && (
                        <div className="absolute right-0 top-0 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {canEditMessage(m) && (
                            <button
                              type="button"
                              onClick={() => handleEditMessage(m)}
                              className="rounded bg-white/20 px-2 py-1 text-[9px] text-white/80 hover:bg-white/30"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m._id)}
                            className="rounded bg-red-500/20 px-2 py-1 text-[9px] text-red-300 hover:bg-red-500/30"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {isMine && <Avatar src={mePic} name="Me" size="sm" />}
                  </div>
                );
              });
              return rows;
            })()
          )}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              type="button"
              onClick={() => sendMessage(qr)}
              className={`rounded-full border px-3 py-2 ${isLight ? "border-slate-300 text-slate-700 hover:bg-slate-100" : "border-white/15 text-white/80 hover:bg-white/10"}`}
            >
              {qr}
            </button>
          ))}
          <button
            type="button"
            onClick={() => sendMessage("✅ I have completed the payment. Please confirm. [Payment proof]")}
            className={`rounded-full border px-3 py-2 ${isLight ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-emerald-400/50 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"}`}
          >
            ✅ Payment done (send as proof)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isSelfChat ? "Write a note to yourself..." : "Write a message..."}
            className={`flex-1 rounded-full border px-3 py-2.5 text-sm outline-none ${isLight ? "border-slate-300 bg-slate-100 text-slate-900 focus:border-nexus-400 focus:ring-2 focus:ring-nexus-200" : "border-white/10 bg-black/40 ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"}`}
          />
          <button
            type="submit"
            className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-4 py-2 text-xs font-medium shadow-lg shadow-nexus-500/30"
          >
            Send
          </button>
        </form>
        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      </section>

      {/* Custom Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="glass-card w-full max-w-md p-6 border-2 border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {deleteModal.type === "all" ? "Delete All Messages" : "Delete Message"}
                </h3>
                <p className="text-xs text-white/60">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm text-white/90">
                {deleteModal.type === "all"
                  ? "Are you absolutely sure you want to permanently delete all your messages? This will remove all your messages from this conversation and cannot be recovered."
                  : "Are you sure you want to permanently delete this message? This action cannot be undone."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, type: null, messageId: null })}
                className="flex-1 rounded-xl border-2 border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:from-red-600 hover:to-red-700 transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ChatPage;

