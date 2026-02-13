import React from "react";
import axios from "axios";

const TeacherPricingModal = ({ teacherPricingModal, setTeacherPricingModal, token, onSaved, showToast }) => {
  if (!teacherPricingModal?.open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setTeacherPricingModal({ open: false, sessionId: null, isFree: false, budget: "" })}>
      <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-amber-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-200 mb-3">Edit pricing</h3>
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={teacherPricingModal.isFree} onChange={(e) => setTeacherPricingModal((m) => ({ ...m, isFree: e.target.checked }))} />
            <span>Free session</span>
          </label>
          {!teacherPricingModal.isFree && (
            <div>
              <label className="theme-muted">Budget</label>
              <input type="number" min={0} value={teacherPricingModal.budget} onChange={(e) => setTeacherPricingModal((m) => ({ ...m, budget: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" placeholder="200" />
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await axios.patch(`/api/sessions/${teacherPricingModal.sessionId}/pricing`, {
                    isFree: teacherPricingModal.isFree,
                    budget: teacherPricingModal.isFree ? 0 : Number(teacherPricingModal.budget || 0)
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  await onSaved();
                  setTeacherPricingModal({ open: false, sessionId: null, isFree: false, budget: "" });
                  showToast("Pricing updated", "success");
                } catch (err) {
                  showToast(err.response?.data?.message || "Failed to update pricing", "error");
                }
              }}
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-purple-500 px-4 py-2 text-sm font-medium"
            >
              Save
            </button>
            <button type="button" onClick={() => setTeacherPricingModal({ open: false, sessionId: null, isFree: false, budget: "" })} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPricingModal;
