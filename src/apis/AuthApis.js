console.log("Loading AuthApis.js module");

import apiClient, { DEFAULT_STAGE } from "../apiConfig";

console.log("Imported apiClient and DEFAULT_STAGE:", { apiClient, DEFAULT_STAGE });

export const loginUser = async (email, password) => {
  console.log("Entering loginUser function with email:", email, "password:", password);
  const payload = {
    stage: DEFAULT_STAGE,
    email: email.trim(),
  };
  if (password) {
    payload.password = password.trim();
  }
  try {
    console.log("Login User Payload:", payload);
    const response = await apiClient.post("/iConnect_login_or_send_otp_web", payload);
    console.log("Login User Raw Response:", response);
    return response.data;
  } catch (err) {
    console.error("Login User API Error:", err.response || err);
    throw new Error(err.response?.data?.RESULT?.[0]?.message || "Failed to process email");
  }
};

export const verifyOtp = async (email, otp) => {
  console.log("Entering verifyOtp function with email:", email, "otp:", otp);
  const payload = {
    stage: DEFAULT_STAGE,
    email: email.trim(),
    otp_code: otp.trim(),
  };
  try {
    console.log("Verify OTP Payload:", payload);
    const response = await apiClient.post("/iConnect_verify_otp_web", payload);
    console.log("Verify OTP Raw Response:", response);
    return response.data;
  } catch (err) {
    console.error("Verify OTP API Error:", err.response || err);
    throw new Error(err.response?.data?.RESULT?.[0]?.p_out_mssg || "Failed to verify OTP");
  }
};

export const setPassword = async (email, password) => {
  console.log("Entering setPassword function with email:", email, "password:", password);
  try {
    if (!apiClient || !apiClient.post) {
      throw new Error("apiClient is not properly initialized");
    }
    if (!DEFAULT_STAGE) {
      throw new Error("DEFAULT_STAGE is not defined");
    }
    console.log("Checking apiClient and DEFAULT_STAGE:", { apiClient, DEFAULT_STAGE });
    const payload = {
      stage: DEFAULT_STAGE,
      email: email.trim(),
      password: password.trim(),
    };
    console.log("Set Password Payload:", payload);
    console.log("Attempting to call API: /iConnect_set_password_web");
    const response = await apiClient.post("/iConnect_set_password_web", payload);
    console.log("Set Password Raw Response:", response);
    return response.data || response;
  } catch (err) {
    console.error("Set Password API Error:", err.response || err);
    console.error("Error Details:", {
      message: err.message,
      code: err.code,
      config: err.config,
      stack: err.stack,
    });
    throw new Error(err.response?.data?.[0]?.p_out_mssg || err.response?.data?.message || err.message || "Failed to set password");
  }
};

console.log("Exporting AuthApis functions:", { loginUser, verifyOtp, setPassword });