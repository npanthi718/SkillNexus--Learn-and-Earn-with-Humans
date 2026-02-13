import React from "react";
import axios from "axios";
import ModalShell from "../shared/ModalShell.jsx";

const AdminResolveReassignModal = ({
  resolveReassignModal,
  setResolveReassignModal,
  authHeaders,
  setTransactions,
  setSelectedTransactionDetail,
  setComplaints
}) => {
  if (!resolveReassignModal.open || !resolveReassignModal.complaint) return null;
  const c = resolveReassignModal.complaint;
  const onClose = () => setResolveReassignModal({ open: false, complaint: null, meetingLink: "" });
  const handleConfirm = async () => {
    try {
      const { data } = await axios.patch(
        `/api/admin/complaints/${c._id}/resolve-reassign`,
        { meetingLink: resolveReassignModal.meetingLink },
        { headers: authHeaders }
      );
      setTransactions((prev) => prev.map((t) => t._id === data.transaction._id ? data.transaction : t));
      setSelectedTransactionDetail(data.transaction);
      setComplaints((prev) => prev.map((x) => x._id === c._id ? { ...x, ...data.complaint } : x));
      onClose();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <ModalShell open={true} onClose={onClose} contentClass="border-2 border-emerald-400/40">
      <h3 className="text-base font-bold theme-accent mb-3">Resolve complaint & pay teacher</h3>
      <p className="text-sm theme-muted mb-3">Add new meeting link, then mark as paid:</p>
      <input
        type="text"
        value={resolveReassignModal.meetingLink}
        onChange={(e) => setResolveReassignModal((m) => ({ ...m, meetingLink: e.target.value }))}
        className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-4"
        placeholder="Meeting link (optional)"
      />
      <div className="flex gap-2">
        <button type="button" onClick={handleConfirm} className="flex-1 rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-2 text-sm font-medium">Confirm & pay teacher</button>
        <button type="button" onClick={onClose} className="flex-1 rounded border border-slate-300 dark:border-white/20 px-3 py-2 text-sm">Cancel</button>
      </div>
    </ModalShell>
  );
};

export default AdminResolveReassignModal;
