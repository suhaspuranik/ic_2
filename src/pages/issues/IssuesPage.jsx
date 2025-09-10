import { useMemo, useState } from "react";

const sampleIssues = [
  {
    id: "1",
    user_id: "1",
    booth_id: "1",
    ward_id: "0",
    assembly_id: "0",
    visibility: "Public",
    issue_type: "water",
    issue_description: "High",
    priority: "",
    status: "High",
    media: [],
    created_at: "2025-09-03 11:10:16",
    updated_at: "2025-09-08 14:06:30",
  },
  {
    id: "2",
    user_id: "3",
    booth_id: "46",
    ward_id: "2",
    assembly_id: "1",
    visibility: "",
    issue_type: "road",
    issue_description: "Low",
    priority: "Closed",
    status: "medium",
    media: [],
    created_at: "2025-09-03 11:10:16",
    updated_at: "2025-09-08 14:06:30",
  },
  {
    id: "3",
    user_id: "2",
    booth_id: "101",
    ward_id: "0",
    assembly_id: "1",
    visibility: "Public",
    issue_type: "Water Supply",
    issue_description: "No water for 2 days",
    priority: "High",
    status: "In Progress",
    media: [],
    created_at: "2025-09-03 12:06:39",
    updated_at: "2025-09-09 10:26:13",
  },
  // Add more issues as needed based on the table
];

const allDepartments = [
  "Sanitation",
  "Water Supply",
  "Roads & Transport",
  "Electricity",
  "Parks & Recreation",
  "Road Issue",
  "Industry Pollution",
  "Infrastructure",
  "Road Maintenance",
];

const allStatuses = ["Open", "In Progress", "Resolved", "Closed", "Pending"];
const allPriorities = ["High", "Medium", "Low"];

const IssuesPage = () => {
  const [issues, setIssues] = useState(sampleIssues);
  const [expanded, setExpanded] = useState(new Set());
  const [filters, setFilters] = useState({
    search: "",
    issue_type: "",
    status: "",
    priority: "",
  });
  const [editedIssues, setEditedIssues] = useState({});

  const toggleExpand = (id) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => setFilters({ search: "", issue_type: "", status: "", priority: "" });

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const hay = `${issue.id} ${issue.user_id} ${issue.issue_description} ${issue.issue_type}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      if (filters.issue_type && issue.issue_type !== filters.issue_type) return false;
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      return true;
    });
  }, [issues, filters]);

  const handleEditChange = (id, field, value) => {
    setEditedIssues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSubmit = () => {
    setIssues((prev) =>
      prev.map((issue) => {
        const edits = editedIssues[issue.id] || {};
        return edits.status || edits.issue_type || edits.priority
          ? { ...issue, ...edits }
          : issue;
      })
    );
    setEditedIssues({});
  };

  return (
    <div className="pt-0 px-8">
      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Search</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search issues..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Issue Type</label>
            <select
              name="issue_type"
              value={filters.issue_type}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All</option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Priority</label>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All</option>
              {allPriorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Issue ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Raised By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Issue Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <>
                  <tr
                    key={issue.id}
                    onClick={() => toggleExpand(issue.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleExpand(issue.id);
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">{issue.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{issue.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{issue.issue_description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {issue.issue_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{issue.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                          issue.status === "Resolved" || issue.status === "Closed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : issue.status === "In Progress"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : issue.status === "Pending"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(issue.id); }}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                  {expanded.has(issue.id) && (
                    <tr key={`${issue.id}-details`} className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Details</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                              Booth ID: {issue.booth_id}, Ward ID: {issue.ward_id}, Assembly ID: {issue.assembly_id}<br />
                              Visibility: {issue.visibility || "N/A"}<br />
                              Created: {new Date(issue.created_at).toLocaleString()}<br />
                              Updated: {new Date(issue.updated_at).toLocaleString()}
                            </p>
                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Media</h4>
                            {issue.media.length === 0 ? (
                              <div className="text-xs text-gray-500">No media attached</div>
                            ) : (
                              <div className="flex gap-3 flex-wrap">
                                {issue.media.map((media, idx) => (
                                  <img
                                    key={idx}
                                    src={media.file_url || media.url}
                                    alt={`media-${idx}`}
                                    className="w-40 h-24 object-cover rounded border"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-1">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Issue Type</label>
                              <select
                                value={editedIssues[issue.id]?.issue_type || issue.issue_type}
                                onChange={(e) => handleEditChange(issue.id, "issue_type", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                              >
                                {allDepartments.map((d) => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Priority</label>
                              <select
                                value={editedIssues[issue.id]?.priority || issue.priority}
                                onChange={(e) => handleEditChange(issue.id, "priority", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                              >
                                {allPriorities.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                              <select
                                value={editedIssues[issue.id]?.status || issue.status}
                                onChange={(e) => handleEditChange(issue.id, "status", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                              >
                                {allStatuses.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
                              >
                                Submit Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IssuesPage;