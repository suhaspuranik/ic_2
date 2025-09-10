import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import {
  initDB,
  addBatchToDB,
  getVotersByPage,
  clearVotersStore,
  getVotersCount,
  getMetaValue,
  setMetaValue,
} from "../../utils/indexedDB";
import { getAllVoterS3Url, getOtherVoterDetails } from "../../apis/VoterApis";

const VoterDetailsPage = () => {
  const navigate = useNavigate();
  const [db, setDb] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageVoters, setPageVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isInitializing = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [filterReligion, setFilterReligion] = useState("All");
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [voterDetails, setVoterDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const itemsPerPage = 50;

  // Authentication check
  useEffect(() => {
    const isAuthed = Boolean(
      sessionStorage.getItem("user_id") &&
      sessionStorage.getItem("email_id") &&
      sessionStorage.getItem("is_authenticated") === "true"
    );

    if (!isAuthed) {
      console.log("VoterDetailsPage: User not authenticated, redirecting to /login");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Derived data
  const genders = useMemo(() => {
    const genderSet = new Set(pageVoters.map((voter) => voter.gender).filter(Boolean));
    console.log("Available genders:", Array.from(genderSet));
    return Array.from(genderSet);
  }, [pageVoters]);

  const religions = useMemo(() => {
    const religionSet = new Set(pageVoters.map((voter) => voter.religion).filter(Boolean));
    console.log("Available religions:", Array.from(religionSet));
    return Array.from(religionSet);
  }, [pageVoters]);

  const filteredVoters = useMemo(() => {
    const result = pageVoters.filter((voter) => {
      const fullName = (
        voter.voter_full_name ||
        `${voter.voter_first_middle_name || ""} ${voter.voter_last_name || ""}`
      ).trim().toLowerCase();

      const matchesSearch =
        searchTerm === "" ||
        fullName.includes(searchTerm.toLowerCase().trim()) ||
        (voter.epic_number || "").toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchesGender = filterGender === "All" || voter.gender === filterGender;
      const matchesReligion = filterReligion === "All" || voter.religion === filterReligion;

      return matchesSearch && matchesGender && matchesReligion;
    });
    console.log("Filtered voters:", result.length, "out of", pageVoters.length);
    console.log("Sample filteredVoters[0]:", result[0] ? {
      voter_id: result[0].voter_id,
      relation_full_name: result[0].relation_full_name
    } : "No voters");
    return result;
  }, [pageVoters, searchTerm, filterGender, filterReligion]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const loadVoters = async (forceRefresh = false) => {
    if (isInitializing.current) {
      console.log("Load already in progress, skipping...");
      return;
    }

    isInitializing.current = true;
    setLoading(true);
    setError("");

    let dbInstance = db;
    try {
      if (!dbInstance) {
        dbInstance = await initDB();
        setDb(dbInstance);
        console.log("Database initialized:", dbInstance);
      }

      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
      const lastIngest = await getMetaValue(dbInstance, "voters_last_ingest_ts");
      const hasRecentCache = !forceRefresh && lastIngest && Date.now() - lastIngest < SIX_HOURS_MS;

      // Always check cache first
      const cachedCount = await getVotersCount(dbInstance);
      if (hasRecentCache && cachedCount > 0) {
        console.log("Using cached voters from IndexedDB, count:", cachedCount);
        const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
        console.log("Fetched first page from cache:", firstPage.length, "voters");
        console.log("Sample firstPage[0]:", firstPage[0] ? {
          voter_id: firstPage[0].voter_id,
          relation_full_name: firstPage[0].relation_full_name
        } : "No voters");
        setTotalCount(cachedCount);
        setPageVoters(firstPage);
        setCurrentPage(1);
        setLoading(false);
        isInitializing.current = false;
        return;
      }

      const userId = sessionStorage.getItem("user_id");
      if (!userId) {
        throw new Error("User not authenticated. Please log in.");
      }

      let voterData;
      try {
        console.log("Fetching new voter data from API");
        voterData = await getAllVoterS3Url(userId);
        console.log("API returned voter data:", voterData.length, "records");
      } catch (apiError) {
        // If API fails, fall back to cached data if available
        const fallbackCount = await getVotersCount(dbInstance);
        if (fallbackCount > 0) {
          console.warn("API call failed, falling back to cached data, count:", fallbackCount);
          const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
          console.log("Fetched first page from cache (API fallback):", firstPage.length, "voters");
          console.log("Sample firstPage[0]:", firstPage[0] ? {
            voter_id: firstPage[0].voter_id,
            relation_full_name: firstPage[0].relation_full_name
          } : "No voters");
          setTotalCount(fallbackCount);
          setPageVoters(firstPage);
          setCurrentPage(1);
          setError("Failed to sync new data, showing cached data instead.");
          setLoading(false);
          isInitializing.current = false;
          return;
        }
        throw apiError; // No cached data, rethrow the error
      }

      if (!voterData || voterData.length === 0) {
        // Check cache again before throwing an error
        const fallbackCount = await getVotersCount(dbInstance);
        if (fallbackCount > 0) {
          console.warn("No new voter data returned, falling back to cached data, count:", fallbackCount);
          const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
          console.log("Fetched first page from cache (no data):", firstPage.length, "voters");
          console.log("Sample firstPage[0]:", firstPage[0] ? {
            voter_id: firstPage[0].voter_id,
            relation_full_name: firstPage[0].relation_full_name
          } : "No voters");
          setTotalCount(fallbackCount);
          setPageVoters(firstPage);
          setCurrentPage(1);
          setError("No new voter data available, showing cached data instead.");
          setLoading(false);
          isInitializing.current = false;
          return;
        }
        throw new Error("No voter data available for your assembly. Please contact support.");
      }

      // Only clear the store after successfully fetching new data
      if (forceRefresh && cachedCount > 0) {
        console.log("Clearing voters store for forced refresh");
        await clearVotersStore(dbInstance);
      }

      console.log("Processing voter data with Web Worker, count:", voterData.length);
      const worker = new Worker(
        new URL("../../workers/voterWorker.js", import.meta.url)
      );

      // Promise to wait for worker completion
      const workerPromise = new Promise((resolve, reject) => {
        worker.onmessage = async (event) => {
          try {
            if (event.data.type === "STORE_BATCH") {
              console.log("Storing batch in IndexedDB, size:", event.data.data.length);
              console.log("Sample batch[0]:", event.data.data[0] ? {
                voter_id: event.data.data[0].voter_id,
                relation_full_name: event.data.data[0].relation_full_name
              } : "No voters");
              await addBatchToDB(dbInstance, event.data.data);
            }
            if (event.data.type === "DONE") {
              const count = await getVotersCount(dbInstance);
              console.log("Worker completed, total voters in DB:", count);
              const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
              console.log("Fetched first page after worker:", firstPage.length, "voters");
              console.log("Sample firstPage[0]:", firstPage[0] ? {
                voter_id: firstPage[0].voter_id,
                relation_full_name: firstPage[0].relation_full_name
              } : "No voters");
              setTotalCount(count);
              setPageVoters(firstPage);
              setCurrentPage(1);
              await setMetaValue(dbInstance, "voters_last_ingest_ts", Date.now());
              console.log(forceRefresh ? "Sync completed!" : "Bootstrap process completed!");
              resolve();
            }
          } catch (err) {
            console.error("Worker processing error:", err.message, err.stack);
            reject(err);
          }
        };
        worker.onerror = (err) => {
          console.error("Worker error:", err.message, err.stack);
          reject(err);
        };
      });

      worker.postMessage(voterData);

      // Wait for the worker to complete before proceeding
      try {
        await workerPromise;
      } catch (err) {
        // Handle worker errors
        const fallbackCount = await getVotersCount(dbInstance);
        if (fallbackCount > 0) {
          console.warn("Worker error, falling back to cached data, count:", fallbackCount);
          const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
          console.log("Fetched first page from cache (worker error):", firstPage.length, "voters");
          console.log("Sample firstPage[0]:", firstPage[0] ? {
            voter_id: firstPage[0].voter_id,
            relation_full_name: firstPage[0].relation_full_name
          } : "No voters");
          setTotalCount(fallbackCount);
          setPageVoters(firstPage);
          setCurrentPage(1);
          setError("Failed to process new data, showing cached data instead.");
        } else {
          setError(`Worker error: ${err.message}`);
        }
      } finally {
        worker.terminate();
      }
    } catch (error) {
      console.error("Error loading voter data:", error.message, error.stack);
      // Check for cached data as a last resort
      if (dbInstance) {
        const fallbackCount = await getVotersCount(dbInstance);
        if (fallbackCount > 0) {
          console.warn("Error occurred, falling back to cached data, count:", fallbackCount);
          const firstPage = await getVotersByPage(dbInstance, 1, itemsPerPage);
          console.log("Fetched first page from cache (error):", firstPage.length, "voters");
          console.log("Sample firstPage[0]:", firstPage[0] ? {
            voter_id: firstPage[0].voter_id,
            relation_full_name: firstPage[0].relation_full_name
          } : "No voters");
          setTotalCount(fallbackCount);
          setPageVoters(firstPage);
          setCurrentPage(1);
          setError("Failed to load new data, showing cached data instead.");
        } else {
          setError(
            error.message.includes("Access denied")
              ? "Access denied. This feature is only available for Assembly President and Ward President roles."
              : error.message.includes("User role not found")
              ? "User role not found. Please contact support."
              : error.message.includes("Invalid response format") ||
                error.message.includes("Failed to fetch voter data")
              ? "Failed to fetch voter data: Invalid server response."
              : error.message.includes("Missing 'stage' parameter")
              ? "Server configuration error. Please contact support."
              : error.message.includes("Failed to fetch voter data from S3")
              ? "Failed to retrieve voter data from server. Please try again or contact support."
              : error.message
          );
        }
      } else {
        setError("Failed to initialize database: " + error.message);
      }
      if (error.message.includes("User not authenticated")) {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    loadVoters(false);
  }, []);

  const openVoterModal = async (voter) => {
    setSelectedVoter(voter);
    setShowVoterModal(true);
    setVoterDetails(null);
    setLoadingDetails(true);

    try {
      const response = await getOtherVoterDetails(
        voter.voter_id || voter.epic_number
      );
      setVoterDetails(response);
    } catch (error) {
      console.error("Error fetching voter details:", error.message, error.stack);
      setVoterDetails(null);
      setError(error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeVoterModal = () => {
    setSelectedVoter(null);
    setShowVoterModal(false);
    setVoterDetails(null);
    setLoadingDetails(false);
  };

  const handlePageChange = async (page) => {
    if (!db) {
      console.warn("handlePageChange: Database not initialized");
      return;
    }
    try {
      const newPage = Math.max(1, Math.min(totalPages, page));
      const data = await getVotersByPage(db, newPage, itemsPerPage);
      console.log("Fetched page", newPage, "with", data.length, "voters");
      console.log("Sample data[0]:", data[0] ? {
        voter_id: data[0].voter_id,
        relation_full_name: data[0].relation_full_name
      } : "No voters");
      setPageVoters(data);
      setCurrentPage(newPage);
    } catch (error) {
      console.error("Error fetching page:", error.message, error.stack);
      setError("Failed to load page: " + error.message);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    if (!db) return;
    setCurrentPage(1);
    getVotersByPage(db, 1, itemsPerPage)
      .then((data) => {
        console.log("Fetched page 1 after filter change:", data.length, "voters");
        console.log("Sample data[0]:", data[0] ? {
          voter_id: data[0].voter_id,
          relation_full_name: data[0].relation_full_name
        } : "No voters");
        setPageVoters(data);
      })
      .catch((error) => {
        console.error("Error fetching page 1 after filter change:", error.message, error.stack);
        setError("Failed to load page: " + error.message);
      });
  }, [searchTerm, filterGender, filterReligion, db]);

  // Log state changes for debugging
  useEffect(() => {
    console.log("pageVoters updated:", pageVoters.length, "voters");
    console.log("Sample pageVoters[0]:", pageVoters[0] ? {
      voter_id: pageVoters[0].voter_id,
      relation_full_name: pageVoters[0].relation_full_name
    } : "No voters");
    console.log("filteredVoters:", filteredVoters.length, "voters");
    console.log("Sample filteredVoters[0]:", filteredVoters[0] ? {
      voter_id: filteredVoters[0].voter_id,
      relation_full_name: filteredVoters[0].relation_full_name
    } : "No voters");
    console.log("Filters:", { searchTerm, filterGender, filterReligion });
  }, [pageVoters, filteredVoters, searchTerm, filterGender, filterReligion]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  return (
    <div className="relative space-y-6 p-4">
      {loading && (
        <div className="sticky top-0 z-10">
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <LoadingSpinner size="small" color="blue" />
            <span className="text-blue-700 text-sm font-medium">
              Loading voter data…
            </span>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="material-icons-outlined text-red-600">error_outline</span>
          <span className="text-red-700 text-sm font-medium">{error}</span>
        </div>
      )}
      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <span className="material-icons-outlined text-blue-600">how_to_vote</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Total Voters</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {totalCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <span className="material-icons-outlined text-green-600">wc</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Genders</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{genders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <span className="material-icons-outlined text-purple-600">diversity_3</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Religions</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{religions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <span className="material-icons-outlined text-orange-600">filter_list</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">Filtered Results</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {filteredVoters.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-sky-100">
                    <span className="material-icons-outlined text-sky-600">sync</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Data Sync</p>
                    <p className="text-xs text-[var(--text-secondary)]">Refresh from source (6h cache)</p>
                  </div>
                </div>
                <button
                  onClick={() => loadVoters(true)}
                  disabled={loading}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-sky-600 text-white hover:bg-sky-700"
                  }`}
                >
                  {loading ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Search Voters
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 material-icons-outlined text-[var(--text-secondary)] text-lg pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Voter ID, EPIC Number, or Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 h-10"
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Supports partial matches for names and IDs
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Gender
                </label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="All">All Genders</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Religion
                </label>
                <select
                  value={filterReligion}
                  onChange={(e) => setFilterReligion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900"
                >
                  <option value="All">All Religions</option>
                  {religions.map((religion) => (
                    <option key={religion} value={religion}>
                      {religion}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Actions
                </label>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterGender("All");
                    setFilterReligion("All");
                  }}
                  className="w-full px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm hover:shadow-md"
                >
                  <span className="material-icons-outlined text-sm">clear_all</span>
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                Voter Details
              </h2>
              <div className="text-sm text-[var(--text-secondary)]">
                Showing {startIndex + 1}-{startIndex + filteredVoters.length} of{" "}
                {totalCount.toLocaleString()} voters
              </div>
            </div>
            <div className="overflow-x-auto">
              {console.log("Rendering table with filteredVoters:", filteredVoters.map(v => ({
                voter_id: v.voter_id,
                relation_full_name: v.relation_full_name
              })))}
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      EPIC Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Religion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Relation Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Relation Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      House Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVoters.length > 0 ? (
                    filteredVoters.map((voter) => (
                      <tr
                        key={voter.voter_id || voter.epic_number}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                          {voter.epic_number || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                          {(voter.voter_full_name || "").trim() ||
                            `${(voter.voter_first_middle_name || "").trim()} ${(
                              voter.voter_last_name || ""
                            ).trim()}`.trim()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {voter.gender || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {voter.age ?? "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {voter.religion || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {console.log("Rendering relation_full_name for voter", voter.voter_id, ":", voter.relation_full_name)}
                          {voter.relation_full_name !== undefined && voter.relation_full_name !== null
                            ? voter.relation_full_name
                            : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {voter.relation_type || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {voter.house_number || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          <button
                            onClick={() => openVoterModal(voter)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View More
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <span className="material-icons-outlined text-4xl text-gray-400 mb-2">
                            search_off
                          </span>
                          <p className="text-sm text-[var(--text-secondary)]">
                            No voters found for the current filters
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Try clearing filters or syncing data
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showVoterModal && selectedVoter && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div
                className="bg-[var(--bg-card)] rounded-xl shadow-lg border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10"
                style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)" }}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      Voter Details -{" "}
                      {selectedVoter.voter_full_name ||
                        `${selectedVoter.voter_first_middle_name || ""} ${
                          selectedVoter.voter_last_name || ""
                        }`.trim()}
                    </h2>
                    <button
                      onClick={closeVoterModal}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <span className="material-icons-outlined">close</span>
                    </button>
                  </div>
                  {loadingDetails ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="small" color="blue" />
                      <p className="text-[var(--text-secondary)] mt-2">
                        Loading additional details...
                      </p>
                    </div>
                  ) : voterDetails ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Date of Birth
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.dob || "—"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Assembly
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.assembly_name
                              ? `${voterDetails.assembly_name} (${voterDetails.assembly_id})`
                              : voterDetails.assembly_id || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Ward
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.ward_name
                              ? `${voterDetails.ward_name} (${voterDetails.ward_id})`
                              : voterDetails.ward_id || "—"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Booth
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.booth_name
                              ? `${voterDetails.booth_name} (${voterDetails.booth_id})`
                              : voterDetails.booth_id || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            Section Number
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.section_number || "—"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            District
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.district || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            State
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.state || "—"}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-sm font-medium text-[var(--text-secondary)]">
                            PIN Code
                          </label>
                          <p className="text-[var(--text-primary)] font-semibold">
                            {voterDetails.pin_code || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                          Address
                        </label>
                        <p className="text-[var(--text-primary)] font-semibold">
                          {[
                            voterDetails.address_line_1,
                            voterDetails.address_line_2,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[var(--text-secondary)]">
                        Unable to load additional details.
                      </p>
                    </div>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={closeVoterModal}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VoterDetailsPage;