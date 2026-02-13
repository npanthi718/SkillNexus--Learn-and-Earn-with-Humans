import React from "react";
import Avatar from "../shared/Avatar.jsx";

const TeacherAcceptedSessions = ({
  myTeaching,
  teacherView,
  setTeacherView,
  navigate,
  openGroupChat,
  handleCompleteSession,
  setMeetingModal,
  setTeacherPricingModal
}) => {
  const pending = myTeaching.filter((s) => s.status !== "Completed");
  const completed = myTeaching.filter((s) => s.status === "Completed");
  return (
    <div className="glass-card p-5 rounded-xl border border-white/10 shadow-lg">
      <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-3 font-medium">
        Teacher · My accepted sessions
      </p>
      <div className="space-y-4">
        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setTeacherView("active")}
              className={`w-full rounded-lg px-3 py-2 text-[11px] ${teacherView === "active" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
            >
              Active
            </button>
            <button
              onClick={() => setTeacherView("completed")}
              className={`w-full rounded-lg px-3 py-2 text-[11px] ${teacherView === "completed" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
            >
              Completed
            </button>
          </div>
        </div>
        {(pending.length > 0) && teacherView === "active" && (
          <div>
            <p className="text-xs font-semibold text-yellow-300 mb-2">
              📋 Active Sessions ({pending.length})
            </p>
            <div className="space-y-2">
              {pending.map((s) => (
                <div key={s._id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                  <p className="text-[11px] font-semibold">
                    {s.skillName}
                    {(() => {
                      const total = 1 + (s.groupMembers?.length || 0);
                      const paid = (s.paidMemberIds?.length || 0);
                      const unpaid = Math.max(0, total - paid);
                      return (s.paymentSplitMode === "equal" && unpaid > 0)
                        ? (
                          <span className="ml-2 rounded-full border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">
                            Unpaid {unpaid}
                          </span>
                        )
                        : null;
                    })()}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                    {s.details || "No details."}
                  </p>
                  <p className="mt-1 text-[11px] text-yellow-300">
                    Status: {s.status}
                    {s.learnerId?.name ? ` · Learner: ${s.learnerId.name}` : ""}
                  </p>
                  {(s.groupMembers?.length || 0) > 0 && (
                    <div className="mt-1 text-[11px] theme-muted">
                      <span className="mr-2">Participants:</span>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {[s.learnerId, ...(s.groupMembers || []).map((gm) => gm.userId || gm)].filter(Boolean).map((u, idx) => {
                          const name = u?.name || (typeof u === "string" ? "" : "");
                          const profilePic = u?.profilePic || "";
                          return (
                            <span key={idx} className="inline-flex items-center gap-1">
                              <Avatar src={profilePic} name={name || "Member"} size="xs" />
                              <span>{name || "Member"}</span>
                            </span>
                          );
                        })}
                      </span>
                      {(() => {
                        const total = 1 + (s.groupMembers?.length || 0);
                        const paid = (s.paidMemberIds?.length || 0);
                        return (
                          <span className="ml-2 text-yellow-300">
                            Payment progress {paid}/{total}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  {s.status !== "Completed" && (s.groupMembers?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => openGroupChat(s._id)}
                      className="mt-2 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      Open group chat
                    </button>
                  )}
                  {s.scheduledFor && (
                    <p className="mt-1 text-[11px] text-white/60">
                      Scheduled:{" "}
                      {new Date(s.scheduledFor).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  )}
                  {s.meetingLink && s.status !== "Completed" && (
                    <a
                      href={s.meetingLink.startsWith("http") ? s.meetingLink : `https://${s.meetingLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 block text-[11px] text-nexus-200 underline hover:text-nexus-100"
                    >
                      Join meeting →
                    </a>
                  )}
                  {s.learnerId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/chat/${s.learnerId._id || s.learnerId}`)
                      }
                      className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      Chat with learner
                    </button>
                  )}
                  {s.status === "Accepted" && (
                    <button
                      type="button"
                      onClick={() => handleCompleteSession(
                        s._id,
                        s.learnerId?._id || s.learnerId,
                        s.learnerId?.name || "Learner"
                      )}
                      className="mt-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/30"
                    >
                      Mark as Complete
                    </button>
                  )}
                  {s.status === "Accepted" && (
                    <button
                      type="button"
                      onClick={() => setMeetingModal({ open: true, sessionId: s._id, link: s.meetingLink || "", when: s.scheduledFor ? new Date(s.scheduledFor).toISOString().slice(0,16) : "" })}
                      className="mt-2 rounded-lg border border-blue-400/50 bg-blue-500/20 px-3 py-1 text-[11px] text-blue-200 hover:bg-blue-500/30"
                    >
                      {s.meetingLink || s.scheduledFor ? "Edit meeting details" : "Add meeting details"}
                    </button>
                  )}
                  {s.status === "Accepted" && !s.paymentCompletedByLearner && (
                    <button
                      type="button"
                      onClick={() => setTeacherPricingModal({ open: true, sessionId: s._id, isFree: !!s.isFree, budget: String(s.budget || 0) })}
                      className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200 hover:bg-amber-500/30"
                    >
                      Edit pricing
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {(completed.length > 0) && teacherView === "completed" && (
          <div>
            <p className="text-xs font-semibold text-emerald-300 mb-2">
              ✅ Completed Sessions ({completed.length})
            </p>
            <div className="space-y-2">
              {completed.map((s) => (
                <div key={s._id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                  <p className="text-[11px] font-semibold">{s.skillName}</p>
                  <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                    {s.details || "No details."}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-300">
                    Status: {s.status}
                    {s.learnerId?.name ? ` · Learner: ${s.learnerId.name}` : ""}
                  </p>
                  {s.scheduledFor && (
                    <p className="mt-1 text-[11px] text-white/60">
                      Completed:{" "}
                      {new Date(s.scheduledFor).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  )}
                  {s.learnerId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/chat/${s.learnerId._id || s.learnerId}`)
                      }
                      className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      Chat with learner
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {pending.length === 0 && completed.length === 0 && (
          <p className="text-[11px] text-white/70">
            When you accept learner requests, they will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeacherAcceptedSessions;
