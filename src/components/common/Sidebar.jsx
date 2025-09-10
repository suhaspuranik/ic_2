import logoSvg from "../../assets/images/logo.svg";
import { useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <aside
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-[var(--bg-sidebar)] shadow-lg flex flex-col transition-all duration-300 ease-in-out h-full`}
    >
      <div className="h-20 flex items-center px-4 relative">
        <div
          className={`flex items-center ${
            !sidebarOpen && "justify-center w-full"
          }`}
        >
          <img src={logoSvg} alt="i-Connect Logo" className="h-8 w-8" />
          {sidebarOpen && (
            <span className="ml-2 text-xl font-bold text-[var(--text-primary)]">
              i-Connect
            </span>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors z-10 absolute ${
            sidebarOpen ? "right-2" : "-right-3"
          } w-6 h-6 rounded-full bg-transparent`}
        >
          <span className="material-icons-outlined">
            {sidebarOpen ? "chevron_left" : "chevron_right"}
          </span>
        </button>
      </div>

      <nav className={`flex-1 ${sidebarOpen ? "px-4" : "px-2"} py-4`}>
        <ul>
          {[
            {
              href: "/dashboard",
              icon: "dashboard",
              label: "Dashboard",
            },
            {
              href: "/booth-workers",
              icon: "groups",
              label: "Booth Workers",
            },
            {
              href: "/voter-details",
              icon: "how_to_vote",
              label: "Voter Details",
            },
            {
              href: "/survey-dashboard",
              icon: "ballot",
              label: "Survey Management",
            },
            {
              href: "/predictive-analysis",
              icon: "insights",
              label: "Predictive Analysis",
            },
            {
              href: "/historical-votes",
              icon: "history",
              label: "Historical Votes",
            },
            {
              href: "/reports",
              icon: "summarize",
              label: "Reports",
            },
            {
              href: "/issues",
              icon: "report_problem",
              label: "Issues",
            },
          ].map(({ href, icon, label }, i) => (
            <li key={i} className="mb-2">
              <a
                className={`flex items-center p-3 ${
                  // Highlight logic for each sidebar item
                  (href === "/survey-dashboard" &&
                    (currentPath === "/survey-dashboard" ||
                      currentPath === "/view-surveys" ||
                      currentPath === "/create-survey" ||
                      currentPath.includes("/survey-results"))) ||
                  (href === "/booth-workers" &&
                    (currentPath === "/booth-workers" ||
                      currentPath === "/add-booth-worker" ||
                      currentPath.includes("/edit-booth-worker"))) ||
                  (href === "/voter-details" &&
                    currentPath === "/voter-details") ||
                  (href === "/reports" && currentPath === "/reports") ||
                  currentPath === href
                    ? "text-[var(--text-active)] bg-[var(--bg-active)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                } rounded-lg ${
                  !sidebarOpen && "justify-center"
                } group relative`}
                href={href}
              >
                <span className="material-icons-outlined">{icon}</span>
                {sidebarOpen ? (
                  <span className="ml-4">{label}</span>
                ) : (
                  <span className="absolute left-full ml-2 p-2 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
                    {label}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`p-4 ${sidebarOpen ? "px-4" : "px-2"}`}>
        <button
          onClick={() => {
            try {
              sessionStorage.clear();
            } catch (e) {}
            // Replace history so back button won't land on protected route
            window.location.replace("/login");
            // After navigation, attempt to seed history at login (best effort)
            setTimeout(() => {
              try {
                window.history.pushState(null, "", "/login");
              } catch (e) {}
            }, 50);
          }}
          className={`flex items-center p-3 w-full text-red-500 hover:bg-red-50 rounded-lg ${
            !sidebarOpen && "justify-center"
          } group relative`}
        >
          <span className="material-icons-outlined">logout</span>
          {sidebarOpen ? (
            <span className="ml-4">Sign Out</span>
          ) : (
            <span className="absolute left-full ml-2 p-2 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
