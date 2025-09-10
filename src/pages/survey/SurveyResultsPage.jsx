import { useState } from "react";

const SurveyResultsPage = () => {
  // In a real application, you would fetch this data based on the survey ID from URL params
  const [surveyData] = useState({
    id: 1,
    name: "Voter Satisfaction Survey",
    createdDate: "2023-06-15",
    targetBooth: "All",
    status: "Completed",
    totalResponses: 245,
    questions: [
      {
        id: 1,
        text: "How satisfied are you with the current infrastructure in your area?",
        type: "radio",
        options: [
          "Very Satisfied",
          "Satisfied",
          "Neutral",
          "Dissatisfied",
          "Very Dissatisfied",
        ],
      },
      {
        id: 2,
        text: "Which of the following issues need immediate attention?",
        type: "checkbox",
        options: [
          "Roads",
          "Water Supply",
          "Electricity",
          "Sanitation",
          "Public Transport",
          "Healthcare",
        ],
      },
      {
        id: 3,
        text: "How likely are you to vote in the upcoming elections?",
        type: "radio",
        options: [
          "Very Likely",
          "Likely",
          "Undecided",
          "Unlikely",
          "Very Unlikely",
        ],
      },
    ],
  });

  // Sample booth-wise response data
  const [boothData] = useState([
    {
      boothId: 1,
      boothName: "Booth 101 - Central",
      responses: 78,
      type: "Strong",
    },
    { boothId: 2, boothName: "Booth 102 - North", responses: 45, type: "Weak" },
    {
      boothId: 3,
      boothName: "Booth 103 - South",
      responses: 62,
      type: "Strong",
    },
    { boothId: 4, boothName: "Booth 104 - East", responses: 35, type: "Swing" },
    { boothId: 5, boothName: "Booth 105 - West", responses: 25, type: "Weak" },
  ]);

  // Sample response data for each question
  const [questionResponses] = useState({
    1: {
      "Very Satisfied": 45,
      Satisfied: 98,
      Neutral: 56,
      Dissatisfied: 32,
      "Very Dissatisfied": 14,
    },
    2: {
      Roads: 156,
      "Water Supply": 178,
      Electricity: 89,
      Sanitation: 134,
      "Public Transport": 112,
      Healthcare: 98,
    },
    3: {
      "Very Likely": 132,
      Likely: 67,
      Undecided: 28,
      Unlikely: 12,
      "Very Unlikely": 6,
    },
  });

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
    const maxValue = Math.max(...Object.values(data));
    const colors = generateColors(labels.length);

    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="space-y-2">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center">
              <div className="w-1/4 text-sm truncate pr-2">{label}</div>
              <div className="w-3/4 flex items-center">
                <div
                  className="h-6 rounded"
                  style={{
                    width: `${(data[label] / maxValue) * 100}%`,
                    backgroundColor: colors[index],
                  }}
                ></div>
                <span className="ml-2 text-sm">{data[label]}</span>
              </div>
            </div>
          ))}
        </div>
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

        {surveyData.questions.map((question) => (
          <div
            key={question.id}
            className="mb-8 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
          >
            <h3 className="text-lg font-medium mb-2 text-[var(--text-primary)]">
              {question.text}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart */}
              <div>
                {question.type === "radio" ? (
                  <SimplePieChart
                    data={questionResponses[question.id] || {}}
                    title="Response Distribution"
                  />
                ) : (
                  <SimpleBarChart
                    data={questionResponses[question.id] || {}}
                    labels={question.options}
                    title="Selected Options"
                  />
                )}
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
                    {question.options.map((option) => {
                      const counts = questionResponses[question.id] || {};
                      const count = counts[option] || 0;
                      const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
                      const percentage = Math.round((count / total) * 100);

                      return (
                        <tr key={option}>
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
