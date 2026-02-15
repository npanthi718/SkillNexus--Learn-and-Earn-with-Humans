import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import ChatButton from "../components/shared/ChatButton.jsx";
import BookButton from "../components/shared/BookButton.jsx";
import { formatAmount } from "../utils/currency.js";
import Avatar from "../components/shared/Avatar.jsx";
import { useToast } from "../components/shared/Toast.jsx";
 
const ProfileFriendActions = ({ userId }) => {
  const [status, setStatus] = useState("none");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
  useEffect(() => {
    const load = async () => {
      if (!token) return setStatus("none");
      try {
        const { data } = await axios.get(`/api/users/relation/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        setStatus(data.status || "none");
      } catch {
        setStatus("none");
      }
    };
    load();
  }, [userId, token]);
  const send = async () => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${userId}/request`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatus("sent");
      showToast("Friend request sent", "success");
    } catch {
      showToast("Could not send request", "error");
    }
  };
  const accept = async () => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${userId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatus("friends");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("sn:notifications:refresh"));
      }
      showToast("Friend request accepted", "success");
    } catch {
      showToast("Could not accept request", "error");
    }
  };
  const cancel = async () => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${userId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatus("none");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sn:friend_request:cancel", { detail: { otherId: userId } }));
        window.dispatchEvent(new Event("sn:notifications:refresh"));
      }
      showToast("Request canceled", "success");
    } catch {
      showToast("Could not cancel request", "error");
    }
  };
  const unfriend = async () => {
    if (!token) { navigate("/auth"); return; }
    try {
      await axios.post(`/api/users/friends/${userId}/unfriend`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setStatus("none");
      showToast("Unfriended", "success");
    } catch {
      showToast("Could not unfriend", "error");
    }
  };
  return (
    <div className="mt-2 flex items-center gap-2">
      {status === "friends" ? (
        <>
          <span className="rounded-full border border-emerald-400/60 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-200">Friends</span>
          <button type="button" onClick={unfriend} className="rounded border border-red-400/50 bg-red-500/20 px-3 py-1 text-[11px] text-red-200">Unfriend</button>
        </>
      ) : status === "sent" ? (
        <>
          <span className="rounded-full border border-amber-400/60 bg-amber-500/20 px-3 py-1 text-[11px] text-amber-200">Request sent</span>
          <button type="button" onClick={cancel} className="rounded border border-white/15 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Cancel</button>
        </>
      ) : status === "received" ? (
        <button type="button" onClick={accept} className="rounded border border-emerald-400/60 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-200">Accept request</button>
      ) : (
        <button type="button" onClick={send} className="rounded border border-white/15 px-3 py-1 text-[11px] text-white/80 hover:bg-white/10">Add friend</button>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserCountry, setCurrentUserCountry] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const getVideoEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("cloudinary.com") || url.includes("res.cloudinary.com")) {
      return url;
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] || "";
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      return null;
    }
    if (url.includes("loom.com")) {
      return url.replace("/share/", "/embed/");
    }
    return url;
  };

  const isDirectVideoUrl = (url) => url && (url.includes("cloudinary.com") || url.match(/\.(mp4|webm|ogg)(\?|$)/i));

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [profileRes, reviewsRes] = await Promise.all([
          axios.get(`/api/users/${userId}/public`),
          axios.get(`/api/reviews/user/${userId}`)
        ]);
        setProfile(profileRes.data);
        setReviews(reviewsRes.data.reviews || []);
        if (token) {
          try {
            const meRes = await axios.get("/api/auth/me", { headers });
            setCurrentUserId(meRes.data.user?._id || null);
            setCurrentUserRole(meRes.data.user?.role || null);
            setCurrentUserCountry(meRes.data.user?.country || null);
          } catch {
            setCurrentUserId(null);
            setCurrentUserRole(null);
            setCurrentUserCountry(null);
          }
        }
      } catch (error) {
        console.error("Load profile error", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/70">Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-white/70">Profile not found.</p>
      </main>
    );
  }

  // Show full profile even for own profile; editing is available from dashboard/profile actions

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  const handleDeleteReview = async (reviewId) => {
    if (!token || !confirm("Delete your review?")) return;
    try {
      await axios.delete(`/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      console.error("Delete review error", err);
    }
  };

  const handleChat = () => {
    if (!token) {
      navigate("/auth");
    } else {
      navigate(`/chat/${userId}`);
    }
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-6 px-4 py-8 text-sm relative">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="fixed right-6 top-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-white shadow-lg backdrop-blur-sm hover:bg-white/30 hover:border-white/60 transition-all"
        aria-label="Go back"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <section className="glass-card grid gap-6 p-6 md:grid-cols-[2fr,3fr]">
        <div>
          <Avatar src={profile.profilePic} name={profile.name} size="3xl" />
          <h1 className="mt-4 text-xl font-semibold flex items-center gap-2">
            {profile.name}
            {profile.isTeacherVerified && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                Verified teacher
              </span>
            )}
          </h1>
          {typeof profile.friendsCount === "number" && (
            <p className="mt-1 text-[11px] theme-muted">Friends: {profile.friendsCount}</p>
          )}
          <p className="mt-1 text-xs text-emerald-300">
            Trust score: {profile.trustScore || 0} ★
          </p>
          <p className="mt-3 text-xs text-white/70">{profile.bio || "No bio yet."}</p>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            {profile.socialLinks?.linkedin && (
              <a
                href={profile.socialLinks.linkedin.startsWith("http") ? profile.socialLinks.linkedin : `https://${profile.socialLinks.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-full border border-white/20 px-2 py-0.5 text-white/80 hover:bg-white/10"
              >
                LinkedIn
              </a>
            )}
            {profile.socialLinks?.github && (
              <a
                href={profile.socialLinks.github.startsWith("http") ? profile.socialLinks.github : `https://${profile.socialLinks.github}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-full border border-white/20 px-2 py-0.5 text-white/80 hover:bg-white/10"
              >
                GitHub
              </a>
            )}
            {profile.socialLinks?.website && (
              <a
                href={profile.socialLinks.website.startsWith("http") ? profile.socialLinks.website : `https://${profile.socialLinks.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-full border border-white/20 px-2 py-0.5 text-white/80 hover:bg-white/10"
              >
                Website
              </a>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {currentUserId && String(currentUserId) !== String(userId) && (
              <>
                <ChatButton otherUserId={userId} />
                <BookButton teacherId={userId} isVerified={Boolean(profile.isTeacherVerified)} />
              </>
            )}
            {currentUserId && String(currentUserId) === String(userId) && (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Manage my requests
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/teach-board")}
                  className="rounded-xl border border-white/15 px-4 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  Manage my offers
                </button>
              </>
            )}
          </div>
          {currentUserId && String(currentUserId) !== String(userId) && <ProfileFriendActions userId={userId} />}
        </div>

        <div className="space-y-4 text-xs">
          {profile.introVideoUrl && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
                Intro video
              </p>
              <div className="mt-2 aspect-video w-full overflow-hidden rounded-xl border-2 border-white/20 bg-black/40">
                {(() => {
                  const embedUrl = getVideoEmbedUrl(profile.introVideoUrl);
                  if (!embedUrl) {
                    return (
                      <div className="flex h-full flex-col items-center justify-center text-white/60 p-4">
                        <p className="text-sm">Invalid or unsupported video URL</p>
                        <p className="mt-2 text-xs text-white/50">
                          Supported: YouTube, Loom, or direct embed URLs
                        </p>
                      </div>
                    );
                  }
                  
                  if (isDirectVideoUrl(profile.introVideoUrl)) {
                    return (
                      <video
                        src={profile.introVideoUrl}
                        controls
                        className="h-full w-full"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    );
                  }
                  if (profile.introVideoUrl.includes("drive.google.com")) {
                    return (
                      <div className="flex h-full flex-col items-center justify-center text-white/60 p-4">
                        <p className="text-sm">Google Drive videos require proper sharing settings</p>
                        <p className="mt-2 text-xs text-white/50">
                          Please use a YouTube or Loom link, or ensure the Google Drive file is publicly accessible
                        </p>
                        <a
                          href={profile.introVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 rounded-lg bg-nexus-500/20 px-4 py-2 text-xs hover:bg-nexus-500/30"
                        >
                          Open in Google Drive
                        </a>
                      </div>
                    );
                  }
                  
                  return (
                    <iframe
                      src={embedUrl}
                      title="Intro video"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      frameBorder="0"
                    />
                  );
                })()}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
              Teaching · Skill badges
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(profile.skillsToTeach || []).map((skill) => (
                <span
                  key={skill.name}
                  className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/80"
                >
                  {skill.name} · {skill.level} ·{" "}
                  {skill.price === 0
                    ? "Free"
                    : `${formatAmount(skill.price, currentUserCountry || profile.country)}/session`}
                </span>
              ))}
              {(!profile.skillsToTeach || profile.skillsToTeach.length === 0) && (
                <p className="text-[11px] text-white/60">No teaching skills listed yet.</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
              Learning · Wishlist
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(profile.wishlistSkills || []).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/80"
                >
                  {skill}
                </span>
              ))}
              {(!profile.wishlistSkills || profile.wishlistSkills.length === 0) && (
                <p className="text-[11px] text-white/60">No wishlist skills listed.</p>
              )}
            </div>
          </div>

          {(profile.paymentDetails && profile.paymentDetails.length > 0) && ((currentUserRole === "Admin") || (currentUserId && (currentUserId === (profile._id || userId)))) && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
                Payment options
              </p>
              <p className="mt-1 text-[11px] text-white/60 mb-2">
                Visible only to admin and the profile owner.
              </p>
              <div className="space-y-3 mt-2">
                {profile.paymentDetails.map((pd, idx) => (
                  <div key={idx} className="rounded-lg border border-white/15 bg-black/20 p-2 text-[11px]">
                    {(pd.bankName || pd.country) && (
                      <p className="font-medium text-white/90">
                        {[pd.bankName, pd.country].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {pd.bankDetails && (
                      <p className="mt-1 text-white/70 whitespace-pre-wrap">{pd.bankDetails}</p>
                    )}
                    {pd.qrCodeUrl && (
                      <img
                        src={pd.qrCodeUrl}
                        alt="Payment QR"
                        className="mt-2 max-h-24 rounded border border-white/10 object-contain"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200">
              Learning · Mastered subjects
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(profile.masteredSubjects || []).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/80"
                >
                  {skill}
                </span>
              ))}
              {(!profile.masteredSubjects || profile.masteredSubjects.length === 0) && (
                <p className="text-[11px] text-white/60">No mastered subjects listed yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-6 text-xs">
        <p className="text-[11px] uppercase tracking-[0.18em] text-nexus-200 mb-4">Reviews</p>
        {reviews.length === 0 ? (
          <p className="text-[11px] text-white/60">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {/* Reviews given by students (to teachers) */}
            {reviews.filter((r) => r.role === "Learner").length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-200 mb-2">
                  Reviews from Students ({reviews.filter((r) => r.role === "Learner").length})
                </p>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {reviews
                    .filter((r) => r.role === "Learner")
                    .map((r) => (
                      <div key={r._id} className="rounded-lg border border-white/10 bg-black/20 p-2 flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold">
                            {r.reviewerId?.name || "Anonymous"} · {r.rating} ★
                          </p>
                          <p className="mt-1 text-[11px] text-white/70">{r.comment || "No comment."}</p>
                        </div>
                        {currentUserId && (r.reviewerId?._id || r.reviewerId) === currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id)}
                            className="shrink-0 rounded border border-red-400/50 px-1.5 py-0.5 text-[10px] text-red-300 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Reviews given by teachers (to students) */}
            {reviews.filter((r) => r.role === "Teacher").length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-200 mb-2">
                  Reviews from Teachers ({reviews.filter((r) => r.role === "Teacher").length})
                </p>
                <div className="space-y-2 max-h-56 overflow-auto">
                  {reviews
                    .filter((r) => r.role === "Teacher")
                    .map((r) => (
                      <div key={r._id} className="rounded-lg border border-white/10 bg-black/20 p-2 flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold">
                            {r.reviewerId?.name || "Anonymous"} · {r.rating} ★
                          </p>
                          <p className="mt-1 text-[11px] text-white/70">{r.comment || "No comment."}</p>
                        </div>
                        {currentUserId && (r.reviewerId?._id || r.reviewerId) === currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r._id)}
                            className="shrink-0 rounded border border-red-400/50 px-1.5 py-0.5 text-[10px] text-red-300 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
