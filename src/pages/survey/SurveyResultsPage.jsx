import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { iConnect_get_survey_details_web } from "../../apis/SurveyApis";

const SurveyResultsPage = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [surveyData, setSurveyData] = useState({
    id: null,
    name: "",
    createdDate: "",
    targetBooth: "",
    status: "",
    totalResponses: 0,
    questions: [],
  });

  const [boothData, setBoothData] = useState([]);
  const [questionResponses, setQuestionResponses] = useState({});

  const safeParse = (maybeJson) => {
    if (maybeJson == null) return null;
    if (typeof maybeJson !== "string") return maybeJson;
    try {
      return JSON.parse(maybeJson);
    } catch (_e) {
      return null;
    }
  };

  const selectedSurveyId = useMemo(() => {
    const numeric = Number(id);
    return Number.isFinite(numeric) ? numeric : id;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const surveys = await iConnect_get_survey_details_web();
        const survey = Array.isArray(surveys)
          ? surveys.find((s) => String(s.survey_id) === String(selectedSurveyId)) || surveys[0]
          : null;

        if (!survey) {
          throw new Error("Survey not found");
        }

        const parsedQuestions = safeParse(survey.questions) || [];
        const parsedResponses = safeParse(survey.responses) || [];
        const parsedWardsBooths = safeParse(survey.wards_booths) || [];

        // Build questions model expected by UI
        const questions = parsedQuestions.map((q, idx) => ({
          id: q.question_id ?? q.id ?? idx + 1,
          text: q.question_text ?? q.text ?? "",
          type: q.question_type ?? q.type ?? "radio",
          options: Array.isArray(q.options) ? q.options : [],
        }));

        // Aggregate option counts per question from responses
        const countsByQuestion = {};
        const validResponses = (Array.isArray(parsedResponses) ? parsedResponses : []).filter(
          (r) => r && (r.response_id != null || r.submitted_at)
        );

        for (const resp of validResponses) {
          const answers = Array.isArray(resp.answers) ? resp.answers : [];
          for (const ans of answers) {
            const qid = ans.question_id;
            const answerValue = ans.answer;
            if (qid == null || answerValue == null) continue;
            if (!countsByQuestion[qid]) countsByQuestion[qid] = {};
            countsByQuestion[qid][answerValue] = (countsByQuestion[qid][answerValue] || 0) + 1;
          }
        }

        // Booth-wise data is not fully derivable from API without booth names; skip if unavailable
        const boothItems = [];
        if (Array.isArray(parsedWardsBooths) && parsedWardsBooths.length > 0) {
          for (const wb of parsedWardsBooths) {
            const boothIds = Array.isArray(wb.booth_ids) ? wb.booth_ids : [];
            for (const bid of boothIds) {
              boothItems.push({
                boothId: bid,
                boothName: `Booth #${bid}`,
                responses: 0,
                type: survey.target_booth_type || "",
              });
            }
          }
        }

        if (cancelled) return;

        setSurveyData({
          id: survey.survey_id ?? null,
          name: survey.title || "",
          createdDate: survey.created_at ? new Date(survey.created_at).toISOString().slice(0, 10) : "",
          targetBooth: survey.target_booth_type || (survey.target_booth_type === null ? "All" : ""),
          status: survey.status || "",
          totalResponses: Number(survey.submitted_count || validResponses.length || 0),
          questions,
        });
        setQuestionResponses(countsByQuestion);
        setBoothData(boothItems);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load survey results");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedSurveyId]);

  // Generate random colors for chart segments
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137) % 360; // Use golden ratio to spread colors
      colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
  };

  // Create simple bar chart using div elements
  const SimpleBarChart = ({ data, labels, title }) => {
    const values = labels.map((l) => Number(data[l] || 0));
    const maxValue = values.length > 0 ? Math.max(...values) : 0;
    const colors = generateColors(labels.length);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {labels.length === 0 || maxValue <= 0 ? (
          <div className="text-sm text-[var(--text-secondary)]">No data available.</div>
        ) : (
          <div className="space-y-2">
            {labels.map((label, index) => (
              <div key={`${label}-${index}`} className="flex items-center">
                <div className="w-1/4 text-sm truncate pr-2">{label}</div>
                <div className="w-3/4 flex items-center">
                  <div
                    className="h-6 rounded"
                    style={{
                      width: `${(Number(data[label] || 0) / maxValue) * 100}%`,
                      backgroundColor: colors[index],
                    }}
                  ></div>
                  <span className="ml-2 text-sm">{Number(data[label] || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Create simple pie chart representation using div elements
  const SimplePieChart = ({ data, title }) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = generateColors(labels.length);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-40 h-40">
            {/* This is a simplified representation - in a real app, use a proper chart library */}
            <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium">Total: {total}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center">
              <div
                className="w-4 h-4 rounded-sm mr-2"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <div className="text-sm">
                {label}: {values[index]} (
                {Math.round((values[index] / total) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      {loading && (
        <div className="mb-6 text-sm text-[var(--text-secondary)]">Loading survey results…</div>
      )}
      {!!error && (
        <div className="mb-6 text-sm text-red-600">{error}</div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-[var(--text-secondary)]">
          <div className="flex flex-col items-start">
            <span className="mb-1">Created: {surveyData.createdDate}</span>
            <span className="mb-1">Target: {surveyData.targetBooth}</span>
            <span>Total Responses: {surveyData.totalResponses}</span>
          </div>
        </div>
      </div>

      {/* Booth-wise Participation */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Booth-wise Participation
        </h2>

        {/* Bar Chart */}
        <div className="mb-6">
          <SimpleBarChart
            data={boothData.reduce((acc, booth) => {
              acc[booth.boothName] = booth.responses;
              return acc;
            }, {})}
            labels={boothData.map((booth) => booth.boothName)}
            title="Response Count by Booth"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Booth Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Booth Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Participation %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boothData.map((booth) => (
                <tr key={booth.boothId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                    {booth.boothName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booth.type === "Strong"
                          ? "bg-green-100 text-green-800"
                          : booth.type === "Weak"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {booth.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {booth.responses}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                    {surveyData.totalResponses > 0
                      ? Math.round((booth.responses / surveyData.totalResponses) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question-wise Results */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Question-wise Results
        </h2>

        {surveyData.questions.length === 0 && !loading && !error && (
          <div className="text-sm text-[var(--text-secondary)]">No questions available.</div>
        )}
        {surveyData.questions.map((question, qIndex) => (
          <div
            key={question.id ?? qIndex}
            className="mb-8 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
          >
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              {question.text}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                {(() => {
                  const counts = questionResponses[question.id] || {};
                  const labels = Array.isArray(question.options) ? question.options : Object.keys(counts);
                  const dataMap = labels.reduce((acc, opt) => {
                    acc[opt] = Number(counts[opt] || 0);
                    return acc;
                  }, {});
                  return (
                    <SimpleBarChart
                      data={dataMap}
                      labels={labels}
                      title="Response Distribution"
                    />
                  );
                })()}
              </div>

              {/* Table */}
              <div>
                <h4 className="text-md font-medium mb-2">Response Summary</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Option
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(Array.isArray(question.options) ? question.options : Object.keys(questionResponses[question.id] || {})).map((option, optIndex) => {
                      const counts = questionResponses[question.id] || {};
                      const count = counts[option] || 0;
                      const total = Object.values(counts).reduce((sum, val) => sum + Number(val || 0), 0);
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <tr key={`${option}-${optIndex}`}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-[var(--text-primary)]">
                            {option}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                            {count}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                            {percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurveyResultsPage;
