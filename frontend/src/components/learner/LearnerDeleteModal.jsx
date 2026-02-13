import React from "react";
import axios from "axios";

const LearnerDeleteModal = ({ learnerDeleteModal, setLearnerDeleteModal, token, onDeleted, showToast }) => {
  if (!learnerDeleteModal?.open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setLearnerDeleteModal({ open: false, requestId: null })}>
      <div className="modal-content w-full max-w-sm p-6 rounded-2xl border-2 border-red-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-red-200 mb-2">Delete request?</h3>
        <p className="text-sm text-white/70">This action cannot be undone.</p>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => setLearnerDeleteModal({ open: false, requestId: null })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
          <button
            type="button"
            onClick={async () => {
              if (!learnerDeleteModal.requestId) return;
              try {
                await axios.delete(`/api/sessions/requests/${learnerDeleteModal.requestId}`, { headers: { Authorization: `Bearer ${token}` } });
                await onDeleted(learnerDeleteModal.requestId);
                setLearnerDeleteModal({ open: false, requestId: null });
                showToast("Request deleted", "success");
              } catch (err) {
                showToast(err.response?.data?.message || "Failed to delete", "error");
              }
            }}
            className="flex-1 rounded-lg border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm text-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnerDeleteModal;
