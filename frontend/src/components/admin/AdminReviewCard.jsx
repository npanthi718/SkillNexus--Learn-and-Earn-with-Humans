import React, { useEffect, useState } from "react";

const AdminReviewCard = ({ review, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || "");
  useEffect(() => {
    setRating(review.rating);
    setComment(review.comment || "");
  }, [review.rating, review.comment]);
  const handleSave = () => {
    onUpdate({ rating, comment });
    setEditing(false);
  };
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      {!editing ? (
        <>
          <p className="text-[11px] font-medium">
            {review.reviewerId?.name || "Anonymous"} reviewed {review.revieweeId?.name || "Unknown"} · {review.rating} ★
          </p>
          <p className="mt-1 text-[11px] text-white/70">{review.comment || "No comment."}</p>
          <p className="mt-1 text-[10px] text-white/50">
            Session: {review.sessionId?.skillName || "Unknown"} · {new Date(review.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded border border-nexus-400/50 bg-nexus-500/20 px-2 py-0.5 text-[10px] text-nexus-200 hover:bg-nexus-500/30"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded border border-red-400/50 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/30"
            >
              Delete
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-2">
            <label className="text-[10px] text-white/60">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="ml-2 rounded bg-black/40 px-2 py-0.5 text-[11px] outline-none"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} ★</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="text-[10px] text-white/60">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-[11px] outline-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded border border-emerald-400/50 bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setRating(review.rating); setComment(review.comment || ""); }}
              className="rounded border border-white/30 px-2 py-0.5 text-[10px] text-white/70"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReviewCard;
