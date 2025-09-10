const Header = ({
  title = "Welcome Back",
  userName,
  userEmail,
  userRole,
  showUserInfo = false,
  actionButtons = null,
}) => {
  // Pull from sessionStorage if not provided by parent
  const email = userEmail || sessionStorage.getItem("email_id") || "";
  const role = userRole || sessionStorage.getItem("role_name") || "";

  // Role-based icon mapping
  const roleIcon = () => {
    const r = (role || "").toLowerCase();
    if (r.includes("admin")) return "admin_panel_settings";
    if (r.includes("assembly")) return "account_balance";
    if (r.includes("ward")) return "how_to_reg";
    return "account_circle";
  };

  return (
    <header className="h-20 bg-[var(--bg-header)] shadow-sm border-b border-slate-200 flex items-center justify-between px-10 w-full">
      <h1 className="text-xl font-semibold text-[var(--text-primary)]">
        {title}
      </h1>

      <div className="flex items-center space-x-3">
        {actionButtons && <div className="flex space-x-3">{actionButtons}</div>}

        {showUserInfo && (
          <div className="flex items-center">
            <span className="material-icons-outlined text-[var(--text-secondary)] text-5xl">
              {roleIcon()}
            </span>
            <div className="ml-3 leading-tight">
              {userName ? (
                <div className="text-[var(--text-primary)] font-medium">
                  {userName}
                </div>
              ) : null}
              <div className="text-[var(--text-secondary)] text-lg">
                {email}
              </div>
              {role ? (
                <div className="text-[var(--text-secondary)] text-sm">
                  {role}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
