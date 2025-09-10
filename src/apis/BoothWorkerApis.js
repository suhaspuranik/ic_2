import apiClient, { DEFAULT_STAGE } from "../apiConfig";

export const getBoothWorkers = async (user_id) => {
  const payload = {
    stage: DEFAULT_STAGE,
    user_id: user_id,
  };
  const response = await apiClient.post(
    "/iConnect_get_all_party_worker_details_web",
    payload
  );
  return response.data;
};

export const blockPartyWorker = async (logged_in_user_id, target_user_id) => {
  const payload = {
    stage: DEFAULT_STAGE,
    logged_in_user_id: logged_in_user_id, // New parameter
    target_user_id: target_user_id,       // Renamed from user_id
    status: "Block",
  };
  const response = await apiClient.post(
    "/iConnect_block_party_worker_web",
    payload
  );
  return response.data;
};

export const getBoothDetails = async () => {
  const roleName = sessionStorage.getItem("role_name");
  let payload = { stage: DEFAULT_STAGE };

  if (roleName === "Assembly Head") {
    const assemblyId = sessionStorage.getItem("assembly_id");
    payload.assembly_id = assemblyId;
  } else if (roleName === "Ward President") {
    const wardId = sessionStorage.getItem("ward_id");
    payload.ward_id = wardId;
  }

  const response = await apiClient.post(
    "/iConnect_get_booth_details_web",
    payload
  );
  return response.data;
};

export const reassignBoothToPartyWorker = async (workerId, currentWardId, currentBoothId, currentAssemblyId, newWardId, newBoothId, newAssemblyId) => {
  const payload = {
    stage: DEFAULT_STAGE,
    logged_in_user_id: sessionStorage.getItem("user_id") || "",
    target_user_id: workerId.toString(),
    current_mapping: {
      ward_id: currentWardId.toString(),
      booth_id: currentBoothId.toString(),
      assembly_id: currentAssemblyId.toString(),
    },
    new_mapping: {
      ward_id: newWardId.toString(),
      booth_id: newBoothId.toString(),
      assembly_id: newAssemblyId.toString(),
    },
  };
  const response = await apiClient.post(
    "/iConnect_reassign_booth_to_party_worker_web",
    payload
  );
  return response.data;
};
export const createPartyWorker = async (workerData) => {
  const payload = {
    stage: DEFAULT_STAGE,
    user_id: parseInt(workerData.user_id) || 0,
    user_number: workerData.party_worker_number,
    name: workerData.name,
    email: workerData.email_id,
    phone_number: workerData.phone_number,
    gender: workerData.gender,
    dob: workerData.dob,
    address: workerData.address,
    town_village: workerData.town_village,
    district: workerData.district,
    state: workerData.state,
    pin_code: workerData.pin_code,
    caste: workerData.caste,
    religion: workerData.religion,
    blood_group: workerData.blood_group,
    pan_number: workerData.pan_number,
    aadhar_number: workerData.aadhar_number,
    profession: workerData.profession,
    mappings: workerData.mappings || [],
  };
  const response = await apiClient.post(
    "/iConnect_create_party_worker_web",
    payload
  );
  return response.data;
};

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

    if (data.p_out_mssg_flg === "F") {
      console.error("Failed to fetch wards:", data.p_out_mssg);
      return { wards: [], error: data.p_out_mssg };
    }

    if (Array.isArray(data)) return { wards: data, error: null };
    if (Array.isArray(data.RESULT)) return { wards: data.RESULT, error: null };
    if (Array.isArray(data.items)) return { wards: data.items, error: null };
    if (Array.isArray(data.wards)) return { wards: data.wards, error: null };
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return { wards: data[key], error: null };
    }
    return { wards: [], error: "No wards found in response" };
  } catch (err) {
    console.error("Error fetching wards:", err.response?.data || err.message);
    return { wards: [], error: err.response?.data?.p_out_mssg || err.message };
  }
};

export const iConnect_get_all_booths_web = async (query = {}) => {
  const payload = {
    stage: DEFAULT_STAGE,
    user_id: String(
      query.user_id || sessionStorage.getItem("party_worker_id") || "0"
    ),
    ward_id: String(query.ward_id || query.wardId || ""),
    ...query,
  };

  try {
    const response = await apiClient.post("/iConnect_get_all_booths_web", payload);
    const data = response.data;

    if (data.p_out_mssg_flg === "F") {
      console.error("Failed to fetch booths:", data.p_out_mssg);
      return { booths: [], error: data.p_out_mssg };
    }

    if (Array.isArray(data)) return { booths: data, error: null };
    if (Array.isArray(data.RESULT)) return { booths: data.RESULT, error: null };
    if (Array.isArray(data.items)) return { booths: data.items, error: null };
    if (Array.isArray(data.booths)) return { booths: data.booths, error: null };
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return { booths: data[key], error: null };
    }
    return { booths: [], error: "No booths found in response" };
  } catch (err) {
    console.error("Error fetching booths:", err.response?.data || err.message);
    return { booths: [], error: err.response?.data?.p_out_mssg || err.message };
  }
};