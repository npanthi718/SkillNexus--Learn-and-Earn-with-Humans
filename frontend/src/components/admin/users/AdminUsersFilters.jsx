import React from "react";
import FilterChips from "../../shared/FilterChips.jsx";

const AdminUsersFilters = ({ query, role, teacherVerified, learnerVerified, minTrust, onQuery, onRole, onTeacherVerified, onLearnerVerified, onMinTrust }) => {
  return (
    <div className="glass-card p-3 mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <input
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Search by name or email"
        className="flex-1 rounded bg-black/30 px-3 py-2 text-xs outline-none"
      />
      <select
        value={role}
        onChange={(e) => onRole(e.target.value)}
        className="rounded bg-black/30 px-2 py-2 text-xs outline-none"
        title="Role"
      >
        <option value="all">All roles</option>
        <option value="User">User</option>
        <option value="Admin">Admin</option>
      </select>
      <FilterChips
        options={[
          { label: "All roles", value: "all" },
          { label: "User", value: "User" },
          { label: "Admin", value: "Admin" },
        ]}
        value={role}
        onChange={onRole}
      />
      <label className="flex items-center gap-2 text-xs">
        <span>Teacher verified</span>
        <select value={teacherVerified} onChange={(e) => onTeacherVerified(e.target.value)} className="rounded bg-black/30 px-2 py-1 text-xs outline-none">
          <option value="any">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <FilterChips
          options={[
            { label: "Any", value: "any" },
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={teacherVerified}
          onChange={onTeacherVerified}
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <span>Learner verified</span>
        <select value={learnerVerified} onChange={(e) => onLearnerVerified(e.target.value)} className="rounded bg-black/30 px-2 py-1 text-xs outline-none">
          <option value="any">Any</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        <FilterChips
          options={[
            { label: "Any", value: "any" },
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ]}
          value={learnerVerified}
          onChange={onLearnerVerified}
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <span>Min trust</span>
        <input
          type="number"
          min={0}
          max={5}
          step={0.5}
          value={minTrust}
          onChange={(e) => onMinTrust(Number(e.target.value))}
          className="w-20 rounded bg-black/30 px-2 py-1 text-xs outline-none"
        />
      </label>
    </div>
  );
};

export default AdminUsersFilters;
