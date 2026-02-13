import React from "react";

const DashboardToggle = ({ isTeacherMode, onToggle, isTeacherVerified }) => {
  return (
    <div className="mx-auto flex max-w-md items-center justify-center text-xs sm:text-sm">
      {isTeacherMode ? (
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="glass-button w-full py-3 bg-gradient-to-r from-nexus-500 to-purple-500 text-white"
        >
          Switch to learner mode
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="glass-button w-full py-3 bg-gradient-to-r from-nexus-500 to-purple-500 text-white disabled:opacity-60"
          disabled={!isTeacherVerified}
          title={!isTeacherVerified ? "Get teacher verification to enable teaching" : ""}
        >
          Switch to teaching mode
        </button>
      )}
      {!isTeacherMode && !isTeacherVerified && (
        <p className="mt-2 text-[11px] text-amber-200 text-center">
          Admin needs to approve your Teacher verification. <a href="/me/profile" className="underline">Upload certificates</a>
        </p>
      )}
    </div>
  );
};

export default DashboardToggle;

