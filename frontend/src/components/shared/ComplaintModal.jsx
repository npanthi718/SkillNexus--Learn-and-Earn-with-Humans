import React from "react";
import ModalShell from "./ModalShell.jsx";

const ComplaintModal = ({ complaintModal, setComplaintModal, handleSubmitComplaint, ImageUriInput }) => {
  return (
    <ModalShell
      open={complaintModal.open && !!complaintModal.tx}
      onClose={() => setComplaintModal({ open: false, tx: null, role: null, reason: "", proofUrls: "" })}
      contentClass="border-2 border-amber-400/40"
    >
      <h3 className="text-base font-bold theme-accent mb-3">Raise payment complaint</h3>
      <p className="text-sm theme-muted mb-3">Describe the issue. You can add proof URLs (one per line).</p>
      <label className="block text-sm font-medium theme-muted mb-1">Reason for complaint</label>
      <textarea
        value={complaintModal.reason}
        onChange={(e) => setComplaintModal((m) => ({ ...m, reason: e.target.value }))}
        className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-3"
        rows={3}
        placeholder="Describe the issue..."
      />
      <label className="block text-sm font-medium theme-muted mb-1">Proof URLs</label>
      <textarea
        value={complaintModal.proofUrls}
        onChange={(e) => setComplaintModal((m) => ({ ...m, proofUrls: e.target.value }))}
        className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-3"
        rows={3}
        placeholder="https://example.com/proof-1"
      />
      {ImageUriInput && (
        <>
          <label className="block text-sm font-medium theme-muted mb-1">Upload proof image</label>
          <ImageUriInput />
        </>
      )}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => setComplaintModal({ open: false, tx: null, role: null, reason: "", proofUrls: "" })} className="rounded border px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
        <button type="button" onClick={handleSubmitComplaint} className="glass-button bg-gradient-to-r from-amber-500 to-red-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-amber-500/30">Submit</button>
      </div>
    </ModalShell>
  );
};

export default ComplaintModal;
