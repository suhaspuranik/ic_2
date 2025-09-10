import apiClient, { DEFAULT_STAGE } from "../apiConfig";

/**
 * Create or save a survey (draft or publish) from web.
 * payload should include: user_id, title, description, questions, status, target_booth_type, wards, deadline
 */
export const iConnect_create_survey_web = async (surveyPayload) => {
    const validBoothTypes = ["Strong", "Weak", "Swing", "All"];
    const rawBoothType = surveyPayload.target_booth_type || null;
    const boothType = rawBoothType
        ? validBoothTypes.find(
            (type) => type.toLowerCase() === rawBoothType.toLowerCase()
        ) || null
        : null;
    const rawDeadline = surveyPayload.deadline || null;

    const payload = {
        stage: DEFAULT_STAGE,
        user_id: String(
            surveyPayload.user_id ||
            sessionStorage.getItem("party_worker_id") ||
            "0"
        ),
        title: surveyPayload.title || "",
        description: surveyPayload.description || "",
        questions: surveyPayload.questions || [],
        status: surveyPayload.status || "Draft",
    };

    // Only include targeting fields and deadline when NOT saving a draft
    const statusLower = String(payload.status || "").toLowerCase();
    const isDraft = statusLower === "draft";
    if (!isDraft) {
        if (boothType && boothType !== "All") {
            payload.target_booth_type = boothType;
        } else if (boothType === "All") {
            payload.target_booth_type = null; // Send NULL for 'All' as per stored procedure
        }
        if (surveyPayload.wards) {
            payload.wards = surveyPayload.wards;
        }
        if (rawDeadline) {
            payload.deadline = rawDeadline;
        }
    }

    console.log(
        "iConnect_create_survey_web payload:",
        JSON.stringify(payload, null, 2)
    );
    console.log("Raw booth_type value:", rawBoothType);
    console.log("Normalized booth_type:", boothType);
    console.log("Raw deadline value:", rawDeadline);
    console.log(
        "deadline format validation:",
        rawDeadline
            ? /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawDeadline)
            : "null"
    );
    try {
        const response = await apiClient.post("/iConnect_create_survey_web", payload);
        console.log(
            "iConnect_create_survey_web raw response:",
            JSON.stringify(response.data, null, 2)
        );
        const data = response.data;
        // Handle various response formats
        if (data && data.status) {
            return data; // Direct response: { status: "S", message: "...", ... }
        }
        if (Array.isArray(data)) {
            return data[0] || { status: "F", message: "Empty response array" }; // Handle array response
        }
        if (Array.isArray(data.RESULT)) {
            return data.RESULT[0] || { status: "F", message: "Empty RESULT array" }; // Handle RESULT field
        }
        console.warn("Unexpected response format:", data);
        return { status: "F", message: "Unexpected response format from server" };
    } catch (err) {
        console.error("iConnect_create_survey_web error:", err.response?.data || err.message);
        throw err;
    }
};

/**
 * Fetch survey details for web dashboard.
 * Returns an array of surveys.
 */
export const iConnect_get_survey_details_web = async (query = {}) => {
    const payload = {
        stage: DEFAULT_STAGE,
        user_id: String(
            query.user_id || sessionStorage.getItem("party_worker_id") || "0"
        ),
        ...query,
    };

    try {
        const response = await apiClient.post(
            "/iConnect_get_survey_details_web",
            payload
        );
        const data = response.data;
        console.log(
            "iConnect_get_survey_details_web response:",
            JSON.stringify(data, null, 2)
        );
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.surveys)) return data.surveys;
        if (Array.isArray(data.RESULT)) return data.RESULT;
        for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) return data[key];
        }
        return [];
    } catch (err) {
        console.error("iConnect_get_survey_details_web error:", err.response?.data || err.message);
        return [];
    }
};

/**
 * Get all wards available for a user
 * query: { user_id }
 */
export const iConnect_get_all_wards_web = async (query = {}) => {
    const payload = {
        stage: DEFAULT_STAGE,
        user_id: String(
            query.user_id || sessionStorage.getItem("party_worker_id") || "0"
        ),
        ...query,
    };

    try {
        const response = await apiClient.post("/iConnect_get_all_wards_web", payload);
        const data = response.data;
        console.log(
            "iConnect_get_all_wards_web raw response:",
            JSON.stringify(data, null, 2)
        );
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.wards)) return data.wards;
        if (Array.isArray(data.RESULT)) return data.RESULT; // Handle RESULT field
        for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) return data[key];
        }
        console.warn("No ward data found in response:", data);
        return [];
    } catch (err) {
        console.error("iConnect_get_all_wards_web error:", err.response?.data || err.message);
        return [];
    }
};

/**
 * Get all booths for a ward
 * query: { ward_id }
 */
export const iConnect_get_all_booths_web = async (query = {}) => {
    const payload = {
        stage: DEFAULT_STAGE,
        ward_id: String(query.ward_id || query.wardId || ""),
        ...query,
    };

    try {
        const response = await apiClient.post(
            "/iConnect_get_all_booths_web",
            payload
        );
        const data = response.data;
        console.log(
            "iConnect_get_all_booths_web response:",
            JSON.stringify(data, null, 2)
        );
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
        if (Array.isArray(data.booths)) return data.booths;
        if (Array.isArray(data.RESULT)) return data.RESULT;
        for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) return data[key];
        }
        return [];
    } catch (err) {
        console.error("iConnect_get_all_booths_web error:", err.response?.data || err.message);
        return [];
    }
};