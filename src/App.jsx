import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";

// Layout Components
import Sidebar from "./components/common/Sidebar";
import Header from "./components/common/Header";

// Auth Page
import LoginPage from "./pages/auth/LoginPage";

// Dashboard
import DashboardPage from "./pages/dashboard/DashboardPage";

// Survey Module
import SurveyDashboardPage from "./pages/survey/SurveyDashboardPage";
import CreateSurveyPage from "./pages/survey/CreateSurveyPage";
import SurveyPreviewPage from "./pages/survey/SurveyPreviewPage";
import ViewAllSurveysPage from "./pages/survey/ViewAllSurveysPage";
import SurveyResultsPage from "./pages/survey/SurveyResultsPage";

// Reports Module
import ReportsDashboardPage from "./pages/reports/ReportsDashboardPage";
import IssuesPage from "./pages/issues/issuesPage";

// Booth Worker Module
import BoothWorkersPage from "./pages/booth/BoothWorkersPage";
import AddEditBoothWorkerPage from "./pages/booth/AddEditBoothWorkerPage";
import ReassignBoothPage from "./pages/booth/ReassignBoothPage";

// Voter Module
import VoterDetailsPage from "./pages/voter/VoterDetailsPage";

// Layout wrapper component to manage layout conditionally

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard: require session id for all routes except /login
  useEffect(() => {
    setAuthChecked(false);
    const party_worker_id = sessionStorage.getItem("party_worker_id");
    if (!party_worker_id && !isLoginPage) {
      sessionStorage.clear();
      window.location.replace("/login");
    }
    // Simulate async check (in real app, could be async)
    setTimeout(() => setAuthChecked(true), 0);
  }, [location.pathname, isLoginPage]);

  // Once authenticated, prevent navigating back to login
  useEffect(() => {
    const party_worker_id = sessionStorage.getItem("party_worker_id");
    if (party_worker_id && isLoginPage) {
      window.location.replace("/dashboard");
    }
  }, [location.pathname, isLoginPage]);

  // When unauthenticated and on login, ensure back/forward keeps user at login
  useEffect(() => {
    const party_worker_id = sessionStorage.getItem("party_worker_id");
    if (!party_worker_id && isLoginPage) {
      const lockToLogin = () => {
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        } else {
          window.history.pushState(null, "", "/login");
        }
      };
      window.history.pushState(null, "", "/login");
      window.addEventListener("popstate", lockToLogin);
      return () => window.removeEventListener("popstate", lockToLogin);
    }
  }, [location.pathname, isLoginPage]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return "Welcome Back to your Dashboard";
      case "/survey-dashboard":
        return "Survey Dashboard";
      case "/booth-workers":
        return "Booth Workers";
      case "/voter-details":
        return "Voter Details";
      case "/reports":
        return "Reports Dashboard";
      case "/issues":
        return "Issues";
      case "/predictive-analysis":
        return "Predictive Analysis";
      case "/historical-votes":
        return "Historical Votes";
      case "/create-survey":
        return "Create New Survey";
      case "/survey-preview":
        return "Survey Preview";
      case "/view-surveys":
        return "All Surveys";
      case "/add-booth-worker":
        return "Add Booth Worker";
      case "/reassign-booth":
        return "Reassign Booth";
      default:
        if (path.includes("/edit-booth-worker")) {
          return "Edit Booth Worker";
        } else if (path.includes("/survey-results")) {
          // For survey results, we could extract survey name from URL params or use generic title
          return "Survey Results";
        }
        return "Dashboard";
    }
  };

  // Get action buttons based on current route
  const getActionButtons = () => {
    const path = location.pathname;
    if (path === "/survey-dashboard") {
      return (
        <div className="flex space-x-3">
          <a
            href="/view-surveys"
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="material-icons-outlined mr-2 text-base">
              visibility
            </span>
            View All Surveys
          </a>
          <a
            href="/create-survey"
            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="material-icons-outlined mr-2 text-base">add</span>
            Create New Survey
          </a>
        </div>
      );
    }
    if (path === "/view-surveys") {
      return (
        <a
          href="/create-survey"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-icons-outlined mr-2 text-base">add</span>
          Create New Survey
        </a>
      );
    }
    if (path === "/create-survey") {
      return (
        <button
          onClick={() => (window.location.href = "/survey-dashboard")}
          className="flex items-center px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
        >
          <span className="material-icons-outlined mr-2 text-lg">close</span>
          Cancel
        </button>
      );
    }
    if (path === "/survey-preview") {
      return (
        <button
          onClick={() => (window.location.href = "/survey-dashboard")}
          className="flex items-center px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
        >
          <span className="material-icons-outlined mr-2 text-lg">close</span>
          Back to Dashboard
        </button>
      );
    }
    if (path === "/booth-workers") {
      return (
        <a
          href="/add-booth-worker"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <span className="material-icons-outlined mr-2 text-base">
            person_add
          </span>
          Add New Worker
        </a>
      );
    }
    if (location.pathname.includes("/survey-results")) {
      return (
        <a
          href="/view-surveys"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-icons-outlined mr-2 text-base">
            visibility
          </span>
          View All Surveys
        </a>
      );
    }
    if (path === "/reassign-booth") {
      return (
        <a
          href="/booth-workers"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span className="material-icons-outlined mr-2 text-base">
            arrow_back
          </span>
          Back to Booth Workers
        </a>
      );
    }
    return null;
  };

  // User information from session storage
  const [userInfo, setUserInfo] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    const email = sessionStorage.getItem("email_id") || "";
    const role = sessionStorage.getItem("role_name") || "";
    setUserInfo({ name: "", email, role });
  }, [location.pathname]);

  if (!authChecked) {
    // Prevent flash of protected content
    return null;
  }
  if (isLoginPage) {
    return children;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        <Header
          title={getPageTitle()}
          userName={userInfo.name}
          userEmail={userInfo.email}
          userRole={userInfo.role}
          showUserInfo={location.pathname === "/dashboard"}
          actionButtons={getActionButtons()}
        />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Survey Module Routes */}
          <Route path="/survey-dashboard" element={<SurveyDashboardPage />} />
          <Route path="/create-survey" element={<CreateSurveyPage />} />
          <Route path="/survey-preview" element={<SurveyPreviewPage />} />
          <Route path="/view-surveys" element={<ViewAllSurveysPage />} />
          <Route path="/survey-results/:id" element={<SurveyResultsPage />} />

          {/* Reports Module */}
          <Route path="/reports" element={<ReportsDashboardPage />} />

          {/* Issues Module */}
          <Route path="/issues" element={<IssuesPage />} />

          {/* Booth Worker Module */}
          <Route path="/booth-workers" element={<BoothWorkersPage />} />
          <Route
            path="/add-booth-worker"
            element={<AddEditBoothWorkerPage />}
          />
          <Route
            path="/edit-booth-worker/:id"
            element={<AddEditBoothWorkerPage />}
          />
          <Route path="/reassign-booth" element={<ReassignBoothPage />} />

          {/* Voter Module */}
          <Route path="/voter-details" element={<VoterDetailsPage />} />

          {/* Default route redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
