import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { iConnect_get_survey_details_web } from "../../apis/SurveyApis";

const SurveyDashboardPage = () => {
  const [recentSurveys, setRecentSurveys] = useState([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        setLoadingSurveys(true);
        const party_worker_id = sessionStorage.getItem("party_worker_id") || "0";
        const surveys = await iConnect_get_survey_details_web({ party_worker_id });
        console.log("Raw surveys response:", JSON.stringify(surveys, null, 2));

        const surveyArray = Array.isArray(surveys) ? surveys : [];
        console.log("Survey array length:", surveyArray.length);

        const normalized = surveyArray.map((s, index) => {
          const eligible = Number(s.eligible_worker_count ?? 0);
          const responses = Number(s.submitted_count ?? 0);
          const surveyData = {
            name: s.title || s.name || s.survey_name || "Untitled",
            createdDate: s.created_at || s.created_date || s.createdAt || s.createdOn || s.created || "",
            deadline: s.deadline || s.due_date || s.expiry_date || "",
            targetBooth: s.target_booth || s.targetBooth || s.target || s.target_booth_type || "All",
            status: s.status || "Draft",
            expiry: s.expiry || (isExpired(s.deadline) ? "Expired" : "Not Expired"),
            responses,
            eligible,
            raw: s,
          };
          console.log(`Normalized survey ${s.survey_id || index}:`, surveyData);
          return surveyData;
        });

        console.log("Normalized surveys:", JSON.stringify(normalized, null, 2));
        normalized.sort((a, b) => {
          const da = a.createdDate ? Date.parse(a.createdDate) : 0;
          const db = b.createdDate ? Date.parse(b.createdDate) : 0;
          return db - da;
        });

        setRecentSurveys(normalized);
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
        setRecentSurveys([]);
      } finally {
        setLoadingSurveys(false);
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

  const navigate = useNavigate();

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
      id: raw.survey_id || raw.id || raw.ID,
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

  const getStatus = (survey) => {
    const status = survey.status || "Draft";
    const expiry = survey.expiry || (isExpired(survey.deadline) ? "Expired" : "Not Expired");
    console.log(
      `getStatus for survey ${survey.raw.survey_id}: status=${status}, expiry=${expiry}, deadline=${survey.deadline}`
    );
    return status;
  };

  const totalSurveys = recentSurveys.length;
  const completedSurveys = recentSurveys.filter((s) => (s.status || "").toLowerCase() === "completed").length;
  const pendingSurveys = totalSurveys - completedSurveys;
  const participationRate = totalSurveys > 0 ? Math.round((recentSurveys.filter((s) => Number(s.responses) > 0).length / totalSurveys) * 100) : 0;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <span className="material-icons-outlined text-blue-600 text-3xl">assignment</span>
            </div>
            <div className="ml-4">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{totalSurveys}</p>
              <p className="text-[var(--text-secondary)]">Total Surveys</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="bg-green-100 p-4 rounded-full">
              <span className="material-icons-outlined text-green-600 text-3xl">check_circle</span>
            </div>
            <div className="ml-4">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{completedSurveys}</p>
              <p className="text-[var(--text-secondary)]">Completed Surveys</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center">
            <div className="bg-orange-100 p-4 rounded-full">
              <span className="material-icons-outlined text-orange-600 text-3xl">pending</span>
            </div>
            <div className="ml-4">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{pendingSurveys}</p>
              <p className="text-[var(--text-secondary)]">Pending Surveys</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-card)] p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-purple-100 p-4 rounded-full">
                <span className="material-icons-outlined text-purple-600 text-3xl">pie_chart</span>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-[var(--text-primary)]">{participationRate}%</p>
                <p className="text-[var(--text-secondary)]">Participation Rate</p>
              </div>
            </div>
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                  strokeDasharray={`${participationRate}, 100`}
                  className="stroke-purple-500"
                />
                <text
                  x="18"
                  y="20.35"
                  className="text-xs font-medium text-center fill-purple-600"
                  textAnchor="middle"
                >
                  {participationRate}%
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Recent Surveys</h2>
        <div className="overflow-x-auto">
          <table key={recentSurveys.length} className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Booth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingSurveys ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">Loading surveys...</td>
                </tr>
              ) : recentSurveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">No surveys found.</td>
                </tr>
              ) : (
                recentSurveys.map((survey, index) => (
                  <tr
                    key={survey.raw.survey_id || index}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--text-primary)] flex items-center">
                        {survey.name}
                        {survey.expiry.toLowerCase() === "expired" && (
                          <span className="expired-badge bg-red-100 text-red-800">Expired</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">{formatDate(survey.createdDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">{formatDate(survey.deadline)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--text-secondary)]">{survey.targetBooth}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getStatus(survey).toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800"
                            : getStatus(survey).toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStatus(survey)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {`${survey.responses}/${survey.eligible}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {recentSurveys.length > 10 && (
          <div className="mt-4 text-right">
            <a href="/view-surveys" className="text-blue-600 hover:text-blue-800 text-sm">View All</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyDashboardPage;