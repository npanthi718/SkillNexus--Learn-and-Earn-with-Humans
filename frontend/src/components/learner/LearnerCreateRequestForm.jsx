import React from "react";
import axios from "axios";
import { getCurrencyForCountry } from "../../utils/currency.js";

const LearnerCreateRequestForm = ({
  newRequest,
  handleRequestChange,
  setNewRequest,
  user
}) => {
  return (
    <div className="glass-card p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
        Learner · Create request
      </p>
      <form className="mt-3 space-y-2" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="text-[11px] text-white/70">What do you need help with?</label>
          <input
            type="text"
            name="skillName"
            value={newRequest.skillName}
            onChange={handleRequestChange}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            placeholder="e.g. React state, SQL joins, DSA..."
            required
          />
        </div>
        <div>
          <label className="text-[11px] text-white/70">Extra details</label>
          <textarea
            name="details"
            value={newRequest.details}
            onChange={handleRequestChange}
            rows={3}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            placeholder="Describe your goal or current issue..."
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-[11px] text-white/70">
            <input
              type="checkbox"
              name="isFree"
              checked={newRequest.isFree}
              onChange={handleRequestChange}
            />
            I&apos;m asking for free help
          </label>
          {!newRequest.isFree && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] theme-muted">{getCurrencyForCountry(user?.country).symbol}</span>
              <input
                type="number"
                name="budget"
                value={newRequest.budget}
                onChange={handleRequestChange}
                min={0}
                className="w-20 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                placeholder="200"
              />
            </div>
          )}
        </div>
        <div className="rounded-xl border border-white/10 p-2">
          <label className="flex items-center gap-2 text-[11px] text-white/70">
            <input
              type="checkbox"
              name="groupEnabled"
              checked={newRequest.groupEnabled || false}
              onChange={(e) => setNewRequest((p) => ({ ...p, groupEnabled: e.target.checked }))}
            />
            Study in group
          </label>
          {(newRequest.groupEnabled || false) && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[11px] text-white/70">Add participant</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="email"
                    value={newRequest.groupEmailInput || ""}
                    onChange={(e) => setNewRequest((p) => ({ ...p, groupEmailInput: e.target.value }))}
                    placeholder="friend@example.com"
                    className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const email = String(newRequest.groupEmailInput || "").trim();
                      if (!email) return;
                      const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
                      const addLocal = (exists, user) => {
                        setNewRequest((p) => ({
                          ...p,
                          groupEmailsList: [ ...(p.groupEmailsList || []), email ].slice(0, 10),
                          groupEmailsInfo: [ ...(p.groupEmailsInfo || []), { email, exists: !!exists, name: user?.name || "", profilePic: user?.profilePic || "" } ].slice(0, 10),
                          groupEmailInput: ""
                        }));
                      };
                      if (token) {
                        axios.get("/api/users/check-email", { params: { email } })
                          .then((res) => addLocal(res.data.exists, res.data.user))
                          .catch(() => addLocal(false, null));
                      } else {
                        addLocal(false, null);
                      }
                    }}
                    className="rounded-lg border border-white/20 px-3 py-1 text-[11px] hover:bg-white/10"
                  >
                    + Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(newRequest.groupEmailsList || []).map((em, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-2 py-0.5 text-[11px]">
                      {em}
                      {(() => {
                        const info = (newRequest.groupEmailsInfo || []).find((x) => x.email === em);
                        if (!info) return null;
                        return info.exists ? (
                          <span className="rounded bg-emerald-600/30 px-1.5 py-0.5 text-[10px] text-emerald-200">Registered</span>
                        ) : (
                          <span className="rounded bg-red-600/30 px-1.5 py-0.5 text-[10px] text-red-200">Not registered</span>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => setNewRequest((p) => ({
                          ...p,
                          groupEmailsList: (p.groupEmailsList || []).filter((e) => e !== em),
                          groupEmailsInfo: (p.groupEmailsInfo || []).filter((i) => i.email !== em)
                        }))}
                        className="rounded-full px-2 text-[11px] hover:bg-white/10"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-white/50">Max 10 participants.</p>
              </div>
              <div>
                <label className="text-[11px] text-white/70">Payment split</label>
                <div className="mt-1 flex gap-3 text-[11px]">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="splitMode"
                      value="single"
                      checked={newRequest.splitMode === "single"}
                      onChange={handleRequestChange}
                    />
                    Paid by self (you)
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="splitMode"
                      value="equal"
                      checked={newRequest.splitMode === "equal"}
                      onChange={handleRequestChange}
                    />
                    Split equally among invited learners
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={(newRequest.groupEnabled && (newRequest.groupEmailsInfo || []).some((i) => !i.exists))}
          className="glass-button mt-2 w-full bg-gradient-to-r from-nexus-500 to-purple-500 py-1.5 text-[11px] font-medium shadow-lg shadow-nexus-500/30"
          onClick={(e) => {
            e.preventDefault();
            const members = (newRequest.groupEnabled ? (newRequest.groupEmailsList || []) : [])
              .slice(0, 10)
              .map((email) => ({ email }));
            const payload = {
              skillName: newRequest.skillName,
              details: newRequest.details,
              isFree: newRequest.isFree,
              budget: newRequest.isFree ? 0 : Number(newRequest.budget) || 0,
              groupMembers: members,
              paymentSplitMode: newRequest.splitMode
            };
            const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
            axios.post("/api/sessions/requests", payload, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
              .then(() => {
                setNewRequest({ skillName: "", details: "", budget: "", isFree: false, groupEnabled: false, groupEmailsList: [], groupEmailInput: "", splitMode: "single" });
              })
              .catch(() => {});
          }}
        >
          Post to request board
        </button>
      </form>
    </div>
  );
};

export default LearnerCreateRequestForm;
