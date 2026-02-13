import React from "react";
import Avatar from "../../shared/Avatar.jsx";

const AdminUserRow = ({ user, onLoadHistory, onChangeRole, onToggleVerify }) => {
  return (
    <tr className="hover:bg-white/5">
      <td className="border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <Avatar src={user.profilePic} name={user.name} size="sm" />
          <button type="button" onClick={() => onLoadHistory(user._id)} className="font-medium text-nexus-200 hover:underline">
            {user.name}
          </button>
        </div>
      </td>
      <td className="border-b border-white/5 px-3 py-2">{user.email}</td>
      <td className="border-b border-white/5 px-3 py-2">
        <select value={user.role} onChange={(e) => onChangeRole(user._id, e.target.value)} className="rounded-md bg-black/40 px-2 py-1 text-[11px] outline-none">
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
      </td>
      <td className="border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Teacher</span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={Boolean(user.isTeacherVerified)} onChange={() => onToggleVerify(user._id, "Teacher", Boolean(user.isTeacherVerified))} />
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${user.isTeacherVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                {user.isTeacherVerified ? "Verified" : "Unverified"}
              </span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Learner</span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={Boolean(user.isLearnerVerified)} onChange={() => onToggleVerify(user._id, "Learner", Boolean(user.isLearnerVerified))} />
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${user.isLearnerVerified ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40" : "bg-red-500/20 text-red-200 border border-red-400/40"}`}>
                {user.isLearnerVerified ? "Verified" : "Unverified"}
              </span>
            </label>
          </div>
        </div>
      </td>
      <td className="border-b border-white/5 px-3 py-2">
        <button type="button" onClick={() => onLoadHistory(user._id)} className="rounded-full border border-blue-400/50 bg-blue-500/20 px-2 py-0.5 text-[11px] text-blue-200 hover:bg-blue-500/30">
          View Details
        </button>
      </td>
    </tr>
  );
};

export default AdminUserRow;
