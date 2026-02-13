import React from "react";
import AdminConversation from "./messages/AdminConversation.jsx";

export default function AdminMessagesView({ messages, query = "", contentType = "all" }) {
  const conversations = new Map();
  const normalizedQuery = String(query || "").trim().toLowerCase();
  (messages || []).forEach((m) => {
    if (normalizedQuery) {
      const senderName = (m.senderId?.name || "").toLowerCase();
      const receiverName = (m.receiverId?.name || "").toLowerCase();
      const content = String(m.content || "").toLowerCase();
      const match = senderName.includes(normalizedQuery) || receiverName.includes(normalizedQuery) || content.includes(normalizedQuery);
      if (!match) return;
    }
    if (contentType && contentType !== "all") {
      const content = String(m.content || "");
      const edited = !!m.isEdited;
      const hasLink = /https?:\/\//i.test(content);
      const hasMention = /@[\w.-]+/i.test(content);
      const isLong = content.length >= 200;
      const passes =
        (contentType === "links" && hasLink) ||
        (contentType === "mentions" && hasMention) ||
        (contentType === "long" && isLong) ||
        (contentType === "edited" && edited);
      if (!passes) return;
    }
    const senderId = m.senderId?._id || m.senderId || "unknown";
    const receiverId = m.receiverId?._id || m.receiverId || "unknown";
    const senderName = m.senderId?.name || "Unknown";
    const receiverName = m.receiverId?.name || "Unknown";
    const key = [senderId, receiverId].sort().join("-");
    if (!conversations.has(key)) {
      conversations.set(key, {
        users: [senderName, receiverName],
        userIds: [senderId, receiverId],
        messages: [],
      });
    }
    conversations.get(key).messages.push(m);
  });

  const sortedConversations = Array.from(conversations.entries()).sort((a, b) => {
    const aLast = a[1].messages[a[1].messages.length - 1]?.createdAt || 0;
    const bLast = b[1].messages[b[1].messages.length - 1]?.createdAt || 0;
    return new Date(bLast) - new Date(aLast);
  });

  return (
    <section className="glass-card p-4">
      <h2 className="mb-4 text-sm font-semibold">All Platform Messages</h2>
      <p className="mb-4 text-xs text-white/60">Click a conversation to see full messages</p>
      <div className="space-y-4">
        {sortedConversations.map(([key, conv]) => (
          <AdminConversation key={key} conv={conv} />
        ))}
      </div>
    </section>
  );
}
