import React from "react";
import axios from "axios";
import AdminReviewCard from "../../admin/AdminReviewCard.jsx";

const AdminReviewsPanel = ({ reviews, authHeaders, onSetReviews, query = "", minRating = 0 }) => {
  const q = String(query || "").trim().toLowerCase();
  const filtered = (reviews || []).filter((r) => {
    const okRating = Number(r.rating || 0) >= Number(minRating || 0);
    if (!q) return okRating;
    const by = (r.reviewer?.name || r.reviewee?.name || "").toLowerCase();
    const content = String(r.comment || "").toLowerCase();
    return okRating && (by.includes(q) || content.includes(q));
  });
  return (
    <section className="glass-card p-4">
      <h2 className="mb-4 text-sm font-semibold">All Reviews</h2>
      <div className="max-h-[600px] space-y-2 overflow-auto text-xs">
        {filtered.map((r) => (
          <AdminReviewCard
            key={r._id}
            review={r}
            onUpdate={async (updates) => {
              const { data } = await axios.put(`/api/admin/reviews/${r._id}`, updates, { headers: authHeaders });
              onSetReviews((prev) => prev.map((rev) => (rev._id === r._id ? data.review : rev)));
            }}
            onDelete={async () => {
              if (!confirm("Delete this review?")) return;
              await axios.delete(`/api/admin/reviews/${r._id}`, { headers: authHeaders });
              onSetReviews((prev) => prev.filter((rev) => rev._id !== r._id));
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default AdminReviewsPanel;
