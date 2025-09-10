import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBoothWorkers,
  iConnect_get_all_wards_web,
  iConnect_get_all_booths_web,
  createPartyWorker,
} from "../../apis/BoothWorkerApis";

const formatToday = () => new Date().toISOString().split("T")[0];

const computeNextWorkerNumber = (workers) => {
  if (!Array.isArray(workers) || workers.length === 0) return "BW001";
  const last = workers[workers.length - 1]?.party_worker_number || "BW000";
  const match = String(last).match(/^(\D*)(\d+)$/);
  if (!match) return "BW001";
  const prefix = match[1] || "BW";
  const num = parseInt(match[2], 10) + 1;
  const width = match[2].length;
  return `${prefix}${String(num).padStart(width, "0")}`;
};

const AddEditBoothWorkerPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user_id: sessionStorage.getItem("party_worker_id") || "0",
    party_worker_number: "",
    name: "",
    gender: "",
    dob: "",
    address: "",
    town_village: "",
    district: "",
    state: "",
    pin_code: "",
    phone_number: "",
    email_id: "",
    caste: "",
    religion: "",
    blood_group: "",
    pan_number: "",
    aadhar_number: "",
    profession: "",
    mappings: [],
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [wards, setWards] = useState([]);
  const [booths, setBooths] = useState([]);
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedBooth, setSelectedBooth] = useState("");
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingBooths, setLoadingBooths] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    message: "",
  });
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const init = async () => {
      try {
        setLoadingInit(true);
        const urlParams = new URLSearchParams(window.location.search);
        const editNumber = urlParams.get("id");
        if (editNumber) setIsEditMode(true);

        const userId = sessionStorage.getItem("party_worker_id") || "0";
        const workersResp = await getBoothWorkers(userId);
        const workers = Array.isArray(workersResp?.RESULT)
          ? workersResp.RESULT
          : [];

        if (!editNumber) {
          const nextNo = computeNextWorkerNumber(workers);
          setFormData((prev) => ({ ...prev, party_worker_number: nextNo }));
        }

        setLoadingWards(true);
        const wardResp = await iConnect_get_all_wards_web({ user_id: userId });
        setWards(wardResp.wards);
        if (wardResp.error) {
          setError(wardResp.error);
        }
      } catch {
        setError("Failed to initialize form data");
      } finally {
        setLoadingWards(false);
        setLoadingInit(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchBooths = async () => {
      try {
        setLoadingBooths(true);
        setBooths([]);
        setSelectedBooth("");
        setFormData((prev) => ({ ...prev, mappings: [] }));

        if (selectedWard) {
          const userId = sessionStorage.getItem("party_worker_id") || "0";
          const boothResp = await iConnect_get_all_booths_web({
            user_id: userId,
            ward_id: selectedWard,
          });
          setBooths(boothResp.booths);
          if (boothResp.error) {
            setError(boothResp.error);
          }
        }
      } catch {
        setError("Failed to fetch booths");
      } finally {
        setLoadingBooths(false);
      }
    };

    fetchBooths();
  }, [selectedWard]);

  const showToast = (message, type = "info", durationMs = 4000) => {
    setToast({ visible: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, durationMs);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "aadhar_number" && value.length > 12) {
      return; // Prevent input beyond 12 digits
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWardChange = (e) => {
    const wardId = e.target.value;
    setSelectedWard(wardId);
    setSelectedBooth(""); // Reset booth selection when ward changes
    setFormData((prev) => ({ ...prev, mappings: [] }));
  };

  const handleBoothChange = (e) => {
    const boothValue = e.target.value;
    setSelectedBooth(boothValue);
    const [boothId] = boothValue.split(" - "); // Extract booth_id from the selected value
    setFormData((prev) => ({
      ...prev,
      mappings: boothValue ? [{ ward_id: parseInt(selectedWard), booth_id: parseInt(boothId) }] : [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.party_worker_number ||
      !formData.name ||
      !formData.phone_number ||
      !selectedWard ||
      !selectedBooth
    ) {
      showToast(
        "Please fill required fields: Worker Number, Name, Phone, Ward, and Booth",
        "error"
      );
      return;
    }

    if (formData.aadhar_number && formData.aadhar_number.length !== 12) {
      showToast("Aadhar Number must be exactly 12 digits", "error");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createPartyWorker(formData);

      // Extract the first result from the RESULT array
      const result = Array.isArray(response?.RESULT) && response.RESULT.length > 0 ? response.RESULT[0] : null;
      const rawFlag = result?.status || "";
      const rawMessage = result?.message || "Booth Worker created successfully";

      const flag = String(rawFlag).trim().toUpperCase();
      const message = String(rawMessage).trim();

      const inferredSuccess = !flag && /success|created|added/i.test(message || "");

      if (flag === "S" || inferredSuccess) {
        showToast(
          "Booth Worker added successfully!",
          "success",
          3000
        );
        window.setTimeout(() => {
          navigate("/booth-workers");
        }, 2500);
      } else {
        if (message.toLowerCase().includes("duplicate entry") && message.toLowerCase().includes("email")) {
          showToast("Email already exists. Please use a different email.", "error");
        } else if (message.toLowerCase().includes("duplicate entry") && message.toLowerCase().includes("phone_number")) {
          showToast("Phone number already exists. Please use a different phone number.", "error");
        } else {
          showToast(message || "Failed to add booth worker", "error");
        }
      }
    } catch (error) {
      console.error("Error creating booth worker:", error);
      showToast("Could not add booth worker. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-0 px-8">
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {isEditMode ? "Edit Booth Worker" : "Add New Booth Worker"}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isEditMode
              ? "Update booth worker information"
              : "Enter the details to add a booth worker"}
          </p>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Worker Number */}
            <div>
              <label
                htmlFor="party_worker_number"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Worker Number *
              </label>
              <input
                type="text"
                id="party_worker_number"
                name="party_worker_number"
                value={formData.party_worker_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="e.g., BW001"
              />
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="Enter full name"
              />
            </div>

            {/* Gender */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>

            {/* DOB */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="10-digit phone number"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email_id"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email_id"
                name="email_id"
                value={formData.email_id}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="Email address"
              />
            </div>

            {/* Address */}
            <div className="lg:col-span-3">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="Street, area"
              />
            </div>

            {/* Town/Village */}
            <div>
              <label
                htmlFor="town_village"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Town / Village
              </label>
              <input
                type="text"
                id="town_village"
                name="town_village"
                value={formData.town_village}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
              />
            </div>

            {/* District */}
            <div>
              <label
                htmlFor="district"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                District
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
              />
            </div>

            {/* State */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
              />
            </div>

            {/* PIN Code */}
            <div>
              <label
                htmlFor="pin_code"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                PIN Code
              </label>
              <input
                type="text"
                id="pin_code"
                name="pin_code"
                value={formData.pin_code}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
              />
            </div>

            {/* Caste */}
            <div>
              <label
                htmlFor="caste"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Caste
              </label>
              <input
                type="text"
                id="caste"
                name="caste"
                value={formData.caste}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="e.g., OBC"
              />
            </div>

            {/* Religion */}
            <div>
              <label
                htmlFor="religion"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Religion
              </label>
              <input
                type="text"
                id="religion"
                name="religion"
                value={formData.religion}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="e.g., Hindu"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label
                htmlFor="blood_group"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Blood Group
              </label>
              <input
                type="text"
                id="blood_group"
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="e.g., B+"
              />
            </div>

            {/* PAN Number */}
            <div>
              <label
                htmlFor="pan_number"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                PAN Number
              </label>
              <input
                type="text"
                id="pan_number"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="e.g., ABCDE1234F"
              />
            </div>

            {/* Profession */}
            <div>
              <label
                htmlFor="profession"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Profession
              </label>
              <input
                type="text"
                id="profession"
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="e.g., Teacher"
              />
            </div>

            {/* Aadhar Number */}
            <div>
              <label
                htmlFor="aadhar_number"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Aadhar Number
              </label>
              <input
                type="number"
                id="aadhar_number"
                name="aadhar_number"
                value={formData.aadhar_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                placeholder="Enter 12-digit Aadhar number"
              />
            </div>

            {/* Ward */}
            <div>
              <label
                htmlFor="ward"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Ward *
              </label>
              <select
                id="ward"
                value={selectedWard}
                onChange={handleWardChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base"
                disabled={loadingWards}
              >
                <option value="">Select Ward</option>
                {wards.map((w) => (
                  <option key={w.ward_id} value={w.ward_id}>
                    {w.ward_name || `Ward ${w.ward_number || w.ward_id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Booth */}
            <div>
              <label
                htmlFor="booth"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Booth *
              </label>
              <select
                id="booth"
                value={selectedBooth}
                onChange={handleBoothChange}
                required
                disabled={!selectedWard || loadingBooths}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 text-base disabled:opacity-50"
              >
                <option value="">
                  {loadingBooths
                    ? "Loading booths..."
                    : !selectedWard
                    ? "Select a ward first"
                    : "Select Booth"}
                </option>
                {booths.map((b) => (
                  <option
                    key={b.booth_id}
                    value={`${b.booth_id} - ${b.booth_name || `Booth ${b.booth_id}`} - ${b.booth_address || "No Address"}`}
                  >
                    {`${b.booth_id} - ${b.booth_name || `Booth ${b.booth_id}`} - ${b.booth_address || "No Address"} (${b.booth_type || "—"})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <a
              href="/booth-workers"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <span className="material-icons-outlined text-sm mr-1">
                cancel
              </span>
              Cancel
            </a>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons-outlined text-sm mr-1">
                {submitting
                  ? "hourglass_empty"
                  : isEditMode
                  ? "update"
                  : "save"}
              </span>
              {submitting
                ? "Adding..."
                : isEditMode
                ? "Update Worker"
                : "Add Worker"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
              toast.type === "success"
                ? "bg-green-500"
                : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditBoothWorkerPage;