import React from "react";
import axios from "axios";
import Avatar from "../shared/Avatar.jsx";
import { getCurrencyForCountry } from "../../utils/currency.js";

const LearnerRequestsTabs = ({
  myRequests,
  learnerView,
  setLearnerView,
  publicOffers,
  showGroupAddedBanner,
  user,
  token,
  currencies,
  navigate,
  setPaymentDetailsModal,
  setMyRequests,
  setWallet,
  showToast,
  setError,
  openGroupChat,
  handleCompleteSession,
  setLearnerEditModal,
  setLearnerDeleteModal,
  setOfferPreview,
  formatAmount,
  convertByCurrency
}) => {
  const pending = myRequests.filter((r) => r.status === "Pending");
  const accepted = myRequests.filter((r) => r.status === "Accepted");
  const completed = myRequests.filter((r) => r.status === "Completed");
  return (
    <div className="glass-card p-5 rounded-xl border border-white/10 shadow-lg">
      <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-3 font-medium">
        Learner · My requests
      </p>
      {showGroupAddedBanner && (
        <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-[11px] text-emerald-200">
          You have been added to a group session. Open the Accepted tab to view and chat.
        </div>
      )}
      <div className="space-y-4">
        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-1">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setLearnerView("pending")}
              className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "pending" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
            >
              Sent
            </button>
            <button
              onClick={() => setLearnerView("accepted")}
              className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "accepted" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
            >
              Accepted
            </button>
            <button
              onClick={() => setLearnerView("completed")}
              className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "completed" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
            >
              Completed
            </button>
            <button
              onClick={() => setLearnerView("offers")}
              className={`w-full rounded-lg px-3 py-2 text-[11px] ${learnerView === "offers" ? "bg-white/10 border border-white/20" : "hover:bg-white/5"}`}
            >
              Teacher offers
            </button>
          </div>
        </div>

        {(pending.length > 0) && learnerView === "pending" && (
          <div>
            <p className="text-xs font-semibold text-yellow-300 mb-2">
              📋 Sent ({pending.length})
            </p>
            <div className="space-y-2">
              {pending.map((r) => (
                <div key={r._id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                  <p className="text-[11px] font-semibold">{r.skillName}</p>
                  <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                    {r.details || "No details."}
                  </p>
                  <p className="mt-1 text-[11px] text-yellow-300">
                    Status: {r.status}
                    {r.teacherId?.name ? ` · Teacher: ${r.teacherId.name}` : ""}
                  </p>
                  {r.scheduledFor && (
                    <p className="mt-1 text-[11px] text-white/60">
                      When:{" "}
                      {new Date(r.scheduledFor).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  )}
                  {r.meetingLink && r.status !== "Completed" && (
                    <a
                      href={r.meetingLink.startsWith("http") ? r.meetingLink : `https://${r.meetingLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 block text-[11px] text-nexus-200 underline hover:text-nexus-100"
                    >
                      Join meeting →
                    </a>
                  )}
                  {(() => {
                    if (!(r.status === "Accepted" && !r.isFree && r.budget > 0)) return null;
                    const uid = user?._id;
                    const hasPaid = (r.paidMemberIds || []).some((pid) => String(pid) === String(uid));
                    const shouldShow =
                      r.paymentSplitMode === "equal"
                        ? !hasPaid
                        : String(r.learnerId?._id || r.learnerId) === String(uid) && !r.paymentCompletedByLearner;
                    if (!shouldShow) return null;
                    return (
                      <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px]">
                        <p className="font-medium text-amber-200">Pay to SkillNexus (platform)</p>
                        <>
                          <div className="mt-1 text-white/70">
                            <p>Pay to the company using the details below, then mark as paid.</p>
                            <div className="mt-1 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setPaymentDetailsModal({
                                  open: true,
                                  teacher: null,
                                  session: r,
                                  isPlatform: true
                                })}
                                className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200"
                              >
                                Pay now
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentDetailsModal({
                                  open: true,
                                  teacher: null,
                                  session: r,
                                  isPlatform: true
                                })}
                                className="text-nexus-200 underline hover:text-nexus-100"
                              >
                                View company bank details & QR
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await axios.post(
                                    `/api/sessions/${r._id}/payment-done`,
                                    {},
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  const [reqRes, walletRes] = await Promise.all([
                                    axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }),
                                    axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } })
                                  ]);
                                  setMyRequests(reqRes.data.requests || []);
                                  setWallet(walletRes.data);
                                  showToast("Payment recorded.", "success");
                                } catch (err) {
                                  setError("Could not update payment status");
                                  showToast(err.response?.data?.message || "Could not record payment", "error");
                                }
                              }}
                              className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
                            >
                              Mark as paid
                            </button>
                            <span className="text-white/50 text-[10px] self-center">or skip until you join</span>
                          </div>
                        </>
                      </div>
                    );
                  })()}
                  {r.teacherId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/chat/${r.teacherId._id || r.teacherId}`)
                      }
                      className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      Chat with teacher
                    </button>
                  )}
                  {r.status === "Pending" && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLearnerEditModal({ open: true, request: r, skillName: r.skillName || "", details: r.details || "", isFree: !!r.isFree, budget: String(r.budget || 0) })}
                        className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setLearnerDeleteModal({ open: true, requestId: r._id })}
                        className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {r.status === "Accepted" && (
                    <button
                      type="button"
                      onClick={() => handleCompleteSession(
                        r._id,
                        r.teacherId?._id || r.teacherId,
                        r.teacherId?.name || "Teacher"
                      )}
                      className="mt-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/30"
                    >
                      Mark as Complete
                    </button>
                  )}
                  {r.status === "Accepted" && (r.groupMembers?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => openGroupChat(r._id)}
                      className="mt-2 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      Open group chat
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(accepted.length > 0) && learnerView === "accepted" && (
          <div>
            <p className="text-xs font-semibold text-emerald-300 mb-2">
              ✅ Accepted ({accepted.length})
            </p>
            <div className="space-y-2">
              {accepted.map((r) => (
                <div key={r._id} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2">
                  <p className="text-[11px] font-semibold">
                    {r.skillName}
                    {(() => {
                      const totalParticipants = 1 + (r.groupMembers?.length || 0);
                      const paidCount = (r.paidMemberIds?.length || 0);
                      const unpaid = Math.max(0, totalParticipants - paidCount);
                      return (r.paymentSplitMode === "equal" && unpaid > 0) ? (
                        <span className="ml-2 rounded-full border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-200">
                          Unpaid {unpaid}
                        </span>
                      ) : null;
                    })()}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                    {r.details || "No details."}
                  </p>
                  <p className="mt-1 text-[11px] text-blue-300">
                    Status: {r.status}
                    {r.teacherId?.name ? ` · Teacher: ${r.teacherId.name}` : ""}
                  </p>
                  {r.scheduledFor && (
                    <p className="mt-1 text-[11px] text-white/60">
                      Scheduled:{" "}
                      {new Date(r.scheduledFor).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  )}
                  {(r.groupMembers?.length || 0) > 0 && (
                    <div className="mt-1 text-[11px] theme-muted">
                      <span className="mr-2">Participants:</span>
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {[r.learnerId, ...(r.groupMembers || []).map((gm) => gm.userId || gm)].filter(Boolean).map((u, idx) => {
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
                    </div>
                  )}
                  {r.meetingLink && (
                    <a
                      href={r.meetingLink.startsWith("http") ? r.meetingLink : `https://${r.meetingLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 block text-[11px] text-nexus-200 underline hover:text-nexus-100"
                    >
                      Join meeting →
                    </a>
                  )}
                  {(() => {
                    if (!(r.status === "Accepted" && !r.isFree && r.budget > 0)) return null;
                    const uid = user?._id;
                    const hasPaid = (r.paidMemberIds || []).some((pid) => String(pid) === String(uid));
                    const shouldShow =
                      r.paymentSplitMode === "equal"
                        ? !hasPaid
                        : String(r.learnerId?._id || r.learnerId) === String(uid) && !r.paymentCompletedByLearner;
                    if (!shouldShow) return null;
                    return (
                      <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px]">
                        <p className="font-medium text-amber-200">Pay to SkillNexus (platform)</p>
                        <div className="mt-1 text-white/70">
                          <p>Pay to the company using the details below, then mark as paid.</p>
                          <div className="mt-1 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPaymentDetailsModal({
                                open: true,
                                teacher: null,
                                session: r,
                                isPlatform: true
                              })}
                              className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200"
                            >
                              Pay now
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentDetailsModal({
                                open: true,
                                teacher: null,
                                session: r,
                                isPlatform: true
                              })}
                              className="text-nexus-200 underline hover:text-nexus-100"
                            >
                              View company bank details & QR
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="mb-1 text-white/80">
                            {(() => {
                              const toSym = getCurrencyForCountry(user?.country).symbol;
                              const toCur = toSym === "£" ? "GBP" : toSym === "€" ? "EUR" : toSym;
                              const fromCur = String(r.budgetCurrency || "USD").toUpperCase();
                              const totalParticipants = 1 + (r.groupMembers?.length || 0);
                              const perShare = (r.budget || 0) / (r.paymentSplitMode === "equal" ? Math.max(1, totalParticipants) : 1);
                              if (r.isFree || !(r.budget > 0)) {
                                return <>Amount to pay: {formatAmount(0, user?.country)} (Free)</>;
                              }
                              const amt = convertByCurrency(perShare, fromCur, toCur);
                              return <>Amount to pay: {formatAmount(amt, user?.country)}</>;
                            })()}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPaymentDetailsModal({
                                open: true,
                                teacher: null,
                                session: r,
                                isPlatform: true
                              })}
                              className="rounded border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200"
                            >
                              Pay now
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await axios.post(
                                    `/api/sessions/${r._id}/payment-done`,
                                    {},
                                    { headers: { Authorization: `Bearer ${token}` } }
                                  );
                                  const [reqRes, walletRes] = await Promise.all([
                                    axios.get("/api/sessions/my-requests", { headers: { Authorization: `Bearer ${token}` } }),
                                    axios.get("/api/transactions/wallet", { headers: { Authorization: `Bearer ${token}` } })
                                  ]);
                                  setMyRequests(reqRes.data.requests || []);
                                  setWallet(walletRes.data);
                                  showToast("Payment recorded.", "success");
                                  try {
                                    if (typeof window !== "undefined") {
                                      window.dispatchEvent(new Event("sn:sessions:refresh"));
                                      window.dispatchEvent(new Event("sn:wallet:refresh"));
                                    }
                                  } catch {}
                                } catch (err) {
                                  setError("Could not update payment status");
                                  showToast(err.response?.data?.message || "Could not record payment", "error");
                                }
                              }}
                              className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
                            >
                              Mark as paid
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const requiresPayment = !r.isFree && r.budget > 0;
                    const totalParticipants = 1 + (r.groupMembers?.length || 0);
                    const paidCount = (r.paidMemberIds?.length || 0);
                    const groupPaid = r.paymentSplitMode === "equal" ? (paidCount >= totalParticipants) : !!r.paymentCompletedByLearner;
                    const canComplete = !requiresPayment || groupPaid;
                    return (
                      <button
                        type="button"
                        disabled={!canComplete}
                        onClick={() => {
                          if (canComplete) {
                            handleCompleteSession(
                              r._id,
                              r.teacherId?._id || r.teacherId,
                              r.teacherId?.name || "Teacher"
                            );
                          } else {
                            const outstanding = [
                              r.learnerId,
                              ...(r.groupMembers || []).map((gm) => ({ _id: gm.userId, name: gm.name, email: gm.email }))
                            ].filter(Boolean).filter((p) => {
                              const id = p?._id || p;
                              return id && !(r.paidMemberIds || []).some((pid) => String(pid) === String(id));
                            }).map((p) => p?.name || p?.email || "Member");
                            showToast(`Cannot complete: ${outstanding.join(", ")} still need to pay.`, "error");
                          }
                        }}
                        className={`mt-2 rounded-lg px-3 py-1 text-[11px] border ${canComplete ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30" : "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"}`}
                      >
                        {canComplete ? "Mark as Complete" : r.paymentSplitMode === "equal" ? `Waiting payments ${paidCount}/${totalParticipants}` : "Complete after payment"}
                      </button>
                    );
                  })()}
                  {r.paymentSplitMode === "equal" && !r.isFree && r.budget > 0 && (
                    <div className="mt-2 text-[11px]">
                      <p className="theme-muted">Remind unpaid participants</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[r.learnerId, ...(r.groupMembers || []).map((gm) => ({ _id: gm.userId, name: gm.name, email: gm.email }))].filter(Boolean).map((p, idx) => {
                          const id = p?._id || p;
                          const name = p?.name || p?.email || "Member";
                          const hasPaid = (r.paidMemberIds || []).some((pid) => String(pid) === String(id));
                          if (!id || hasPaid) return null;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={async () => {
                                try {
                                  await axios.post(`/api/sessions/${r._id}/remind/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                  showToast(`Reminder sent to ${name}`, "success");
                                } catch (err) {
                                  showToast(err.response?.data?.message || "Could not send reminder", "error");
                                }
                              }}
                              className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] hover:bg-white/10"
                            >
                              Message {name}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const allIds = [r.learnerId, ...(r.groupMembers || []).map((gm) => gm.userId)].filter(Boolean);
                              const unpaid = allIds.filter((id) => !(r.paidMemberIds || []).some((pid) => String(pid) === String(id)));
                              await Promise.all(unpaid.map((id) => axios.post(`/api/sessions/${r._id}/remind/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } })));
                              showToast("Reminders sent to all unpaid participants", "success");
                            } catch (err) {
                              showToast(err.response?.data?.message || "Could not send all reminders", "error");
                            }
                          }}
                          className="rounded border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200"
                        >
                          Remind all unpaid
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(completed.length > 0) && learnerView === "completed" && (
          <div>
            <p className="text-xs font-semibold text-emerald-300 mb-2">
              ✅ Completed ({completed.length})
            </p>
            <div className="space-y-2">
              {completed.map((r) => (
                <div key={r._id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                  <p className="text-[11px] font-semibold">{r.skillName}</p>
                  <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                    {r.details || "No details."}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-300">
                    Status: {r.status}
                    {r.teacherId?.name ? ` · Teacher: ${r.teacherId.name}` : ""}
                  </p>
                  {r.scheduledFor && (
                    <p className="mt-1 text-[11px] text-white/60">
                      Completed:{" "}
                      {new Date(r.scheduledFor).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </p>
                  )}
                  {r.teacherId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/chat/${r.teacherId._id || r.teacherId}`)
                      }
                      className="mt-1 rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                    >
                      Chat with teacher
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {learnerView === "offers" && (
          <div>
            <p className="text-xs font-semibold text-purple-300 mb-2">
              🧑‍🏫 Teacher offers ({publicOffers.length})
            </p>
            <div className="space-y-2">
              {publicOffers.map((o) => (
                <div key={o._id} className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-2">
                  <p className="text-[11px] font-semibold">{o.skillName}</p>
                  <p className="mt-1 text-[11px] text-white/70 line-clamp-2">
                    {o.details || "No details."}
                  </p>
                  <p className="mt-1 text-[11px] text-purple-300">
                    Teacher: {o.teacherId?.name || "Unknown"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/70">
                    {formatAmount(o.budget || 0, o.budgetCurrency || o.teacherId?.country)} · Your price:{" "}
                    {(() => {
                      const toCur = getCurrencyForCountry(user?.country).symbol;
                      const amt = convertByCurrency(o.budget || 0, (o.budgetCurrency || toCur), toCur);
                      return formatAmount(amt, user?.country);
                    })()}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ccMap = {};
                        for (const m of (currencies.countryCurrency || [])) {
                          if (m.countryCode && m.currencyCode) ccMap[String(m.countryCode).toUpperCase()] = String(m.currencyCode).toUpperCase();
                        }
                        const rateFor = (code, kind) => {
                          const r = (currencies.currencyRates || []).find((x) => String(x.code || "").toUpperCase() === String(code || "").toUpperCase());
                          if (!r) return 1;
                          if (kind === "buy") return Number(r.buyToUSD ?? r.rateToUSD ?? 1) || 1;
                          return Number(r.sellToUSD ?? r.rateToUSD ?? 1) || 1;
                        };
                        const learnerCur = ccMap[String(user?.country || "").toUpperCase()] || "USD";
                        const offerCur = String(o.budgetCurrency || ccMap[String(o.teacherId?.country || "").toUpperCase()] || "USD").toUpperCase();
                        const payoutCur = ccMap[String(o.teacherId?.country || "").toUpperCase()] || "USD";
                        const buyOffer = rateFor(offerCur, "buy");
                        const sellLearner = rateFor(learnerCur, "sell");
                        const sellNPR = rateFor("NPR", "sell");
                        const buyNPR = rateFor("NPR", "buy");
                        const sellPayout = rateFor(payoutCur, "sell");
                        const totalUSD = (Number(o.budget || 0) || 0) * (buyOffer || 1);
                        const learnerPays = Math.round(((totalUSD / (sellLearner || 1)) || 0) * 100) / 100;
                        const nprAmount = Math.round(((totalUSD / (sellNPR || 1)) || 0) * 100) / 100;
                        const feePercent = Number(currencies.platformFeePercent || 10);
                        const feeNPR = Math.round(((nprAmount * feePercent) / 100) * 100) / 100;
                        const netNPR = Math.max(0, Math.round(((nprAmount - feeNPR) || 0) * 100) / 100);
                        const teacherReceives = Math.round(((netNPR * (buyNPR || 1) / (sellPayout || 1)) || 0) * 100) / 100;
                        setOfferPreview({ open: true, offer: o, payerCur: learnerCur, payoutCur, learnerPays, feeNPR, netNPR, teacherReceives });
                      }}
                      className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
                    >
                      Accept offer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && accepted.length === 0 && completed.length === 0 && (
          <p className="text-[11px] text-white/70">
            Once you post, your requests will show up here with their status.
          </p>
        )}
      </div>
    </div>
  );
};

export default LearnerRequestsTabs;
