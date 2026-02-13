import React, { useState } from "react";
import axios from "axios";
import { parseList } from "../../../utils/form.js";
import { useToast } from "../../shared/Toast.jsx";

const AdminExpendituresPanel = ({ expenditures, setExpenditures, authHeaders }) => {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const { showToast } = useToast();

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-3">Expenditure (besides teacher payouts)</h3>
      <form
        className="flex flex-wrap gap-2 mb-3 items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const amount = Number(fd.get("amount"));
          const category = fd.get("category") || "other";
          const description = fd.get("description") || "";
          const tags = parseList(fd.get("tags"));
          const attachments = parseList(fd.get("attachments"));
          try {
            if (!Number.isFinite(amount) || amount < 0) {
              showToast("Amount must be a non-negative number", "error");
              return;
            }
            const { data } = await axios.post("/api/admin/expenditures", { amount, category, description, tags, attachments }, { headers: authHeaders });
            setExpenditures((prev) => [data, ...prev]);
            e.target.reset();
            showToast("Expenditure added", "success");
          } catch (err) {
            const msg = err.response?.data?.message || "Failed to add expenditure";
            showToast(msg, "error");
          }
        }}
      >
        <div>
          <label className="block text-[11px] theme-muted mb-1">Amount</label>
          <input type="number" name="amount" placeholder="0.00" min={0} step={0.01} className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-32" required />
        </div>
        <div>
          <label className="block text-[11px] theme-muted mb-1">Category</label>
          <input type="text" name="category" placeholder="Category" className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-36" />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-[11px] theme-muted mb-1">Tags (comma)</label>
          <input type="text" name="tags" placeholder="education,infra" className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-full" />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="block text-[11px] theme-muted mb-1">Receipt URLs (comma)</label>
          <input type="text" name="attachments" placeholder="https://..." className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-full" />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="block text-[11px] theme-muted mb-1">Description</label>
          <input type="text" name="description" placeholder="Short note" className="rounded border border-slate-300 dark:border-white/20 bg-black/30 px-2 py-1 text-xs w-full" />
        </div>
        <button type="submit" className="rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-xs">Add</button>
      </form>

      <div className="mb-2 flex flex-wrap gap-2">
        <input type="text" placeholder="Filter category" className="rounded border border-white/20 px-2 py-1 text-[11px]" onChange={(e) => setCategoryFilter(e.target.value)} />
        <input type="text" placeholder="Filter tag" className="rounded border border-white/20 px-2 py-1 text-[11px]" onChange={(e) => setTagFilter(e.target.value)} />
      </div>
      <div className="max-h-56 overflow-auto space-y-2 text-xs">
        {expenditures
          .filter((e) => !categoryFilter || String(e.category || "").toLowerCase().includes(categoryFilter.toLowerCase()))
          .filter((e) => !tagFilter || (Array.isArray(e.tags) && e.tags.some((t) => String(t).toLowerCase().includes(tagFilter.toLowerCase()))))
          .map((e) => (
          <div key={e._id} className="rounded border border-white/10 p-2">
            <div className="flex justify-between items-center">
              <span>${e.amount} · {e.category} · {e.description || "—"}</span>
              <span className="text-[10px] theme-muted">{new Date(e.date).toLocaleDateString()}</span>
            </div>
            {(e.tags?.length > 0 || e.attachments?.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {e.tags?.map((t, i) => (
                  <span key={`t-${i}`} className="rounded bg-white/10 px-2 py-0.5 text-[10px]">{t}</span>
                ))}
                {e.attachments?.map((u, i) => (
                  <a key={`a-${i}`} href={u} target="_blank" rel="noopener noreferrer" className="rounded border border-nexus-400/50 px-2 py-0.5 text-[10px]">Receipt {i + 1}</a>
                ))}
              </div>
            )}
          </div>
        ))}
        {expenditures.length === 0 && <p className="theme-muted py-2">No expenditures recorded.</p>}
      </div>
    </div>
  );
};

export default AdminExpendituresPanel;
