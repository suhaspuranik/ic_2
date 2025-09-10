import axios from "axios";

const API_BASE_URL =
  "https://p20l118zjj.execute-api.ap-south-1.amazonaws.com/production";

const API_HEADERS = {
  "x-api-key": "sa9F4GyTT45OImNkKjaHu6bsJbk8UWmZfKdzmeoc",
  "Content-Type": "application/json",
};

export const DEFAULT_STAGE = "dev";

// Shared axios client for all API modules
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: API_HEADERS,
});

export default apiClient;
