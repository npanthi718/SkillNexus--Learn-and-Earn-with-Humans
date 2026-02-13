import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast.jsx";
import { getCurrencyForCountry } from "../utils/currency.js";
import ImageUriInput from "../components/ImageUriInput.jsx";
import VerificationUpload from "../components/VerificationUpload.jsx";

const ProfileEditPage = () => {
  const [form, setForm] = useState({
    name: "",
    bio: "",
    profilePic: "",
    introVideoUrl: "",
    socialLinks: { linkedin: "", github: "", website: "" },
    teachingLanguages: [],
    masteredSubjects: [],
    wishlistSkills: [],
    skillsToTeach: [],
    skillsToLearn: [],
    paymentDetails: [],
    country: "",
    verificationPhotos: [],
    teacherCertificates: []
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [languagesText, setLanguagesText] = useState("");
  const [wishlistText, setWishlistText] = useState("");
  const [masteredText, setMasteredText] = useState("");
  const [secQuestions, setSecQuestions] = useState([{ question: "", answer: "" }, { question: "", answer: "" }, { question: "", answer: "" }]);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = typeof window !== "undefined" ? localStorage.getItem("sn_token") : null;

  const [COUNTRY_OPTIONS, setCountryOptions] = useState([
    { code: "", name: "Select country" },
    { code: "NP", name: "Nepal" },
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "PK", name: "Pakistan" },
    { code: "BD", name: "Bangladesh" },
    { code: "LK", name: "Sri Lanka" },
    { code: "AU", name: "Australia" },
    { code: "CA", name: "Canada" }
  ]);

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    const load = async () => {
      try {
        const { data } = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const u = data.user;
        setForm({
          name: u.name || "",
          bio: u.bio || "",
          profilePic: u.profilePic || "",
          introVideoUrl: u.introVideoUrl || "",
          socialLinks: {
            linkedin: u.socialLinks?.linkedin || "",
            github: u.socialLinks?.github || "",
            website: u.socialLinks?.website || ""
          },
          teachingLanguages: u.teachingLanguages || [],
          masteredSubjects: u.masteredSubjects || [],
          wishlistSkills: u.wishlistSkills || [],
          skillsToTeach: u.skillsToTeach || [],
          skillsToLearn: u.skillsToLearn || [],
          paymentDetails: u.paymentDetails || [],
          country: u.country || "",
          verificationPhotos: u.verificationPhotos || [],
          teacherCertificates: u.teacherCertificates || []
        });
        setLanguagesText((u.teachingLanguages || []).join("\n"));
        setWishlistText((u.wishlistSkills || []).join("\n"));
        setMasteredText((u.masteredSubjects || []).join("\n"));
        try {
          const curRes = await axios.get("/api/platform/currencies");
          const mappings = curRes.data.countryCurrency || [];
          if (Array.isArray(mappings) && mappings.length > 0) {
            const existingNames = Object.fromEntries(COUNTRY_OPTIONS.map((c) => [c.code, c.name]));
            const merged = [
              { code: "", name: "Select country" },
              ...mappings
                .filter((m) => m.countryCode)
                .map((m) => ({ code: m.countryCode, name: existingNames[m.countryCode] || m.countryCode }))
            ];
            setCountryOptions(merged);
          }
        } catch {}
      } catch (err) {
        console.error("Load editable profile error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, token]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value }
    }));
  };

  const handleCommaListChange = (name, value) => {
    const parts = value
      .split(/[\n,;|]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, [name]: parts }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await axios.put(
        "/api/users/me",
        {
          name: form.name,
          bio: form.bio,
          profilePic: form.profilePic,
          introVideoUrl: form.introVideoUrl,
          socialLinks: form.socialLinks,
          teachingLanguages: form.teachingLanguages,
          masteredSubjects: form.masteredSubjects,
          wishlistSkills: form.wishlistSkills,
          skillsToTeach: form.skillsToTeach,
          skillsToLearn: form.skillsToLearn,
          paymentDetails: form.paymentDetails,
          country: form.country,
          verificationPhotos: (form.verificationPhotos || []).map((u) => (typeof u === "string" ? { url: u } : { url: u?.url || u })),
          teacherCertificates: (form.teacherCertificates || []).map((u) => (typeof u === "string" ? { url: u } : { url: u?.url || u }))
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSaved(true);
      showToast("Profile saved.", "success");
    } catch (err) {
      console.error("Save profile error", err);
      setError("Unable to save profile");
      showToast("Unable to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    setChangingPassword(true);
    try {
      await axios.put(
        "/api/users/me/password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Could not change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm theme-muted">Loading your profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-6 px-6 py-10 text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit your SkillNexus profile</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg border px-3 py-1.5 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10">← Back</button>
          <button type="button" onClick={() => navigate("/users?tab=friends")} className="rounded-lg border px-3 py-1.5 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10">Friends</button>
          <button type="button" onClick={() => navigate("/users?tab=requests")} className="rounded-lg border px-3 py-1.5 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10">Requests</button>
          <button type="button" onClick={() => navigate("/users?tab=all")} className="rounded-lg border px-3 py-1.5 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10">Suggestions</button>
          <button type="button" onClick={() => navigate("/messages")} className="rounded-lg border px-3 py-1.5 text-xs border-white/20 bg-white/5 text-white/80 hover:bg-white/10">Messages</button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <section className="glass-card grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-xs theme-muted">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleFieldChange}
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
            <label className="mt-3 text-xs theme-muted">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleFieldChange}
              rows={4}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              placeholder="Tell learners who you are, what you teach, and how you work."
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs theme-muted">Profile picture</label>
            <ImageUriInput
              value={form.profilePic}
              onChange={(v) => setForm((prev) => ({ ...prev, profilePic: v }))}
              placeholder="Profile image URL or upload"
              uploadType="profile"
            />
            <label className="mt-3 text-xs theme-muted">Intro video (upload or URL)</label>
            <ImageUriInput
              value={form.introVideoUrl}
              onChange={(v) => setForm((prev) => ({ ...prev, introVideoUrl: v }))}
              placeholder="Video URL or upload (YouTube, Loom, or Cloudinary)"
              uploadType="video"
            />
            <label className="mt-3 text-xs theme-muted">Home country (for currency display)</label>
            <select
              name="country"
              value={form.country}
              onChange={handleFieldChange}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code || "x"} value={c.code}>{c.name}</option>
              ))}
            </select>
            {form.country && (
              <p className="mt-1 text-[12px] theme-muted">
                Prices will show in {getCurrencyForCountry(form.country).name} ({getCurrencyForCountry(form.country).symbol})
              </p>
            )}
          </div>
        </section>

        <section className="glass-card grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] theme-accent">Social links</p>
            <input
              type="text"
              name="linkedin"
              value={form.socialLinks.linkedin}
              onChange={handleSocialChange}
              placeholder="LinkedIn"
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
            <input
              type="text"
              name="github"
              value={form.socialLinks.github}
              onChange={handleSocialChange}
              placeholder="GitHub"
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-sm outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
            <input
              type="text"
              name="website"
              value={form.socialLinks.website}
              onChange={handleSocialChange}
              placeholder="Personal website"
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-xs outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] theme-accent">Languages</p>
            <p className="text-[10px] theme-muted mb-1">Separate with new line, comma (,) or semicolon (;)</p>
            <textarea
              value={languagesText}
              onChange={(e) => setLanguagesText(e.target.value)}
              onBlur={(e) => handleCommaListChange("teachingLanguages", e.target.value)}
              placeholder={"English\nHindi\nNepali"}
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-xs outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] theme-accent">
              Wishlist skills
            </p>
            <p className="text-[10px] theme-muted mb-1">Separate with new line, comma or semicolon</p>
            <textarea
              value={wishlistText}
              onChange={(e) => setWishlistText(e.target.value)}
              onBlur={(e) => handleCommaListChange("wishlistSkills", e.target.value)}
              placeholder={"React, DSA\nPython"}
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-xs outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
          </div>
        </section>

        <section className="glass-card grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] theme-accent">
              Teaching · Skill badges
            </p>
            <p className="text-[11px] theme-muted">
              Add at least one skill to appear as a teacher on the public pages.
            </p>
            <div className="space-y-2">
              {form.skillsToTeach.map((s, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-2"
                >
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const next = [...prev.skillsToTeach];
                        next[idx] = { ...next[idx], name: val };
                        return { ...prev, skillsToTeach: next };
                      });
                    }}
                    placeholder="Skill name (e.g. React, DSA)"
                    className="flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] outline-none"
                  />
                  <select
                    value={s.level}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => {
                        const next = [...prev.skillsToTeach];
                        next[idx] = { ...next[idx], level: val };
                        return { ...prev, skillsToTeach: next };
                      });
                    }}
                    className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    value={s.price}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setForm((prev) => {
                        const next = [...prev.skillsToTeach];
                        next[idx] = { ...next[idx], price: val };
                        return { ...prev, skillsToTeach: next };
                      });
                    }}
                    placeholder="Price"
                    title={form.country ? `Amount in ${getCurrencyForCountry(form.country).symbol}` : "Amount"}
                    className="w-24 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] outline-none"
                  />
                  {form.country && (
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px]">
                      {getCurrencyForCountry(form.country).symbol}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        skillsToTeach: prev.skillsToTeach.filter((_, i) => i !== idx)
                      }))
                    }
                    className="rounded-full border border-red-400/60 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    skillsToTeach: [
                      ...prev.skillsToTeach,
                      { name: "", level: "Beginner", price: 0 }
                    ]
                  }))
                }
                className="rounded-full border border-slate-300 dark:border-white/20 px-3 py-1 text-[11px] theme-primary hover:bg-slate-100 dark:hover:bg-white/10"
              >
                + Add teaching skill
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] theme-accent">
              Learner · Mastered subjects
            </p>
            <p className="text-[10px] theme-muted mb-1">Separate with new line, comma or semicolon</p>
            <textarea
              value={masteredText}
              onChange={(e) => setMasteredText(e.target.value)}
              onBlur={(e) => handleCommaListChange("masteredSubjects", e.target.value)}
              placeholder={"React, JavaScript\nPython"}
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-3 py-2 text-xs outline-none theme-primary ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
            />
          </div>
        </section>

        {(form.skillsToTeach || []).some((s) => s.price > 0) && (
          <section className="glass-card p-4 border-2 border-emerald-500/30">
            <p className="text-[11px] uppercase tracking-[0.18em] theme-accent mb-2">
              Payment details (for paid teaching)
            </p>
            <p className="text-[11px] text-white/60 mb-3">
              Add bank details and/or QR code so learners can pay you. Optional; learners can skip until they join the session.
            </p>
            <div className="space-y-3">
              {(form.paymentDetails || []).map((pd, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2"
                >
                  <input
                    type="text"
                    value={pd.bankName || ""}
                    onChange={(e) => {
                      const next = [...(form.paymentDetails || [])];
                      next[idx] = { ...next[idx], bankName: e.target.value };
                      setForm((prev) => ({ ...prev, paymentDetails: next }));
                    }}
                    placeholder="Bank name"
                    className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] outline-none"
                  />
                  <input
                    type="text"
                    value={pd.country || ""}
                    onChange={(e) => {
                      const next = [...(form.paymentDetails || [])];
                      next[idx] = { ...next[idx], country: e.target.value };
                      setForm((prev) => ({ ...prev, paymentDetails: next }));
                    }}
                    placeholder="Country"
                    className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] outline-none"
                  />
                  <textarea
                    value={pd.bankDetails || ""}
                    onChange={(e) => {
                      const next = [...(form.paymentDetails || [])];
                      next[idx] = { ...next[idx], bankDetails: e.target.value };
                      setForm((prev) => ({ ...prev, paymentDetails: next }));
                    }}
                    placeholder="Account number, branch, SWIFT, etc."
                    rows={2}
                    className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] outline-none"
                  />
                  <ImageUriInput
                    value={pd.qrCodeUrl || ""}
                    uploadType="qr"
                    onChange={(v) => {
                      const next = [...(form.paymentDetails || [])];
                      next[idx] = { ...next[idx], qrCodeUrl: v };
                      setForm((prev) => ({ ...prev, paymentDetails: next }));
                    }}
                    placeholder="QR code image URL or upload"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        paymentDetails: prev.paymentDetails.filter((_, i) => i !== idx)
                      }))
                    }
                    className="rounded-full border border-red-400/60 px-2 py-0.5 text-[10px] text-red-300 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    paymentDetails: [...(prev.paymentDetails || []), { bankName: "", country: "", bankDetails: "", qrCodeUrl: "" }]
                  }))
                }
                className="rounded-full border border-slate-300 dark:border-white/20 px-3 py-1 text-[11px] theme-primary hover:bg-slate-100 dark:hover:bg-white/10"
              >
                + Add payment method
              </button>
            </div>
          </section>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
        {saved && !error && <p className="text-xs text-emerald-300">Profile saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="glass-button bg-gradient-to-r from-nexus-500 to-purple-500 px-4 py-2 text-xs font-medium shadow-lg shadow-nexus-500/30 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      {/* Verification Section */}
      <section className="glass-card p-4 border-2 border-emerald-500/30">
        <h2 className="mb-2 text-sm font-semibold theme-accent">Get Verified</h2>
        <p className="mb-4 text-xs theme-muted">
          Submit your ID/photo to be verified as a learner. Teachers: add certificates or documentation.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium theme-primary mb-2">Learner: ID / Photo proof</p>
            <VerificationUpload
              files={form.verificationPhotos}
              type="learner_photo"
              onUpdate={(urls) => setForm((prev) => ({ ...prev, verificationPhotos: urls }))}
              token={token}
            />
          </div>
          <div>
            <p className="text-[11px] font-medium theme-primary mb-2">Teacher: Certificates & docs</p>
            <VerificationUpload
              files={form.teacherCertificates}
              type="teacher_certificate"
              onUpdate={(urls) => setForm((prev) => ({ ...prev, teacherCertificates: urls }))}
              token={token}
            />
          </div>
        </div>
        <p className="mt-2 text-[10px] theme-muted">Save profile after uploading. Admin will review and verify.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await axios.post("/api/auth/verification/request", { role: "Learner" }, { headers: { Authorization: `Bearer ${token}` } });
                showToast("Requested learner verification", "success");
              } catch {
                showToast("Could not request learner verification", "error");
              }
            }}
            className="rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-200"
          >
            Request learner verification
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await axios.post("/api/auth/verification/request", { role: "Teacher" }, { headers: { Authorization: `Bearer ${token}` } });
                showToast("Requested teacher verification", "success");
              } catch {
                showToast("Could not request teacher verification", "error");
              }
            }}
            className="rounded border border-purple-400/50 bg-purple-500/20 px-3 py-1 text-[11px] text-purple-200"
          >
            Request teacher verification
          </button>
        </div>
      </section>

      {/* Password Change Section */}
      <section className="glass-card p-4 border-2 border-amber-500/30">
        <h2 className="mb-4 text-sm font-semibold text-amber-200">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="text-[11px] theme-muted">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              required
            />
          </div>
          <div>
            <label className="text-[11px] theme-muted">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="text-[11px] theme-muted">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              minLength={6}
              required
            />
          </div>
          {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
          {passwordSuccess && <p className="text-xs text-emerald-300">Password changed successfully!</p>}
          <button
            type="submit"
            disabled={changingPassword}
            className="glass-button bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-medium shadow-lg shadow-amber-500/30 disabled:opacity-60"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </section>

      {/* Security Questions for Password Reset */}
      <section className="glass-card p-4 border-2 border-blue-500/30">
        <h2 className="mb-2 text-sm font-semibold text-blue-200">Security Questions</h2>
        <p className="mb-3 text-xs theme-muted">Set up security questions to reset your password if you forget it.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {secQuestions.map((qa, i) => (
            <div key={i} className="space-y-1">
              <input
                type="text"
                value={qa.question}
                onChange={(e) => {
                  const next = [...secQuestions]; next[i] = { ...next[i], question: e.target.value }; setSecQuestions(next);
                }}
                placeholder={`Question ${i + 1}`}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              />
              <input
                type="text"
                value={qa.answer}
                onChange={(e) => {
                  const next = [...secQuestions]; next[i] = { ...next[i], answer: e.target.value }; setSecQuestions(next);
                }}
                placeholder="Answer"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none ring-nexus-500/40 focus:border-nexus-300 focus:ring-2"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              const token = localStorage.getItem("sn_token");
              await axios.put("/api/auth/security-questions", { questions: secQuestions }, { headers: { Authorization: `Bearer ${token}` } });
              showToast("Security questions saved");
            } catch (e) {
              showToast(e.response?.data?.message || "Failed to save");
            }
          }}
          className="mt-3 rounded border border-blue-400/50 bg-blue-500/20 px-3 py-1 text-xs"
        >
          Save Security Questions
        </button>
      </section>
    </main>
  );
};

export default ProfileEditPage;

