import React from "react";
import axios from "axios";
import ImageUriInput from "../../shared/ImageUriInput.jsx";

const AdminPlatformConfigPanel = ({ platformConfig, setPlatformConfig, authHeaders }) => {
  return (
    <>
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Logo</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <ImageUriInput
            value={platformConfig?.logoUrl || ""}
            uploadType="logo"
            onChange={async (v) => {
              try {
                await axios.put("/api/admin/platform-config", { ...(platformConfig || {}), logoUrl: v }, { headers: authHeaders });
                setPlatformConfig((p) => ({ ...(p || {}), logoUrl: v }));
              } catch (e) {
                console.error(e);
              }
            }}
            placeholder="Logo URL or upload"
          />
          {platformConfig?.logoUrl && (
            <div className="rounded border border-white/10 bg-black/20 p-3 flex items-center justify-center">
              <img src={platformConfig.logoUrl} alt="Logo preview" className="max-h-40 md:max-h-56" onError={(e) => (e.target.style.display = "none")} />
            </div>
          )}
        </div>
      </div>
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Google Sign‑in</h3>
        <p className="text-xs theme-muted mb-2">Paste your Google Identity Services client id to enable “Continue with Google”.</p>
        <input
          type="text"
          value={platformConfig?.googleClientId || ""}
          onChange={(e) => setPlatformConfig((p) => ({ ...(p || {}), googleClientId: e.target.value }))}
          onBlur={async (e) => {
            try {
              const { data } = await axios.put("/api/admin/platform-config", { googleClientId: e.target.value }, { headers: authHeaders });
              setPlatformConfig(data.config);
            } catch (err) {
              console.error(err);
            }
          }}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
          placeholder="e.g. 1234567890-abc.apps.googleusercontent.com"
        />
      </div>
    </>
  );
};

export default AdminPlatformConfigPanel;
