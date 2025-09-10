import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getBoothWorkers, blockPartyWorker, reassignBoothToPartyWorker, iConnect_get_all_wards_web, iConnect_get_all_booths_web } from "../../apis/BoothWorkerApis";

const BoothWorkersPage = () => {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedWorkerPerformance, setSelectedWorkerPerformance] = useState(null);
  const [boothWorkers, setBoothWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didFetchRef = useRef(false);
  const [blockingById, setBlockingById] = useState({});
  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    message: "",
  });
  const [wards, setWards] = useState([]);
  const [availableBooths, setAvailableBooths] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [filters, setFilters] = useState({
    status: "",
    boothType: "",
  });
  const [reassignmentData, setReassignmentData] = useState({
    workerId: null,
    wardId: "",
    boothId: "",
    currentWardId: "0",
    currentBoothId: "0",
    currentAssemblyId: "0",
  });
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("user_id") || "";
      const resp = await getBoothWorkers(userId);
      const items = Array.isArray(resp?.RESULT) ? resp.RESULT : [];
      const mapped = items.map((w) => ({
        id: w.user_number,
        user_id: w.user_id,
        name: w.name,
        status: w.status,
        joiningDate: w.joining_date,
        boothAssigned: w.booth_number
          ? `${w.booth_number} - ${w.booth_name || "Unnamed"} - ${w.booth_address || "No Address"}`
          : "None",
        boothType: w.booth_type,
        address: w.booth_address,
        history: Array.isArray(w.history) ? w.history : [],
        user_number: w.user_number,
        gender: w.gender || "—",
        dob: w.dob,
        town_village: w.town_village || "—",
        district: w.district || "—",
        state: w.state || "—",
        pin_code: w.pin_code || "—",
        username: w.username || "—",
        role_id: w.user_role_id,
        assembly_id: w.assembly_id || "0",
        ward_id: w.ward_id || "0",
        booth_id: w.booth_id || "0",
        email: w.email,
        phone_number: w.phone_number,
        joining_date: w.joining_date,
        referred_by: w.referred_by || "—",
        booth_name: w.booth_name,
        assembly_name: w.assembly_name,
        performanceMetrics: {
          tasksCompleted: Math.floor(Math.random() * 100),
          votersReached: Math.floor(Math.random() * 1000),
          eventsAttended: Math.floor(Math.random() * 50),
          rating: (Math.random() * 5).toFixed(1),
        },
      }));
      setBoothWorkers(mapped);
    } catch {
      setError("Failed to load booth workers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchWorkers();
  }, [fetchWorkers]);

  const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d)) return "—";
    return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  const showToast = (message, type = "info", durationMs = 4000) => {
    setToast({ visible: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, durationMs);
  };

  const fetchWards = async () => {
    const userId = sessionStorage.getItem("user_id") || "";
    const { wards, error } = await iConnect_get_all_wards_web({ user_id: userId });
    if (error) showToast(error, "error");
    setWards(wards || []);
    return wards || [];
  };

  const fetchBooths = async (wardId) => {
    if (!wardId) return [];
    const { booths, error } = await iConnect_get_all_booths_web({ ward_id: wardId });
    if (error) showToast(error, "error");
    setAvailableBooths(booths || []);
    return booths || [];
  };

  const toggleRowExpand = (workerId) => {
    setExpandedRows({
      ...expandedRows,
      [workerId]: !expandedRows[workerId],
    });
  };

  const openProfileModal = (worker) => {
    setSelectedWorker(worker);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedWorker(null);
  };

  const blockWorker = async (worker) => {
    if (!worker?.user_id) return;
    const loggedInUserId = sessionStorage.getItem("user_id") || "";
    const targetUserId = worker.user_id;
    if (blockingById[targetUserId]) return;
    try {
      setBlockingById((s) => ({ ...s, [targetUserId]: true }));
      const resp = await blockPartyWorker(loggedInUserId, targetUserId);
      const resultArr = Array.isArray(resp?.RESULT) ? resp.RESULT : undefined;
      const resultObj = resultArr && resultArr.length > 0 ? resultArr[0] : undefined;
      const rawFlag = (resp && (resp.p_out_mssg_flg ?? resp.RESULT?.p_out_mssg_flg ?? resp.result?.p_out_mssg_flg)) ?? (resultObj && (resultObj.p_out_mssg_flg ?? resultObj.P_OUT_MSSG_FLG)) ?? "";
      const flag = String(rawFlag).trim().toUpperCase();
      const rawMessage = (resp && (resp.p_out_mssg ?? resp.RESULT?.p_out_mssg ?? resp.result?.p_out_mssg)) ?? (resultObj && (resultObj.p_out_mssg ?? resultObj.P_OUT_MSSG)) ?? "Worker status updated successfully";
      const message = String(rawMessage).trim();
      const inferredSuccess = !flag && /success|updated|block/i.test(message || "");
      if (flag === "S" || inferredSuccess) {
        showToast(message || "Worker status updated successfully", "success");
        await fetchWorkers();
      } else {
        showToast(message || "Failed to update status", "error");
      }
    } catch {
      showToast("Could not update status. Please try again.", "error");
    } finally {
      setBlockingById((s) => ({ ...s, [targetUserId]: false }));
    }
  };

  const openPerformanceModal = (worker) => {
    setSelectedWorkerPerformance(worker);
    setShowPerformanceModal(true);
  };

  const closePerformanceModal = () => {
    setShowPerformanceModal(false);
    setSelectedWorkerPerformance(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1); // Reset to first page on filter change
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      boothType: "",
    });
    setCurrentPage(1); // Reset to first page on filter reset
  };

  const filteredWorkers = boothWorkers.filter((worker) => {
    if (filters.status && worker.status !== filters.status) {
      return false;
    }
    if (filters.boothType && worker.boothType !== filters.boothType) {
      return false;
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredWorkers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedWorkers = filteredWorkers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const handleReassign = async (worker) => {
    await fetchWards();
    setReassignmentData({
      workerId: worker.user_id,
      wardId: "",
      boothId: "",
      currentWardId: worker.ward_id || "0",
      currentBoothId: worker.booth_id || "0",
      currentAssemblyId: worker.assembly_id || "0",
    });
    if (wards.length > 0) {
      await fetchBooths(wards[0].ward_id);
    }
  };

  const handleWardChange = async (e) => {
    const wardId = e.target.value;
    await fetchBooths(wardId);
    setReassignmentData((prev) => ({
      ...prev,
      wardId,
      boothId: "",
    }));
  };

  const handleBoothChange = (e) => {
    setReassignmentData((prev) => ({
      ...prev,
      boothId: e.target.value,
    }));
  };

  const completeReassignment = async () => {
    if (!reassignmentData.wardId || !reassignmentData.boothId) {
      showToast("Please select both ward and booth", "error");
      return;
    }
    try {
      const [newBoothId] = reassignmentData.boothId.split(" - ");
      const resp = await reassignBoothToPartyWorker(
        reassignmentData.workerId,
        reassignmentData.currentWardId,
        reassignmentData.currentBoothId,
        reassignmentData.currentAssemblyId,
        reassignmentData.wardId,
        newBoothId,
        reassignmentData.currentAssemblyId
      );
      const resultArr = Array.isArray(resp?.RESULT) ? resp.RESULT : undefined;
      const resultObj = resultArr && resultArr.length > 0 ? resultArr[0] : undefined;
      const rawFlag = (resp && (resp.p_out_mssg_flg ?? resp.RESULT?.p_out_mssg_flg ?? resp.result?.p_out_mssg_flg)) ?? (resultObj && (resultObj.p_out_mssg_flg ?? resultObj.P_OUT_MSSG_FLG)) ?? "";
      const flag = String(rawFlag).trim().toUpperCase();
      const rawMessage = (resp && (resp.p_out_mssg ?? resp.RESULT?.p_out_mssg ?? resp.result?.p_out_mssg)) ?? (resultObj && (resultObj.p_out_mssg ?? resultObj.P_OUT_MSSG)) ?? "Worker reassigned successfully";
      const message = String(rawMessage).trim();
      const inferredSuccess = !flag && /success|reassigned/i.test(message || "");
      if (flag === "S" || inferredSuccess) {
        showToast(message || "Worker reassigned successfully", "success");
        await fetchWorkers();
        setReassignmentData({
          workerId: null,
          wardId: "",
          boothId: "",
          currentWardId: "0",
          currentBoothId: "0",
          currentAssemblyId: "0",
        });
      } else {
        showToast(message || "Failed to reassign booth", "error");
      }
    } catch {
      showToast("Could not reassign booth. Please try again.", "error");
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      case "Blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="pt-0 px-8">
      {toast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div
            className={`px-5 py-2 rounded-full shadow-md border text-sm text-center min-w-[280px] ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="material-icons-outlined text-blue-600">group</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Total Booth Workers
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {boothWorkers.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="material-icons-outlined text-green-600">verified_user</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Active Workers
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {boothWorkers.filter((w) => w.status === "Active").length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <span className="material-icons-outlined text-red-600">person_off</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Inactive/Blocked
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {boothWorkers
                  .filter((w) => w.status === "Inactive" || w.status === "Blocked")
                  .length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <span className="material-icons-outlined text-orange-600">filter_list</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Filtered Results
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {filteredWorkers.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="boothType"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
            >
              Booth Type
            </label>
            <select
              id="boothType"
              name="boothType"
              value={filters.boothType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All Booth Types</option>
              <option value="strong">Strong</option>
              <option value="weak">Weak</option>
              <option value="swing">Swing</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Booth Worker List
          </h2>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Rows per page:
            </label>
            <select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Worker Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-red-600"
                  >
                    {error}
                  </td>
                </tr>
              ) : paginatedWorkers.length > 0 ? (
                paginatedWorkers.map((worker) => (
                  <React.Fragment key={worker.user_id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                        {worker.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                        <button
                          onClick={() => openProfileModal(worker)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {worker.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(
                            worker.status
                          )}`}
                        >
                          {worker.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {formatDate(worker.joiningDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleRowExpand(worker.user_id)}
                            className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            {expandedRows[worker.user_id] ? "Hide Details" : "View More"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[worker.user_id] && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                                <span className="material-icons-outlined mr-2 text-blue-600">
                                  person
                                </span>
                                Worker Details
                              </h3>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                                    Performance Metrics
                                  </span>
                                  <button
                                    onClick={() => openPerformanceModal(worker)}
                                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-semibold mt-1 block"
                                  >
                                    View Performance Details
                                  </button>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                                    Booth Assignment
                                  </span>
                                  <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                                    {worker.boothAssigned || "None"}{" "}
                                    {worker.boothType && `(${worker.boothType})`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                                <span className="material-icons-outlined mr-2 text-green-600">
                                  settings
                                </span>
                                Actions
                              </h3>
                              <div className="space-y-2">
                                {worker.status !== "Blocked" && (
                                  <div className="bg-white rounded-lg border border-gray-200">
                                    {reassignmentData.workerId === worker.user_id ? (
                                      <div className="p-3 space-y-2">
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                                          Select Ward
                                        </label>
                                        <select
                                          value={reassignmentData.wardId}
                                          onChange={handleWardChange}
                                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                        >
                                          <option value="">Select Ward</option>
                                          {wards.map((ward) => (
                                            <option key={ward.ward_id} value={ward.ward_id}>
                                              {ward.ward_name || `Ward ${ward.ward_id}`}
                                            </option>
                                          ))}
                                        </select>
                                        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mt-2">
                                          Select Booth
                                        </label>
                                        <select
                                          value={reassignmentData.boothId}
                                          onChange={handleBoothChange}
                                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                        >
                                          <option value="">Select Booth</option>
                                          {availableBooths.map((booth) => (
                                            <option
                                              key={booth.booth_id}
                                              value={`${booth.booth_id} - ${booth.booth_name || `Booth ${booth.booth_id}`} - ${booth.booth_address || "No Address"}`}
                                            >
                                              {`${booth.booth_id} - ${booth.booth_name || `Booth ${booth.booth_id}`} - ${booth.booth_address || "No Address"}`}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="flex gap-2 pt-1">
                                          <button
                                            onClick={completeReassignment}
                                            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() =>
                                              setReassignmentData({
                                                workerId: null,
                                                wardId: "",
                                                boothId: "",
                                                currentWardId: "0",
                                                currentBoothId: "0",
                                                currentAssemblyId: "0",
                                              })
                                            }
                                            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        className="w-full p-3 text-left hover:bg-gray-50 transition-colors group"
                                        onClick={() => handleReassign(worker)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-green-700 group-hover:text-green-800">
                                              {worker.boothAssigned ? "Reassign to Booth" : "Assign to Booth"}
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                              Change booth assignment
                                            </p>
                                          </div>
                                          <span className="material-icons-outlined text-green-600 group-hover:text-green-700">
                                            location_on
                                          </span>
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                )}
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="grid grid-cols-1 divide-y divide-gray-200">
                                    {worker.status !== "Blocked" ? (
                                      <button
                                        className="p-3 text-left hover:bg-gray-50 transition-colors group"
                                        disabled={!!blockingById[worker.user_id]}
                                        onClick={() => blockWorker(worker)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-red-700 group-hover:text-red-800">
                                              {blockingById[worker.user_id] ? "Blocking..." : "Block User"}
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                              Block worker from assignments
                                            </p>
                                          </div>
                                          <span className="material-icons-outlined text-red-600 group-hover:text-red-700">
                                            block
                                          </span>
                                        </div>
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No booth workers found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-[var(--text-secondary)]">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredWorkers.length)} of {filteredWorkers.length} workers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {showProfileModal && selectedWorker && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-slate-200 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Worker Profile Details
                </h2>
                <button
                  onClick={closeProfileModal}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                    <span className="material-icons-outlined mr-2 text-blue-600">person</span>
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Worker Number
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.user_number || selectedWorker.id}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Full Name
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.name}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Gender
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.gender || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Date of Birth
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {formatDate(selectedWorker.dob)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Phone Number
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.phone_number || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Email
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.email || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Address
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.address || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Town/Village
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.town_village || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        District
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.district || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        State
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.state || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        PIN Code
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.pin_code || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Referred By
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.referred_by || "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] flex items-center">
                    <span className="material-icons-outlined mr-2 text-green-600">work</span>
                    Work Information
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Username
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.username || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Role ID
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.role_id || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Assembly
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.assembly_name || selectedWorker.assembly_id || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Booth
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.boothAssigned || "—"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Status
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass(
                            selectedWorker.status
                          )}`}
                        >
                          {selectedWorker.status}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Joining Date
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {formatDate(selectedWorker.joining_date || selectedWorker.joiningDate)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">
                        Booth Assignment
                      </label>
                      <p className="text-[var(--text-primary)] font-semibold">
                        {selectedWorker.boothAssigned || "Not Assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeProfileModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPerformanceModal && selectedWorkerPerformance && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-slate-200 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Performance Metrics - {selectedWorkerPerformance.name}
                </h2>
                <button
                  onClick={closePerformanceModal}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="material-icons-outlined">close</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedWorkerPerformance.performanceMetrics.tasksCompleted}
                  </p>
                  <p className="text-sm text-blue-700">Tasks Completed</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedWorkerPerformance.performanceMetrics.votersReached}
                  </p>
                  <p className="text-sm text-green-700">Voters Reached</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">
                    {selectedWorkerPerformance.performanceMetrics.eventsAttended}
                  </p>
                  <p className="text-sm text-orange-700">Events Attended</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedWorkerPerformance.performanceMetrics.rating}/5
                  </p>
                  <p className="text-sm text-purple-700">Rating</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li key="strength-1">• Excellent voter outreach</li>
                    <li key="strength-2">• Consistent task completion</li>
                    <li key="strength-3">• Strong community engagement</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li key="improvement-1">• Event attendance could be higher</li>
                    <li key="improvement-2">• Could focus on difficult areas</li>
                    <li key="improvement-3">• Digital engagement training needed</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li key="recommendation-1">• Assign to leadership role</li>
                    <li key="recommendation-2">• Provide advanced training</li>
                    <li key="recommendation-3">• Consider for mentorship program</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closePerformanceModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoothWorkersPage;