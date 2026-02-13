import React from "react";

const OfferPreviewModal = ({ offerPreview, onCancel, onConfirm }) => {
  if (!offerPreview?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-5 text-xs sm:text-sm">
        <h3 className="text-sm font-semibold">Payment preview</h3>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between items-center"><span className="theme-muted">You pay</span><span className="font-semibold">{offerPreview.payerCur} {Number(offerPreview.learnerPays).toLocaleString()}</span></div>
          <div className="flex justify-between items-center"><span className="theme-muted">Platform fee</span><span className="font-semibold">NPR {Number(offerPreview.feeNPR).toLocaleString()}</span></div>
          <div className="flex justify-between items-center"><span className="theme-muted">Net in NPR</span><span className="font-semibold">NPR {Number(offerPreview.netNPR).toLocaleString()}</span></div>
          <div className="flex justify-between items-center"><span className="theme-muted">Teacher receives</span><span className="font-semibold">{offerPreview.payoutCur} {Number(offerPreview.teacherReceives).toLocaleString()}</span></div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded border px-3 py-1 text-[11px] text-white/80 hover:bg:white/10">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-3 py-1 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
          >
            Confirm accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferPreviewModal;
