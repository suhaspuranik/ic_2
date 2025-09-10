import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { iConnect_get_survey_details_web } from "../../apis/SurveyApis";

const ViewAllSurveysPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    boothType: "",
    dateFrom: "",
    dateTo: "",
    status: "",
  });
  const [userRole] = useState("Assembly Head");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoading(true);
        const party_worker_id = sessionStorage.getItem("party_worker_id") || "0";
        const data = await iConnect_get_survey_details_web({ party_worker_id });
        console.log("Raw surveys response:", JSON.stringify(data, null, 2));

        const normalized = (data || []).map((s, idx) => {
          const eligible = Number(s.eligible_worker_count ?? 0); // Use eligible_worker_count
          const responses = Number(s.submitted_count ?? 0); // Use submitted_count
          const createdDate = s.created_at || s.created_date || s.createdAt || s.createdOn || s.created || "";
          const deadline = s.deadline || s.due_date || s.expiry_date || "";
          const baseStatus = s.status || "Draft";
          const surveyData = {
            id: s.survey_id || s.id || s.ID || idx,
            name: s.title || s.name || s.survey_name || "Untitled",
            createdDate,
            targetBooth: s.target_booth || s.targetBooth || s.target || s.target_booth_type || "All",
            status: baseStatus,
            expiry: s.expiry || (isExpired(deadline) ? "Expired" : "Not Expired"),
            responses,
            eligible,
            deadline,
            raw: s,
          };
          console.log(`Normalized survey ${s.survey_id || idx}:`, surveyData);
          return surveyData;
        });

        console.log("Normalized surveys:", JSON.stringify(normalized, null, 2));
        normalized.sort((a, b) => {
          const da = a.createdDate ? Date.parse(a.createdDate) : 0;
          const db = b.createdDate ? Date.parse(b.createdDate) : 0;
          return db - da;
        });
        setSurveys(normalized);
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
        setSurveys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveys();
  }, []);

  const isExpired = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = Date.parse(deadline);
    if (Number.isNaN(deadlineDate)) return false;
    return deadlineDate < Date.now();
  };

  const getStatus = (survey) => {
    const status = survey.status || "Draft";
    const expiry = survey.expiry || (isExpired(survey.deadline) ? "Expired" : "Not Expired");
    console.log(
      `getStatus for survey ${survey.raw.survey_id}: status=${status}, expiry=${expiry}, deadline=${survey.deadline}`
    );
    return status;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      boothType: "",
      dateFrom: "",
      dateTo: "",
      status: "",
    });
  };

  const filteredSurveys = surveys.filter((survey) => {
    if (filters.search && !survey.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.boothType && survey.targetBooth !== filters.boothType && filters.boothType !== "All") {
      return false;
    }
    if (filters.dateFrom && new Date(survey.createdDate) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(survey.createdDate) > new Date(filters.dateTo)) {
      return false;
    }
    if (filters.status && survey.status !== filters.status) {
      return false;
    }
    return true;
  });

  const handleViewResults = (surveyId) => {
    console.log(`View results for survey ${surveyId}`);
    alert(`Viewing results for survey ${surveyId}`);
  };

  const handleDownload = (surveyId, type) => {
    console.log(`Download ${type} results for survey ${surveyId}`);
    alert(`Downloading ${type} results for survey ${surveyId}`);
  };

  const openSurvey = (survey) => {
    const raw = survey.raw || {};
    let questions = [];
    try {
      let parsed = raw.questions;
      if (typeof parsed === "string") parsed = JSON.parse(parsed || "[]");
      if (Array.isArray(parsed)) questions = parsed;
      else if (parsed && typeof parsed === "object") {
        questions = parsed.questions || parsed.question_list || parsed.items || parsed.data || [];
      }
      if (!Array.isArray(questions)) questions = [];
    } catch (e) {
      console.warn("Failed to parse survey questions", e);
      questions = [];
    }

    const normalizedQuestions = questions.map((q, idx) => {
      let opts = q.options;
      if (typeof opts === "string") {
        try { opts = JSON.parse(opts || "[]"); } catch { opts = []; }
      }
      if (!Array.isArray(opts)) opts = [];
      return {
        id: q.question_id || q.id || Date.now() + idx,
        text: q.question_text || q.text || "",
        type: (q.question_type || q.type || "radio").toLowerCase(),
        options: opts.map((op) => (typeof op === "string" ? op : (op.option_text || op.text || ""))),
      };
    });

    const surveyData = {
      id: survey.id || raw.survey_id || raw.id || raw.ID,
      name: survey.name || raw.title || raw.name || "",
      description: raw.description || "",
      questions: normalizedQuestions,
      createdDate: survey.createdDate || raw.created_at || raw.created_date || raw.createdAt || raw.createdOn || raw.created || "",
      deadline: survey.deadline || raw.deadline || raw.due_date || raw.expiry_date || "",
      targetBooth: survey.targetBooth || raw.target_booth || raw.targetBooth || raw.target || raw.target_booth_type || "All",
      status: survey.status || raw.status || "Draft",
      expiry: survey.expiry || (isExpired(raw.deadline) ? "Expired" : "Not Expired"),
      responses: survey.responses,
      eligible: survey.eligible,
    };

    const isDraft = (survey.status || "").toLowerCase() === "draft";
    if (isDraft) {
      navigate("/create-survey", { state: { surveyData } });
    } else {
      navigate("/survey-preview", { state: { surveyData, editable: false } });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const ts = Date.parse(dateStr);
    if (Number.isNaN(ts)) return dateStr;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="pt-0 px-8">
      <style>
        {`
          .grayscale { filter: grayscale(100%) !important; }
          .opacity-50 { opacity: 0.5 !important; }
          .expired-badge {
            margin-left: 8px;
            padding: 2px 8px;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 9999px;
          }
        `}
      </style>
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Search</label>
            <input
              id="search"
              name="search"
              type="text"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search surveys..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label htmlFor="boothType" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Booth Type</label>
            <select
              id="boothType"
              name="boothType"
              value={filters.boothType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All Booths</option>
              <option value="Strong">Strong</option>
              <option value="Weak">Weak</option>
              <option value="Swing">Swing</option>
            </select>
          </div>
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date From</label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date To</label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
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

      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Survey Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Target Booth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Responses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading surveys...</td>
                </tr>
              ) : filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <tr
                    key={survey.id}
                    onClick={() => openSurvey(survey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openSurvey(survey);
                    }}
                    tabIndex={0}
                    role="button"
                    className={`hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      survey.expiry.toLowerCase() === "expired" ? "opacity-50 grayscale" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                      <div className="flex items-center">
                        {survey.name}
                        {survey.expiry.toLowerCase() === "expired" && (
                          <span className="expired-badge bg-red-100 text-red-800">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {formatDate(survey.createdDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {survey.targetBooth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          survey.status.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : survey.status.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                      {`${survey.responses}/${survey.eligible}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <a
                          href={`/survey-results/${survey.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Results
                        </a>
                        {userRole === "Assembly Head" && (
                          <div className="relative group">
                            <button className="text-green-600 hover:text-green-900">Download</button>
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                              <button
                                onClick={() => handleDownload(survey.id, "overall")}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Overall Results
                              </button>
                              <button
                                onClick={() => handleDownload(survey.id, "booth-wise")}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                Booth-wise Results
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No surveys found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewAllSurveysPage;