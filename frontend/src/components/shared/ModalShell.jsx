import React from "react";

const ModalShell = ({ open, onClose, children, contentClass = "", overlayClass = "" }) => {
  if (!open) return null;
  return (
    <div
      className={`modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 ${overlayClass}`}
      onClick={onClose}
    >
      <div
        className={`modal-content w-full max-w-md p-6 rounded-2xl ${contentClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
