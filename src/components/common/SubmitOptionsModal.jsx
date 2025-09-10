import { useEffect, useState } from "react";
import {
  iConnect_get_all_wards_web,
  iConnect_get_all_booths_web,
  iConnect_create_survey_web,
} from "../../apis/SurveyApis";

const SubmitOptionsModal = ({
  show,
  onClose,
  surveyData,
  onSuccess,
}) => {
  const [wards, setWards] = useState([]);
  const [boothsMap, setBoothsMap] = useState({});
  const [selectedWards, setSelectedWards] = useState(new Set());
  const [selectedBooths, setSelectedBooths] = useState(new Set());
  const [boothType, setBoothType] = useState("All");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setError("");
    setLoading(true);
    const party_worker_id = sessionStorage.getItem("party_worker_id") || "";
    iConnect_get_all_wards_web({ party_worker_id })
      .then((res) => {
        // normalize into array
        setWards(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.error("fetch wards error", err);
        setError("Failed to load wards");
      })
      .finally(() => setLoading(false));
  }, [show]);

  const toggleWard = async (wardId) => {
    const next = new Set(selectedWards);
    if (next.has(wardId)) {
      next.delete(wardId);
      // also remove booths from that ward
      const newBooths = new Set(selectedBooths);
      const wardBooths = boothsMap[wardId] || [];
      wardBooths.forEach((b) => newBooths.delete(b.id));
      setSelectedBooths(newBooths);
    } else {
      next.add(wardId);
      // fetch booths for ward if not present
      if (!boothsMap[wardId]) {
        try {
          const res = await iConnect_get_all_booths_web({ ward_id: wardId });
          setBoothsMap((m) => ({ ...m, [wardId]: res || [] }));
        } catch (err) {
          console.error("fetch booths error", err);
        }
      }
    }
    setSelectedWards(next);
  };

  const toggleBooth = (boothId) => {
    const next = new Set(selectedBooths);
    if (next.has(boothId)) next.delete(boothId);
    else next.add(boothId);
    setSelectedBooths(next);
  };

  const validateFuture = () => {
    if (!deadlineDate || !deadlineTime) return true; // optional
    const dt = new Date(`${deadlineDate}T${deadlineTime}`);
    return dt.getTime() > Date.now();
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateFuture()) {
      setError("Please choose a future date and time for deadline");
      return;
    }
    setSubmitLoading(true);

    const payload = {
      party_worker_id: sessionStorage.getItem("party_worker_id") || "",
      title: surveyData.name || surveyData.title || "Untitled Survey",
      description: surveyData.description || "",
      questions: surveyData.questions || [],
      status: (surveyData.status === "Draft" || !surveyData.status) ? "Pending" : surveyData.status || "Pending",
      target_booth_type: boothType,
      target_wards: Array.from(selectedWards),
      target_booths: Array.from(selectedBooths),
      deadline: deadlineDate && deadlineTime ? new Date(`${deadlineDate}T${deadlineTime}`).toISOString() : undefined,
      stage: undefined, // let api fill default
    };

    try {
      const res = await iConnect_create_survey_web(payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      console.error("submit survey error", err);
      setError("Failed to submit survey. Try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-6 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mt-12 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Submit Survey — Targeting & Deadline</h3>
          <button onClick={onClose} className="text-gray-600">close</button>
        </div>

        {loading ? (
          <div>Loading wards...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deadline (optional)</label>
              <div className="flex gap-2">
                <input type="date" value={deadlineDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDeadlineDate(e.target.value)} className="p-2 border rounded-md" />
                <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="p-2 border rounded-md" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Booth Type</label>
                <div className="space-y-2">
                  {["All", "Strong", "Weak", "Swing"].map((b) => (
                    <label key={b} className="flex items-center">
                      <input type="radio" name="boothType" value={b} checked={boothType===b} onChange={(e)=>setBoothType(e.target.value)} className="mr-2" />
                      <span>{b} Booths</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Wards</label>
              <div className="max-h-48 overflow-auto border p-2 rounded">
                {(!Array.isArray(wards) || wards.length === 0) && <div className="text-sm text-gray-500">No wards available</div>}
                {Array.isArray(wards) && wards.map((w) => (
                  <div key={w.id} className="mb-1">
                    <label className="flex items-center">
                      <input type="checkbox" checked={selectedWards.has(w.id)} onChange={() => toggleWard(w.id)} className="mr-2" />
                      <span className="mr-2">{w.name || w.ward_name || `Ward ${w.id}`}</span>
                    </label>
                    {selectedWards.has(w.id) && (
                      <div className="pl-6 mt-1">
                        <div className="text-sm text-gray-600">Booths</div>
                        <div className="max-h-28 overflow-auto border p-2 rounded mt-1">
                          {(boothsMap[w.id] || []).length === 0 && <div className="text-sm text-gray-500">No booths for this ward</div>}
                          {(boothsMap[w.id] || []).map((b) => (
                            <label key={b.id} className="flex items-center">
                              <input type="checkbox" checked={selectedBooths.has(b.id)} onChange={() => toggleBooth(b.id)} className="mr-2" />
                              <span className="text-sm">{b.name || b.booth_name || `Booth ${b.id}`}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-red-600 mt-3">{error}</div>}

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={submitLoading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {submitLoading ? "Submitting..." : "Submit Survey"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitOptionsModal;
