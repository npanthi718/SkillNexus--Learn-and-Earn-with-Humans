import React from "react";

const ComplaintsList = ({ complaints, setSelectedTransactionDetail, setResolveReassignModal, setRevertModal }) => {
  return (
    <div className="glass-card p-4 rounded-xl mt-6">
      <h2 className="mb-3 text-sm font-semibold">Payment complaints</h2>
      {complaints.length === 0 ? (
        <p className="theme-muted text-xs py-2">No complaints yet.</p>
      ) : (
        <div className="max-h-[300px] overflow-auto space-y-2 text-xs">
          {complaints.map((c) => (
            <div key={c._id} className="rounded-lg border border-white/10 dark:border-slate-300/30 p-3 theme-primary">
              <p><span className="theme-muted">By:</span> {c.raisedBy?.name} ({c.role}) · <span className="theme-muted">Status:</span> {c.status}</p>
              <p className="mt-1 theme-muted">{c.reason}</p>
              {c.transaction && <p className="mt-1">Tx: {c.transaction.learnerId?.name} → {c.transaction.teacherId?.name} · {c.transaction.skillName}</p>}
              {(c.proofUrls?.length > 0 || c.proofSubmittedByAdmin?.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {[...(c.proofUrls || []), ...(c.proofSubmittedByAdmin || [])].map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-nexus-400 dark:text-nexus-300 underline text-[10px]">Proof {i + 1}</a>
                  ))}
                </div>
              )}
              <div className="mt-2 flex gap-1">
                <button type="button" onClick={() => c.transaction && setSelectedTransactionDetail(c.transaction)} className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px]">View tx</button>
                {c.status !== "resolved" && c.status !== "reverted" && c.transaction?.status !== "paid_to_teacher" && (
                  <button type="button" onClick={() => setResolveReassignModal({ open: true, complaint: c, meetingLink: "" })} className="rounded border border-emerald-400/50 px-2 py-0.5 text-[10px]">Resolve & pay</button>
                )}
                {c.status !== "resolved" && c.status !== "reverted" && c.transaction && (
                  <button type="button" onClick={() => setRevertModal({ open: true, tx: c.transaction, deductionAmount: 0 })} className="rounded border border-amber-400/50 px-2 py-0.5 text-[10px]">Revert</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintsList;
