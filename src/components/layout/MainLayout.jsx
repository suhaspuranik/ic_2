const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {children}
    </div>
  );
};

export default MainLayout;
