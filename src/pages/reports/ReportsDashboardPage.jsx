import { useState } from "react";

const ReportsDashboardPage = () => {
  // Form state
  const [reportForm, setReportForm] = useState({
    reportType: "",
    dateFrom: "",
    dateTo: "",
    boothFilter: "",
  });

  // Report data state
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sample data for demonstration
  const samplePerformanceData = [
    {
      id: 1,
      name: "Rahul Sharma",
      tasksCompleted: 85,
      scorePoints: 92,
      booth: "Booth 101 - Central",
    },
    {
      id: 2,
      name: "Priya Patel",
      tasksCompleted: 78,
      scorePoints: 84,
      booth: "Booth 102 - North",
    },
    {
      id: 3,
      name: "Amit Kumar",
      tasksCompleted: 92,
      scorePoints: 95,
      booth: "Booth 103 - South",
    },
    {
      id: 4,
      name: "Neha Singh",
      tasksCompleted: 65,
      scorePoints: 72,
      booth: "Booth 104 - East",
    },
    {
      id: 5,
      name: "Vikram Malhotra",
      tasksCompleted: 88,
      scorePoints: 90,
      booth: "Booth 105 - West",
    },
    {
      id: 6,
      name: "Sunita Gupta",
      tasksCompleted: 72,
      scorePoints: 78,
      booth: "Booth 101 - Central",
    },
    {
      id: 7,
      name: "Rajesh Verma",
      tasksCompleted: 95,
      scorePoints: 98,
      booth: "Booth 102 - North",
    },
    {
      id: 8,
      name: "Ananya Desai",
      tasksCompleted: 82,
      scorePoints: 86,
      booth: "Booth 103 - South",
    },
  ];

  const sampleBoothData = [
    {
      id: 1,
      name: "Booth 101 - Central",
      tasks: 120,
      completionPercentage: 88,
      type: "Strong",
    },
    {
      id: 2,
      name: "Booth 102 - North",
      tasks: 95,
      completionPercentage: 76,
      type: "Weak",
    },
    {
      id: 3,
      name: "Booth 103 - South",
      tasks: 110,
      completionPercentage: 92,
      type: "Strong",
    },
    {
      id: 4,
      name: "Booth 104 - East",
      tasks: 85,
      completionPercentage: 68,
      type: "Swing",
    },
    {
      id: 5,
      name: "Booth 105 - West",
      tasks: 75,
      completionPercentage: 82,
      type: "Weak",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReportForm({
      ...reportForm,
      [name]: value,
    });
  };

  const generateReport = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (reportForm.reportType === "performance") {
        setReportData({
          type: "performance",
          data: samplePerformanceData.filter((worker) => {
            if (reportForm.boothFilter && reportForm.boothFilter !== "All") {
              // In a real app, you would filter by booth type
              return worker.booth.includes(
                reportForm.boothFilter.split(" ")[1]
              );
            }
            return true;
          }),
        });
      } else if (reportForm.reportType === "booth") {
        setReportData({
          type: "booth",
          data: sampleBoothData.filter((booth) => {
            if (reportForm.boothFilter && reportForm.boothFilter !== "All") {
              // In a real app, you would filter by booth type
              const filterType = reportForm.boothFilter.split(" ")[0];
              return booth.type === filterType;
            }
            return true;
          }),
        });
      }
      setLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setReportForm({
      reportType: "",
      dateFrom: "",
      dateTo: "",
      boothFilter: "",
    });
    setReportData(null);
  };

  const downloadReport = (format) => {
    // In a real app, this would trigger a download
    alert(`Downloading report in ${format} format`);
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data, valueKey, labelKey, maxValue }) => {
    return (
      <div className="space-y-4 mt-4">
        {data.map((item) => (
          <div key={item.id} className="flex flex-col">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {item[labelKey]}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {item[valueKey]}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="pt-0 px-8">
      {/* Report Generation Form */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Generate Report
        </h2>
        <form onSubmit={generateReport}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label
                htmlFor="reportType"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Report Type
              </label>
              <select
                id="reportType"
                name="reportType"
                value={reportForm.reportType}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="">Select Report Type</option>
                <option value="performance">Performance Metrics</option>
                <option value="booth">Booth Completion Summary</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="dateFrom"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Date From
              </label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                value={reportForm.dateFrom}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="dateTo"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Date To
              </label>
              <input
                type="date"
                id="dateTo"
                name="dateTo"
                value={reportForm.dateTo}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="boothFilter"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Booth Filter
              </label>
              <select
                id="boothFilter"
                name="boothFilter"
                value={reportForm.boothFilter}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="">All Booths</option>
                <option value="Strong Booths">Strong Booths</option>
                <option value="Weak Booths">Weak Booths</option>
                <option value="Swing Booths">Swing Booths</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </form>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {reportData.type === "performance"
                ? "Performance Metrics Report"
                : "Booth Completion Summary"}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadReport("pdf")}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => downloadReport("excel")}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Download Excel
              </button>
            </div>
          </div>

          {reportData.type === "performance" ? (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">
                  Worker Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reportData.data.map((worker) => (
                    <div
                      key={worker.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-[var(--text-primary)]">
                          {worker.name}
                        </h4>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {worker.booth}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                              Tasks Completed
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">
                              {worker.tasksCompleted}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${worker.tasksCompleted}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                              Score Points
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">
                              {worker.scorePoints}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-green-600 h-2.5 rounded-full"
                              style={{ width: `${worker.scorePoints}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-[var(--text-primary)]">
                  Booth-wise Completion
                </h3>

                {/* Bar Chart */}
                <div className="mb-6">
                  <SimpleBarChart
                    data={reportData.data}
                    valueKey="completionPercentage"
                    labelKey="name"
                    maxValue={100}
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
                          Tasks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                          Completion %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.data.map((booth) => (
                        <tr key={booth.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                            {booth.name}
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
                            {booth.tasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                            {booth.completionPercentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboardPage;
