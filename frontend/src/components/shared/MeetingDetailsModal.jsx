import React from "react";
import axios from "axios";

const MeetingDetailsModal = ({ meetingModal, setMeetingModal, token, onSaved, showToast }) => {
  if (!meetingModal?.open) return null;
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setMeetingModal({ open: false, sessionId: null, link: "", when: "" })}>
      <div className="modal-content w-full max-w-md p-6 rounded-2xl border-2 border-blue-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-blue-200 mb-3">Meeting details</h3>
        <div className="space-y-3 text-sm">
          <div>
            <label className="theme-muted flex items-center gap-1"><span>🔗</span><span>Meeting link</span></label>
            <input value={meetingModal.link} onChange={(e) => setMeetingModal((m) => ({ ...m, link: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none" placeholder="https://meet.example.com/abc" />
          </div>
          <div>
            <label className="theme-muted flex items-center gap-2"><span>📅</span><span>⏰</span><span>Date & time</span></label>
            <input
              type="datetime-local"
              value={meetingModal.when}
              min={new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16)}
              onChange={(e) => setMeetingModal((m) => ({ ...m, when: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await axios.put(`/api/sessions/${meetingModal.sessionId}/meeting`, { meetingLink: meetingModal.link, scheduledFor: meetingModal.when }, { headers: { Authorization: `Bearer ${token}` } });
                  await onSaved();
                  setMeetingModal({ open: false, sessionId: null, link: "", when: "" });
                  showToast("Meeting updated", "success");
                } catch (err) {
                  showToast(err.response?.data?.message || "Failed to update", "error");
                }
              }}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium"
            >
              Save
            </button>
            <button type="button" onClick={() => setMeetingModal({ open: false, sessionId: null, link: "", when: "" })} className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;
