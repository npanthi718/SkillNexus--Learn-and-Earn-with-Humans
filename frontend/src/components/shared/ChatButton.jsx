import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";

const ChatButton = ({ otherUserId, className = "", requireAuth }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const handle = () => {
    if (typeof requireAuth === "function") {
      const ok = requireAuth();
      if (!ok) return;
    }
    navigate(`/chat/${otherUserId}`);
  };
  return (
    <button
      type="button"
      onClick={handle}
      className={`glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30 ${className}`}
    >
      Chat
    </button>
  );
};

export default ChatButton;
