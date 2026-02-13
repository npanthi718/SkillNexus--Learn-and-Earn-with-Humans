import React from "react";
import axios from "axios";
import Avatar from "../shared/Avatar.jsx";

const AdminUserDetailsForm = ({
  selectedUser,
  selectedUserData,
  userHistory,
  setSelectedUser,
  setSelectedUserData,
  setUserHistory,
  handleUpdateUser,
  handleChangeRole,
  handleToggleVerify,
  handleAwardBadge,
  handleRemoveBadge,
  handleDeleteUser,
  authHeaders,
  users
}) => {
  if (!selectedUser || !selectedUserData || !userHistory) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-200">
          {selectedUserData.name} - Full Details
        </h3>
        <button
          type="button"
          onClick={() => {
            setSelectedUser(null);
            setSelectedUserData(null);
            setUserHistory(null);
          }}
          className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
        >
          ← Back to List
        </button>
      </div>
      <div className="glass-card p-4 border-2 border-amber-500/30">
        <h4 className="mb-3 text-sm font-semibold text-amber-200">Basic Information</h4>
        <div className="mb-4 flex items-center gap-4">
          <Avatar src={selectedUserData.profilePic} name={selectedUserData.name} size="2xl" />
          <div>
            <p className="text-[11px] theme-muted">Profile picture</p>
            <p className="text-xs theme-primary mt-0.5">{selectedUserData.profilePic ? "Uploaded" : "No photo uploaded"}</p>
          </div>
        </div>
        {((selectedUserData.verificationPhotos || []).length > 0 || (selectedUserData.teacherCertificates || []).length > 0) && (
          <div className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
            <p className="text-[11px] font-medium theme-accent mb-2">Verification documents (ID proof & certificates)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(selectedUserData.verificationPhotos || []).length > 0 && (
                <div>
                  <p className="text-[10px] theme-muted mb-1">Learner ID / photos</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserData.verificationPhotos.map((doc, i) => {
                      const url = typeof doc === "string" ? doc : doc?.url;
                      return url ? (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={url} alt="" className="h-20 w-20 rounded object-cover border border-white/20 hover:ring-2 ring-nexus-400" />
                        </a>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {(selectedUserData.teacherCertificates || []).length > 0 && (
                <div>
                  <p className="text-[10px] theme-muted mb-1">Teacher certificates</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserData.teacherCertificates.map((doc, i) => {
                      const url = typeof doc === "string" ? doc : doc?.url;
                      return url ? (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={url} alt="" className="h-20 w-20 rounded object-cover border border-white/20 hover:ring-2 ring-nexus-400" />
                        </a>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2 text-xs">
          <div>
            <p className="text-white/60">Name</p>
            <input
              type="text"
              value={selectedUserData.name}
              onChange={(e) => setSelectedUserData({ ...selectedUserData, name: e.target.value })}
              onBlur={() => handleUpdateUser(selectedUser, { name: selectedUserData.name })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
          </div>
          <div>
            <p className="text-white/60">Email</p>
            <input
              type="email"
              value={selectedUserData.email}
              onChange={(e) => setSelectedUserData({ ...selectedUserData, email: e.target.value })}
              onBlur={() => handleUpdateUser(selectedUser, { email: selectedUserData.email })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
          </div>
          <div>
            <p className="text-white/60">Role</p>
            <select
              value={selectedUserData.role}
              onChange={(e) => {
                const newRole = e.target.value;
                setSelectedUserData({ ...selectedUserData, role: newRole });
                handleChangeRole(selectedUser, newRole);
              }}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <p className="text-white/60">Bio</p>
            <textarea
              value={selectedUserData.bio || ""}
              onChange={(e) => setSelectedUserData({ ...selectedUserData, bio: e.target.value })}
              onBlur={() => handleUpdateUser(selectedUser, { bio: selectedUserData.bio })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
              rows="3"
            />
          </div>
          <div>
            <p className="text-white/60">Password (leave empty to keep current)</p>
            <input
              type="password"
              placeholder="Enter new password"
              onChange={(e) => {
                if (e.target.value) {
                  handleUpdateUser(selectedUser, { password: e.target.value });
                }
              }}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 text-xs">
          <div>
            <p className="text-white/60">Social links</p>
            <input
              type="text"
              placeholder="LinkedIn URL"
              defaultValue={selectedUserData.socialLinks?.linkedin || ""}
              onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), linkedin: e.target.value } })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
            <input
              type="text"
              placeholder="GitHub URL"
              defaultValue={selectedUserData.socialLinks?.github || ""}
              onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), github: e.target.value } })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
            <input
              type="text"
              placeholder="Website URL"
              defaultValue={selectedUserData.socialLinks?.website || ""}
              onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), website: e.target.value } })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
            <input
              type="text"
              placeholder="Twitter URL"
              defaultValue={selectedUserData.socialLinks?.twitter || ""}
              onBlur={(e) => handleUpdateUser(selectedUser, { socialLinks: { ...(selectedUserData.socialLinks || {}), twitter: e.target.value } })}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
            />
          </div>
          <div>
            <p className="text-white/60">Profile arrays</p>
            <textarea
              placeholder="Teaching languages (comma/newline)"
              defaultValue={(selectedUserData.teachingLanguages || []).join(", ")}
              onBlur={(e) => {
                const list = (e.target.value || "").split(/[\n,;|]+/).map((v) => v.trim()).filter(Boolean);
                handleUpdateUser(selectedUser, { teachingLanguages: list });
              }}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
              rows={2}
            />
            <textarea
              placeholder="Wishlist skills (comma/newline)"
              defaultValue={(selectedUserData.wishlistSkills || []).join(", ")}
              onBlur={(e) => {
                const list = (e.target.value || "").split(/[\n,;|]+/).map((v) => v.trim()).filter(Boolean);
                handleUpdateUser(selectedUser, { wishlistSkills: list });
              }}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
              rows={2}
            />
            <textarea
              placeholder="Mastered subjects (comma/newline)"
              defaultValue={(selectedUserData.masteredSubjects || []).join(", ")}
              onBlur={(e) => {
                const list = (e.target.value || "").split(/[\n,;|]+/).map((v) => v.trim()).filter(Boolean);
                handleUpdateUser(selectedUser, { masteredSubjects: list });
              }}
              className="mt-1 w-full rounded-md bg-black/40 px-2 py-1 outline-none"
              rows={2}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Teacher</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(selectedUserData?.isTeacherVerified)}
                  onChange={() => handleToggleVerify(selectedUser, "Teacher", Boolean(selectedUserData?.isTeacherVerified))}
                />
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedUserData?.isTeacherVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                  {selectedUserData?.isTeacherVerified ? "Verified" : "Unverified"}
                </span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Learner</span>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(selectedUserData?.isLearnerVerified)}
                  onChange={() => handleToggleVerify(selectedUser, "Learner", Boolean(selectedUserData?.isLearnerVerified))}
                />
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedUserData?.isLearnerVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                  {selectedUserData?.isLearnerVerified ? "Verified" : "Unverified"}
                </span>
              </label>
            </div>
          </div>
          {(selectedUserData.badges || []).includes("bestTeacher") ? (
            <button
              type="button"
              onClick={() => handleRemoveBadge(selectedUser, "bestTeacher")}
              className="rounded-lg border border-purple-400/50 bg-purple-500/30 px-3 py-1 text-xs text-purple-200 hover:bg-purple-500/40"
            >
              Remove Best Teacher
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAwardBadge(selectedUser, "bestTeacher")}
              className="rounded-lg border border-purple-400/50 bg-purple-500/20 px-3 py-1 text-xs text-purple-200 hover:bg-purple-500/30"
            >
              Award Best Teacher
            </button>
          )}
          {(selectedUserData.badges || []).includes("bestLearner") ? (
            <button
              type="button"
              onClick={() => handleRemoveBadge(selectedUser, "bestLearner")}
              className="rounded-lg border border-blue-400/50 bg-blue-500/30 px-3 py-1 text-xs text-blue-200 hover:bg-blue-500/40"
            >
              Remove Best Learner
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleAwardBadge(selectedUser, "bestLearner")}
              className="rounded-lg border border-blue-400/50 bg-blue-500/20 px-3 py-1 text-xs text-blue-200 hover:bg-blue-500/30"
            >
              Award Best Learner
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDeleteUser(selectedUser)}
            className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30"
          >
            Delete User
          </button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="text-[11px] theme-muted">Verification role</label>
            <select
              defaultValue="Teacher"
              onChange={(e) => setSelectedUserData((p) => ({ ...(p || {}), __feedbackRole: e.target.value }))}
              className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
            >
              <option value="Teacher">Teacher</option>
              <option value="Learner">Learner</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] theme-muted">Feedback / rejection reason</label>
            <textarea
              rows={3}
              placeholder="Tell the user what to fix"
              onBlur={(e) => setSelectedUserData((p) => ({ ...(p || {}), __feedbackMsg: e.target.value }))}
              className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-xs outline-none"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await axios.post(`/api/admin/users/${selectedUser}/verification-feedback`, { role: selectedUserData.__feedbackRole || "Teacher", message: selectedUserData.__feedbackMsg || "" }, { headers: authHeaders });
                  alert("Feedback sent");
                } catch (err) {
                  alert("Could not send feedback");
                }
              }}
              className="rounded border border-white/30 bg-white/10 px-3 py-1 text-[11px]"
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await axios.post(`/api/admin/users/${selectedUser}/verification-feedback`, { role: selectedUserData.__feedbackRole || "Teacher", message: selectedUserData.__feedbackMsg || "", reject: true }, { headers: authHeaders });
                  alert("Rejected with feedback");
                  const userRes = await axios.get(`/api/admin/users/${selectedUser}`, { headers: authHeaders });
                  setSelectedUserData(userRes.data.user);
                } catch (err) {
                  alert("Could not reject");
                }
              }}
              className="rounded border border-red-400/50 bg-red-500/20 px-3 py-1 text-[11px] text-red-300"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
      <div className="glass-card p-4">
        <h4 className="mb-3 text-sm font-semibold">
          As Learner ({userHistory.asLearner?.length || 0})
        </h4>
        <div className="max-h-64 space-y-2 overflow-auto text-xs">
          {userHistory.asLearner?.length === 0 ? (
            <p className="text-white/60">No learner sessions</p>
          ) : (
            userHistory.asLearner.map((s) => {
              const teachersForSkill = (users || []).filter((u) =>
                (u.skillsToTeach || []).some((st) =>
                  String(st.name || "").toLowerCase() === String(s.skillName || "").toLowerCase()
                )
              );
              return (
                <div key={s._id} className="rounded border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{s.skillName}</p>
                      <p className="mt-1 text-white/60">
                        {s.details || "No details."}
                      </p>
                      <p className="mt-1 text-white/60">
                        Status: {s.status}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <p className="text-white/60">Teachers:</p>
                      <div className="flex flex-wrap gap-1">
                        {teachersForSkill.map((t) => (
                          <span key={t._id} className="rounded bg-white/10 px-2 py-0.5 text-[10px]">{t.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailsForm;
