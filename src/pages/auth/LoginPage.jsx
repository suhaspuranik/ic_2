import { useEffect, useState } from "react";
import { isValidEmail, isRequired } from "../../utils/validation";
import LoginInfoPanel from "../../components/LoginInfoPanel";
import LoginUI from "./LoginUI";
import { useNavigate } from "react-router-dom";
import { loginUser, verifyOtp, setPassword } from "../../apis/AuthApis";

console.log("Imported AuthApis functions:", { loginUser, verifyOtp, setPassword });

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState("email"); // email, otp, setPassword, password
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    const isAuthed = Boolean(sessionStorage.getItem("party_worker_id") || sessionStorage.getItem("email_id") || sessionStorage.getItem("is_authenticated"));
    console.log("useEffect: Checking authentication, isAuthed:", isAuthed, "sessionStorage:", { ...sessionStorage });
    if (isAuthed) {
      setIsAuthenticated(true);
      console.log("useEffect: User is authenticated, navigating to /dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }

    const lockToLogin = () => {
      console.log("popstate triggered, current path:", window.location.pathname, "isAuthenticated:", isAuthenticated, "sessionStorage:", { ...sessionStorage });
      if (!isAuthenticated && window.location.pathname !== "/login") {
        console.log("Redirecting to /login due to unauthenticated state");
        navigate("/login", { replace: true });
      }
    };

    window.history.pushState(null, "", "/login");
    window.addEventListener("popstate", lockToLogin);
    return () => {
      console.log("Cleaning up popstate listener");
      window.removeEventListener("popstate", lockToLogin);
    };
  }, [isAuthenticated, navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setShowError(false);
    setErrorMsg("");

    if (!isRequired(email)) {
      setEmailError("Email is required");
      return;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Submitting email:", email);
      const res = await loginUser(email);
      console.log("Email Submit Response:", res);
      const result = res.RESULT?.[0];
      if (result?.status === "S") {
        if (result.message.includes("OTP sent successfully")) {
          console.log("Unverified user, moving to OTP stage");
          setStage("otp");
        } else if (result.message.includes("Verified user")) {
          console.log("Verified user, moving to password stage");
          setIsVerifiedUser(true);
          setStage("password");
        } else {
          setShowError(true);
          setErrorMsg(result?.message || "Unexpected response");
        }
      } else {
        setShowError(true);
        setErrorMsg(result?.message || "Failed to process email");
      }
    } catch (err) {
      console.error("Email Submit Error:", err);
      setShowError(true);
      setErrorMsg(err.message || "Failed to process email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setShowError(false);
    setErrorMsg("");

    if (!isRequired(otp)) {
      setOtpError("OTP is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otp.trim());
      console.log("OTP Verification Response:", res);
      const result = res.RESULT?.[0];
      if (result?.p_out_mssg_flg === "S") {
        console.log("OTP verified successfully, moving to setPassword stage");
        setStage("setPassword");
      } else {
        setShowError(true);
        setErrorMsg(result?.p_out_mssg || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP Verification Error:", err);
      setShowError(true);
      setErrorMsg(err.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();
    setNewPasswordError("");
    setShowError(false);
    setErrorMsg("");

    if (!isRequired(newPassword)) {
      setNewPasswordError("Password is required");
      return;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Calling setPassword with email:", email, "newPassword:", newPassword);
      const res = await setPassword(email, newPassword);
      console.log("Set Password Response:", res);
      if (!res) {
        throw new Error("No response received from set password API");
      }
      const result = res?.[0] || res.data?.[0] || res.RESULT?.[0] || res;
      if (result?.p_out_mssg_flg === "S") {
        console.log("Password set successfully, attempting login");
        await handleLoginAfterPasswordSet();
      } else {
        setShowError(true);
        setErrorMsg(result?.p_out_mssg || "Failed to set password");
      }
    } catch (err) {
      console.error("Set Password Error:", err);
      setShowError(true);
      setErrorMsg(err.message || "Failed to set password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setShowError(false);
    setErrorMsg("");

    if (!isRequired(password)) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Calling loginUser with email:", email, "password:", password);
      const payload = { stage: "dev", email: email.trim(), password: password.trim() };
      console.log("Password Submit Payload:", payload);
      const res = await loginUser(email, password);
      console.log("Password Submit Response:", res);
      const result = res.RESULT?.[0];
      if (result?.status === "S" && result.message === "Login successful") {
        console.log("Login successful, checking for roles:", result.roles);
        setIsAuthenticated(true);
        sessionStorage.setItem("email_id", String(result.email || email));
        sessionStorage.setItem("is_authenticated", "true");
        sessionStorage.setItem("user_id", String(result.user_id || ""));
        sessionStorage.setItem("user_number", String(result.user_number || ""));
        sessionStorage.setItem("name", String(result.name || ""));
        sessionStorage.setItem("phone_number", String(result.phone_number || ""));
        let roles = result.roles;
        if (typeof roles === "string") {
          try {
            roles = JSON.parse(roles);
            console.log("Parsed roles:", roles);
          } catch (err) {
            console.error("Error parsing roles:", err);
            roles = [];
          }
        }
        if (Array.isArray(roles) && roles.length > 0) {
          const roleData = roles[0];
          sessionStorage.setItem("party_worker_id", String(roleData.user_id || result.user_id || ""));
          sessionStorage.setItem("party_worker_number", String(roleData.user_id || result.user_id || ""));
          sessionStorage.setItem("role_id", String(roleData.role_id || ""));
          sessionStorage.setItem("role_name", String(roleData.role || ""));
          sessionStorage.setItem("assembly_id", String(roleData.assembly_id || ""));
          sessionStorage.setItem("ward_id", String(roleData.ward_id || ""));
          console.log("Session storage set:", { ...sessionStorage });
          console.log("Navigating to /dashboard with roles");
        } else {
          console.log("No valid roles array, using minimal session data");
          sessionStorage.setItem("party_worker_id", String(result.user_id || ""));
          console.log("Session storage set:", { ...sessionStorage });
        }
        navigate("/dashboard", { replace: true });
      } else {
        setShowError(true);
        setErrorMsg(result?.message || "Login failed. Please check your password.");
      }
    } catch (err) {
      console.error("Password Submit Error:", err);
      setShowError(true);
      setErrorMsg(err.message || "Login failed. Please check your password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginAfterPasswordSet = async () => {
    try {
      console.log("Calling loginUser after setPassword with email:", email, "password:", newPassword);
      const res = await loginUser(email, newPassword);
      console.log("Login After Password Set Response:", res);
      const result = res.RESULT?.[0];
      if (result?.status === "S" && result.message === "Login successful") {
        console.log("Login successful after password set, checking for roles:", result.roles);
        setIsAuthenticated(true);
        sessionStorage.setItem("email_id", String(result.email || email));
        sessionStorage.setItem("is_authenticated", "true");
        sessionStorage.setItem("user_id", String(result.user_id || ""));
        sessionStorage.setItem("user_number", String(result.user_number || ""));
        sessionStorage.setItem("name", String(result.name || ""));
        sessionStorage.setItem("phone_number", String(result.phone_number || ""));
        let roles = result.roles;
        if (typeof roles === "string") {
          try {
            roles = JSON.parse(roles);
            console.log("Parsed roles:", roles);
          } catch (err) {
            console.error("Error parsing roles:", err);
            roles = [];
          }
        }
        if (Array.isArray(roles) && roles.length > 0) {
          const roleData = roles[0];
          sessionStorage.setItem("party_worker_id", String(roleData.user_id || result.user_id || ""));
          sessionStorage.setItem("party_worker_number", String(roleData.user_id || result.user_id || ""));
          sessionStorage.setItem("role_id", String(roleData.role_id || ""));
          sessionStorage.setItem("role_name", String(roleData.role || ""));
          sessionStorage.setItem("assembly_id", String(roleData.assembly_id || ""));
          sessionStorage.setItem("ward_id", String(roleData.ward_id || ""));
          console.log("Session storage set:", { ...sessionStorage });
          console.log("Navigating to /dashboard after password set");
        } else {
          console.log("No valid roles array after password set, using minimal session data");
          sessionStorage.setItem("party_worker_id", String(result.user_id || ""));
          console.log("Session storage set:", { ...sessionStorage });
        }
        navigate("/dashboard", { replace: true });
      } else {
        setShowError(true);
        setErrorMsg(result?.message || "Login failed after setting password");
      }
    } catch (err) {
      console.error("Login After Password Set Error:", err);
      setShowError(true);
      setErrorMsg(err.message || "Login failed after setting password");
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      console.log("Resending OTP for email:", email);
      const res = await loginUser(email);
      console.log("Resend OTP Response:", res);
      const result = res.RESULT?.[0];
      if (result?.status === "S") {
        setShowError(true);
        setErrorMsg("OTP resent successfully");
      } else {
        setShowError(true);
        setErrorMsg(result?.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP Error:", err);
      setShowError(true);
      setErrorMsg(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <LoginInfoPanel />
      <LoginUI
        email={email}
        setEmail={setEmail}
        emailError={emailError}
        password={password}
        setPassword={setPasswordInput}
        passwordError={passwordError}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        newPasswordError={newPasswordError}
        otp={otp}
        setOtp={setOtp}
        otpError={otpError}
        showPassword={showPassword}
        togglePasswordVisibility={togglePasswordVisibility}
        isLoading={isLoading}
        stage={stage}
        handleEmailSubmit={handleEmailSubmit}
        handleOtpSubmit={handleOtpSubmit}
        handleSetPasswordSubmit={handleSetPasswordSubmit}
        handlePasswordSubmit={handlePasswordSubmit}
        handleResendOtp={handleResendOtp}
        showError={showError}
        errorMsg={errorMsg}
      />
    </div>
  );
};

export default LoginPage;