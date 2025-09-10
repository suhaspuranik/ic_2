const LoginInfoPanel = () => {
  return (
    <div className="w-1/2 bg-[#5C52CF] p-12 text-white flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-[#4e45b7] rounded-full opacity-30"></div>
      <div className="absolute top-[100px] right-[-50px] w-32 h-32 bg-[#4e45b7] rounded-full opacity-30"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-[#4e45b7] rounded-full opacity-30"></div>
      <div className="absolute bottom-[-20px] left-[150px] w-24 h-24 bg-[#4e45b7] rounded-full opacity-30"></div>

      <div className="z-10 text-center">
        {/* Logo Icon */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/20 p-4 rounded-xl">
            <span className="material-icons-outlined text-white text-5xl">
              article
            </span>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-3">Welcome to i-Connect</h1>
        <p className="text-lg text-blue-200 mb-10">
          Empowering Political Parties with Digital Excellence
        </p>

        <div className="grid grid-cols-2 gap-6 mb-10">
          {/* Voter Management */}
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <span className="material-icons-outlined text-white text-3xl mb-2">
              how_to_vote
            </span>
            <p className="font-semibold">Voter Management</p>
          </div>

          {/* Party Workers */}
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <span className="material-icons-outlined text-white text-3xl mb-2">
              groups
            </span>
            <p className="font-semibold">Party Workers</p>
          </div>

          {/* Campaign Analytics */}
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <span className="material-icons-outlined text-white text-3xl mb-2">
              analytics
            </span>
            <p className="font-semibold">Campaign Analytics</p>
          </div>

          {/* Constituency Mapping */}
          <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20">
            <span className="material-icons-outlined text-white text-3xl mb-2">
              map
            </span>
            <p className="font-semibold">Constituency Mapping</p>
          </div>
        </div>

        <p className="text-blue-200 italic">
          "Connecting democracy through technology, one vote at a time."
        </p>
      </div>
    </div>
  );
};

export default LoginInfoPanel;
