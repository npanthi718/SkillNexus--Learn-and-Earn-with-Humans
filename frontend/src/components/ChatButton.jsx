import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";

const ChatButton = ({ otherUserId, className = "" }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={() => navigate(`/chat/${otherUserId}`)}
      className={`glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30 ${className}`}
    >
      Chat
    </button>
  );
};

export default ChatButton;
