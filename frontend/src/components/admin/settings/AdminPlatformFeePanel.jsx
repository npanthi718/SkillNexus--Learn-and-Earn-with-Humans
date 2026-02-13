import React from "react";
import axios from "axios";
import { useToast } from "../../shared/Toast.jsx";

const AdminPlatformFeePanel = ({ platformConfig, setPlatformConfig, authHeaders }) => {
  const { showToast } = useToast();
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-3">Platform Fee</h3>
      <div className="flex items-end gap-2">
        <div>
          <label className="text-[11px] theme-muted">Fee percent</label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={platformConfig?.platformFeePercent ?? 10}
            onChange={(e) => setPlatformConfig((p) => ({ ...(p || {}), platformFeePercent: Number(e.target.value) }))}
            onBlur={async (e) => {
              try {
                const { data } = await axios.put("/api/admin/platform-config", { platformFeePercent: Number(e.target.value) }, { headers: authHeaders });
                setPlatformConfig(data.config);
                showToast("Platform fee updated", "success");
              } catch (err) {
                showToast(err.response?.data?.message || "Failed to update fee", "error");
              }
            }}
            className="ml-2 w-24 rounded bg-black/40 px-2 py-1 text-xs outline-none"
          />
        </div>
        <span className="text-[11px] theme-muted">% deducted from learner payment</span>
      </div>
    </div>
  );
};

export default AdminPlatformFeePanel;
