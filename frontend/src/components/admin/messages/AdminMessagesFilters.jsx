import React from "react";
import FilterChips from "../../shared/FilterChips.jsx";

const AdminMessagesFilters = ({ query, onChange, contentType, onContentTypeChange }) => {
  return (
    <div className="glass-card p-3 mb-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by user or content"
        className="flex-1 rounded bg-black/30 px-3 py-2 text-xs outline-none"
      />
      <select
        value={contentType}
        onChange={(e) => onContentTypeChange(e.target.value)}
        className="rounded bg-black/30 px-2 py-2 text-xs outline-none"
        title="Content type"
      >
        <option value="all">All</option>
        <option value="links">With links</option>
        <option value="mentions">@mentions</option>
        <option value="long">Long</option>
        <option value="edited">Edited</option>
      </select>
      <FilterChips
        options={[
          { label: "All", value: "all" },
          { label: "Links", value: "links" },
          { label: "@mentions", value: "mentions" },
          { label: "Long", value: "long" },
          { label: "Edited", value: "edited" },
        ]}
        value={contentType}
        onChange={onContentTypeChange}
      />
    </div>
  );
};

export default AdminMessagesFilters;
