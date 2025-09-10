import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getBoothDetails,
  reassignBoothToPartyWorker,
} from "../../apis/BoothWorkerApis";

const ReassignBoothPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [worker, setWorker] = useState(null);
  const [boothDetails, setBoothDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigningBoothId, setAssigningBoothId] = useState(null);
  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    message: "",
  });
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return; // Prevent duplicate calls
    didInitRef.current = true;
    // Get worker data from URL parameters
    const workerData = searchParams.get("worker");
    if (workerData) {
      try {
        const parsedWorker = JSON.parse(decodeURIComponent(workerData));
        setWorker(parsedWorker);
      } catch (error) {
        console.error("Error parsing worker data:", error);
        navigate("/booth-workers");
        return;
      }
    } else {
      // If no worker data, redirect back to booth workers
      navigate("/booth-workers");
      return;
    }

    fetchBoothDetails();
  }, [searchParams, navigate]);

  const showToast = (message, type = "info", durationMs = 1500) => {
    setToast({ visible: true, type, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, durationMs);
  };

  const fetchBoothDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBoothDetails();
      const booths = Array.isArray(response?.RESULT) ? response.RESULT : [];
      setBoothDetails(booths);
    } catch {
      setError("Failed to load booth details");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBooth = async (boothId) => {
    if (!worker?.party_worker_id || !boothId) return;

    try {
      setAssigningBoothId(boothId);

      const data = await reassignBoothToPartyWorker(
        boothId,
        worker.party_worker_id
      );

      // Robust success detection across various API shapes
      const resultArr = Array.isArray(data?.RESULT) ? data.RESULT : undefined;
      const resultObj =
        resultArr && resultArr.length > 0 ? resultArr[0] : undefined;

      const rawFlag =
        (data &&
          (data.p_out_mssg_flg ??
            data.RESULT?.p_out_mssg_flg ??
            data.result?.p_out_mssg_flg)) ??
        (resultObj && (resultObj.p_out_mssg_flg ?? resultObj.P_OUT_MSSG_FLG)) ??
        "";

      const flag = String(rawFlag).trim().toUpperCase();

      const rawMessage =
        (data &&
          (data.p_out_mssg ??
            data.RESULT?.p_out_mssg ??
            data.result?.p_out_mssg)) ??
        (resultObj && (resultObj.p_out_mssg ?? resultObj.P_OUT_MSSG)) ??
        "Booth reassigned successfully";

      const message = String(rawMessage).trim();

      // Infer success if flag is empty but message contains typical success phrases
      const inferredSuccess = !flag && /success|reassign/i.test(message || "");

      if (flag === "S" || inferredSuccess) {
        showToast(message || "Booth reassigned successfully", "success", 3000);
        window.setTimeout(() => {
          navigate("/booth-workers");
        }, 2500);
      } else {
        showToast(message || "Failed to reassign booth", "error");
      }
    } catch {
      showToast("Could not reassign booth. Please try again.", "error");
    } finally {
      setAssigningBoothId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booth details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <span className="material-icons-outlined text-4xl">error</span>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/booth-workers")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div
            className={`px-5 py-2 rounded-full shadow-md border text-sm text-center min-w-[280px] ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Worker Details Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {worker?.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Worker Number:</span>
                  <p className="font-medium text-gray-900">
                    {worker?.party_worker_number}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Current Booth:</span>
                  <p className="font-medium text-gray-900">
                    {worker?.booth_id || "Not Assigned"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {boothDetails.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-4">
              <span className="material-icons-outlined text-4xl">
                location_off
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Booths Available
            </h3>
            <p className="text-gray-600">
              There are no booths available for reassignment at this time.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Available Booths
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select a booth to assign to {worker?.name}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booth Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boothDetails.map((booth, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="material-icons-outlined text-blue-600 mr-2">
                            location_on
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            Booth {booth.booth_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {booth.booth_type || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {booth.booth_address || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() =>
                            handleAssignBooth(
                              booth.booth_id || booth.booth_number
                            )
                          }
                          disabled={
                            assigningBoothId ===
                            (booth.booth_id || booth.booth_number)
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {assigningBoothId ===
                          (booth.booth_id || booth.booth_number) ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                              Assigning...
                            </>
                          ) : (
                            "Assign"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReassignBoothPage;
