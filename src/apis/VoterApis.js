import apiClient, { DEFAULT_STAGE } from "../apiConfig";
import axios from "axios";

export const getAllVoterS3Url = async (user_id) => {
  if (!user_id) {
    console.error("getAllVoterS3Url: No user_id provided");
    throw new Error("User ID is required");
  }

  const payload = {
    stage: DEFAULT_STAGE,
    user_id: String(user_id),
  };

  console.log("getAllVoterS3Url Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await apiClient.post(
      "/iConnect_get_all_voter_detailsV2_web",
      payload
    );
    console.log("getAllVoterS3Url Response:", JSON.stringify(response.data, null, 2));

    // Check for error in response
    if (response.data.error) {
      console.error("API returned error:", response.data.error);
      throw new Error(response.data.error);
    }

    // Ensure s3_url exists in the response
    if (!response.data.s3_url) {
      console.error("No s3_url provided in API response");
      throw new Error("No S3 URL returned by the API");
    }

    console.log("Fetching voter data from S3 URL:", response.data.s3_url);
    let voterData = null;

    try {
      const s3Response = await axios.get(response.data.s3_url, {
        validateStatus: (status) => status >= 200 && status < 300, // Handle 2xx responses
      });
      console.log("S3 Response Data:", JSON.stringify(s3Response.data, null, 2));

      // Extract voter_details from S3 response
      const s3Data = s3Response.data;
      if (!s3Data || !s3Data.voter_details) {
        console.error("S3 response missing voter_details:", s3Data);
        throw new Error("Invalid S3 response: voter_details field missing");
      }

      voterData = s3Data.voter_details;
      if (!Array.isArray(voterData)) {
        console.error("S3 voter_details is not an array:", voterData);
        throw new Error("Invalid S3 response format: voter_details is not an array");
      }

      console.log("Voter data retrieved from S3:", voterData.length, "records");

      // Check status_message for errors
      const status = s3Data.status_message?.status_flag;
      if (status === "F") {
        throw new Error(s3Data.status_message?.message || "Failed to fetch voter data");
      }

      if (!voterData.length) {
        console.warn("No voter data returned in voter_details");
      } else {
        console.log("Voter data retrieved:", voterData.length, "records");
      }

      return voterData;
    } catch (s3Error) {
      console.error("Failed to fetch voter data from S3:", s3Error.message, s3Error.stack);
      if (s3Error.response) {
        console.error("S3 response status:", s3Error.response.status);
        console.error("S3 response data:", s3Error.response.data);
      }
      throw new Error(`Failed to fetch voter data from S3: ${s3Error.message}`);
    }
  } catch (error) {
    console.error("getAllVoterS3Url Error:", error.message, error.stack);
    throw error; // Re-throw the error to be handled by the caller
  }
};

export const getOtherVoterDetails = async (identifier) => {
  if (!identifier) {
    console.error("getOtherVoterDetails: No identifier provided");
    throw new Error("Voter identifier is required");
  }

  const payload = {
    stage: DEFAULT_STAGE,
    voter_id: String(identifier),
  };

  console.log("getOtherVoterDetails Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await apiClient.post(
      "/iConnect_get_other_voter_details_web",
      payload
    );
    console.log("getOtherVoterDetails Response:", JSON.stringify(response.data, null, 2));

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    if (!response.data?.RESULT?.length) {
      throw new Error("No voter details returned");
    }

    return response.data.RESULT[0];
  } catch (error) {
    console.error("getOtherVoterDetails Error:", error.message, error.stack);
    throw new Error(
      error.response?.data?.RESULT?.[0]?.message ||
      error.message ||
      "Failed to fetch voter details"
    );
  }
};