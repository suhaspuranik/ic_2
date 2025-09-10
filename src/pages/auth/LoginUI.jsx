import LoadingSpinner from "../../components/common/LoadingSpinner";

const LoginUI = ({
  email,
  setEmail,
  emailError,
  password,
  setPassword,
  passwordError,
  newPassword,
  setNewPassword,
  newPasswordError,
  otp,
  setOtp,
  otpError,
  showPassword,
  togglePasswordVisibility,
  isLoading,
  stage,
  handleEmailSubmit,
  handleOtpSubmit,
  handleSetPasswordSubmit,
  handlePasswordSubmit,
  handleResendOtp,
  showError,
  errorMsg,
}) => {
  return (
    <div className="w-1/2 flex flex-col justify-center items-center p-12 bg-white relative">
      {showError && (
        <div
          className={`absolute top-6 left-6 z-10 px-4 py-3 rounded-lg flex items-center shadow-lg ${
            errorMsg.includes("successfully")
              ? "bg-green-100 border-green-300 text-green-700"
              : "bg-red-100 border-red-300 text-red-700"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{errorMsg || "An error occurred"}</span>
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="text-right mb-6">
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure Portal
          </span>
        </div>

        <h2 className="text-3xl font-bold text-gray-800">Sign In</h2>
        <p className="text-gray-500 mt-2 mb-8">
          {stage === "otp"
            ? "Enter the OTP sent to your email"
            : stage === "setPassword"
            ? "Set your new password"
            : stage === "password"
            ? "Enter your password"
            : "Welcome back! Please sign in to your account."}
        </p>

        {stage === "email" && (
          <form onSubmit={handleEmailSubmit}>
            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="email"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  className={`w-full pl-10 pr-4 py-3 border ${
                    emailError ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF]`}
                  id="email"
                  placeholder="Enter your official email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <button
              className={`w-full bg-[#5C52CF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#4e45b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C52CF] transition-colors duration-300 flex items-center justify-center ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner light />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                "Next"
              )}
            </button>
          </form>
        )}

        {stage === "otp" && (
          <form onSubmit={handleOtpSubmit}>
            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="otp"
              >
                OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2zM6 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2zM18 11c0 1.104-.896 2-2 2s-2-.896-2-2 2-4 2-4 2 .896 2 2z"
                    />
                  </svg>
                </div>
                <input
                  className={`w-full pl-10 pr-4 py-3 border ${
                    otpError ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF]`}
                  id="otp"
                  placeholder="Enter OTP"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                />
              </div>
              {otpError && (
                <p className="mt-1 text-sm text-red-600">{otpError}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-8">
              <a
                className="text-sm font-medium text-[#5C52CF] hover:text-[#4e45b7] cursor-pointer"
                onClick={handleResendOtp}
              >
                Resend OTP
              </a>
            </div>

            <button
              className={`w-full bg-[#5C52CF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#4e45b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C52CF] transition-colors duration-300 flex items-center justify-center ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner light />
                  <span className="ml-2">Verifying...</span>
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>
        )}

        {stage === "setPassword" && (
          <form onSubmit={handleSetPasswordSubmit}>
            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="new-password"
              >
                Set Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  className={`w-full pl-10 pr-12 py-3 border ${
                    newPasswordError ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF]`}
                  id="new-password"
                  placeholder="Enter new password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {newPasswordError && (
                <p className="mt-1 text-sm text-red-600">{newPasswordError}</p>
              )}
            </div>

            <button
              className={`w-full bg-[#5C52CF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#4e45b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C52CF] transition-colors duration-300 flex items-center justify-center ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner light />
                  <span className="ml-2">Setting Password...</span>
                </>
              ) : (
                "Set Password"
              )}
            </button>
          </form>
        )}

        {stage === "password" && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  className={`w-full pl-10 pr-12 py-3 border ${
                    passwordError ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-[#5C52CF] focus:border-[#5C52CF]`}
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  type="button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-[#5C52CF] border-gray-300 rounded focus:ring-[#5C52CF]"
                  id="remember-me"
                  type="checkbox"
                />
                <label
                  className="ml-2 block text-sm text-gray-900"
                  htmlFor="remember-me"
                >
                  Remember me
                </label>
              </div>
              <a
                className="text-sm font-medium text-[#5C52CF] hover:text-[#4e45b7]"
                href="#"
              >
                Forgot password?
              </a>
            </div>

            <button
              className={`w-full bg-[#5C52CF] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#4e45b7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5C52CF] transition-colors duration-300 flex items-center justify-center ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner light />
                  <span className="ml-2">Signing in...</span>
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginUI;