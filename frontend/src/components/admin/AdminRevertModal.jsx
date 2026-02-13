import React from "react";
import axios from "axios";
import ModalShell from "../shared/ModalShell.jsx";

const AdminRevertModal = ({ revertModal, setRevertModal, authHeaders, setTransactions, setSelectedTransactionDetail }) => {
  if (!revertModal.open || !revertModal.tx) return null;
  const { tx, deductionAmount = 0 } = revertModal;
  const onClose = () => setRevertModal({ open: false, tx: null, deductionAmount: 0 });
  const handleConfirm = async () => {
    try {
      const { data } = await axios.patch(`/api/admin/transactions/${tx._id}/revert`, { deductionAmount }, { headers: authHeaders });
      setTransactions((prev) => prev.map((t) => (t._id === data._id ? data : t)));
      setSelectedTransactionDetail(data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <ModalShell open={true} onClose={onClose} contentClass="border-2 border-amber-400/40">
      <h3 className="text-base font-bold theme-accent mb-3">Revert payment to learner</h3>
      <p className="text-sm theme-muted mb-3">Optional: enter deduction amount to cover costs.</p>
      <label className="block text-sm font-medium theme-muted mb-1">Deduction amount</label>
      <input
        type="number"
        value={deductionAmount}
        onChange={(e) => setRevertModal((m) => ({ ...m, deductionAmount: Number(e.target.value || 0) }))}
        className="w-full rounded border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm theme-primary mb-4"
        min={0}
        step={0.01}
      />
      <div className="flex gap-2">
        <button type="button" onClick={handleConfirm} className="flex-1 rounded border border-amber-400/50 bg-amber-500/20 px-3 py-2 text-sm font-medium">Confirm</button>
        <button type="button" onClick={onClose} className="flex-1 rounded border border-slate-300 dark:border-white/20 px-3 py-2 text-sm">Cancel</button>
      </div>
    </ModalShell>
  );
};

export default AdminRevertModal;
