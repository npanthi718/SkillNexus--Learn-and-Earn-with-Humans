import React from "react";
import axios from "axios";

const LearnerEditModal = ({ learnerEditModal, setLearnerEditModal, token, onSaved, showToast }) => {
  if (!learnerEditModal?.open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setLearnerEditModal({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" })}>
      <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-blue-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-blue-200 mb-3">Edit request</h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="theme-muted">Skill</label>
            <input value={learnerEditModal.skillName} onChange={(e) => setLearnerEditModal((m) => ({ ...m, skillName: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" />
          </div>
          <div>
            <label className="theme-muted">Details</label>
            <textarea value={learnerEditModal.details} onChange={(e) => setLearnerEditModal((m) => ({ ...m, details: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" rows={3} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={learnerEditModal.isFree} onChange={(e) => setLearnerEditModal((m) => ({ ...m, isFree: e.target.checked }))} />
              <span className="text-xs">Free help</span>
            </label>
            {!learnerEditModal.isFree && (
              <input type="number" min={0} value={learnerEditModal.budget} onChange={(e) => setLearnerEditModal((m) => ({ ...m, budget: e.target.value }))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none w-28" placeholder="200" />
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={async () => {
                if (!learnerEditModal.request) return;
                try {
                  await axios.put(`/api/sessions/requests/${learnerEditModal.request._id}`, {
                    skillName: learnerEditModal.skillName,
                    details: learnerEditModal.details,
                    isFree: learnerEditModal.isFree,
                    budget: learnerEditModal.isFree ? 0 : Number(learnerEditModal.budget || 0)
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  await onSaved();
                  setLearnerEditModal({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" });
                  showToast("Request updated", "success");
                } catch (err) {
                  showToast(err.response?.data?.message || "Failed to update", "error");
                }
              }}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium"
            >
              Save
            </button>
            <button type="button" onClick={() => setLearnerEditModal({ open: false, request: null, skillName: "", details: "", isFree: false, budget: "" })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnerEditModal;
