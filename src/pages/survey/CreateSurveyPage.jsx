import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { iConnect_create_survey_web, iConnect_get_all_wards_web, iConnect_get_all_booths_web } from "../../apis/SurveyApis";

const CreateSurveyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingSurveyData = location.state?.surveyData;

  // Normalize existing data, preserving question_id if present
  const normalizedExisting = existingSurveyData
    ? {
        title: existingSurveyData.title || existingSurveyData.name || "",
        description: existingSurveyData.description || "",
        questions: (existingSurveyData.questions || []).map((q, index) => ({
          text: q.text || q.question_text || "",
          type: q.type || q.question_type || "radio",
          options: q.options || [],
          id: q.id || Date.now() + index,
          question_id: q.question_id || index + 1,
        })),
      }
    : {
        title: "",
        description: "",
        questions: [],
      };

  const [surveyData, setSurveyData] = useState(normalizedExisting);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "radio",
    options: ["", ""],
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showToast, setShowToast] = useState({ show: false, message: "", isError: false });
  const [showSubmitOptions, setShowSubmitOptions] = useState(false);
  const [submitOptions, setSubmitOptions] = useState({
    targetBoothType: "All",
    deadline: null,
    wards: [],
    selectAllWards: false,
  });
  const [wards, setWards] = useState([]);
  const [boothsByWard, setBoothsByWard] = useState({});
  const [isBoothsLoading, setIsBoothsLoading] = useState(false);
  const [isWardsLoading, setIsWardsLoading] = useState(false);
  const [expandedWard, setExpandedWard] = useState(null);
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const validBoothTypes = ["Strong", "Weak", "Swing", "All"];

  // Check authentication on mount
  useEffect(() => {
    const userId = sessionStorage.getItem("party_worker_id");
    if (!userId) {
      showToastMessage("Please log in to continue.", true);
      navigate("/login");
    }
    console.log("Initial user_id:", userId);
  }, [navigate]);

  // Debug: Log submitOptions and booths state
  useEffect(() => {
    console.log(
      "submitOptions updated:",
      JSON.stringify(
        {
          ...submitOptions,
          deadline: submitOptions.deadline ? submitOptions.deadline.toISOString() : null,
        },
        null,
        2
      )
    );
    console.log("Booths by ward:", JSON.stringify(boothsByWard, null, 2));
    console.log("Booths loading:", isBoothsLoading);
    console.log("Wards state:", JSON.stringify(wards, null, 2));
    console.log("Wards loading:", isWardsLoading);
  }, [submitOptions, boothsByWard, isBoothsLoading, wards, isWardsLoading]);

  // Fetch wards when modal opens
  useEffect(() => {
    if (showSubmitOptions) {
      const fetchWards = async () => {
        try {
          setIsWardsLoading(true);
          const userId = sessionStorage.getItem("party_worker_id");
          if (!userId) {
            throw new Error("Invalid user_id: Not logged in");
          }
          console.log("Fetching wards with payload:", { user_id: userId });
          const wardData = await iConnect_get_all_wards_web({ user_id: userId });
          console.log("Wards fetched:", JSON.stringify(wardData, null, 2));
          if (!Array.isArray(wardData) || wardData.length === 0) {
            throw new Error("No wards data returned from API");
          }
          if (!wardData.every((ward) => ward.ward_id || ward.id)) {
            throw new Error("Invalid ward data: Missing ward_id or id");
          }
          setWards(wardData);
        } catch (err) {
          console.error("Failed to fetch wards:", err.message);
          showToastMessage("Failed to load wards: " + err.message, true);
          setWards([]);
        } finally {
          setIsWardsLoading(false);
        }
      };
      fetchWards();
    }
  }, [showSubmitOptions]);

  // Fetch booths when wards change or targetBoothType changes
  useEffect(() => {
    const fetchBooths = async () => {
      try {
        setIsBoothsLoading(true);
        const userId = sessionStorage.getItem("party_worker_id");
        if (!userId) {
          throw new Error("Invalid user_id: Not logged in");
        }
        const newBoothsByWard = { ...boothsByWard };
        for (const ward of submitOptions.wards) {
          if (ward.ward_id && !newBoothsByWard[ward.ward_id]) {
            console.log("Fetching booths for ward:", ward.ward_id);
            const boothData = await iConnect_get_all_booths_web({
              user_id: userId,
              ward_id: ward.ward_id,
            });
            console.log(`Booths fetched for ward ${ward.ward_id}:`, JSON.stringify(boothData, null, 2));
            if (!Array.isArray(boothData)) {
              throw new Error("Invalid booths data: Expected an array");
            }
            const filteredBooths =
              submitOptions.targetBoothType && submitOptions.targetBoothType !== "All"
                ? boothData.filter(
                    (booth) =>
                      booth.booth_type?.toLowerCase() === submitOptions.targetBoothType.toLowerCase()
                  )
                : boothData;
            newBoothsByWard[ward.ward_id] = filteredBooths;
          }
        }
        setBoothsByWard(newBoothsByWard);
      } catch (err) {
        console.error("Failed to fetch booths:", err.message);
        showToastMessage("Failed to load booths: " + err.message, true);
      } finally {
        setIsBoothsLoading(false);
      }
    };
    if (submitOptions.wards.length > 0) {
      fetchBooths();
    } else {
      setBoothsByWard({});
    }
  }, [submitOptions.wards, submitOptions.targetBoothType]);

  const handleSurveyChange = (e) => {
    const { name, value } = e.target;
    setSurveyData({
      ...surveyData,
      [name]: value,
    });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion({
      ...currentQuestion,
      [name]: value,
    });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    });
  };

  const addOption = () => {
    if (currentQuestion.options.length < 8) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, ""],
      });
    }
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const updatedOptions = [...currentQuestion.options];
      updatedOptions.splice(index, 1);
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions,
      });
    }
  };

  const addOrUpdateQuestion = () => {
    if (
      currentQuestion.text.trim() === "" ||
      currentQuestion.options.some((opt) => opt.trim() === "") ||
      currentQuestion.options.length < 2
    ) {
      showToastMessage(
        "Please fill in all question fields and ensure at least 2 options",
        true
      );
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now(),
      question_id: editingQuestionIndex !== null
        ? surveyData.questions[editingQuestionIndex].question_id
        : surveyData.questions.length + 1,
    };
    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...surveyData.questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setSurveyData({
        ...surveyData,
        questions: updatedQuestions,
      });
      setEditingQuestionIndex(null);
      showToastMessage("Question updated successfully!");
    } else {
      setSurveyData({
        ...surveyData,
        questions: [...surveyData.questions, newQuestion],
      });
      showToastMessage("Question added successfully!");
    }

    setCurrentQuestion({
      text: "",
      type: "radio",
      options: ["", ""],
    });
  };

  const editQuestion = (index) => {
    setCurrentQuestion({ ...surveyData.questions[index] });
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = surveyData.questions.filter((_, i) => i !== index);
    const reindexedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      question_id: i + 1,
    }));
    setSurveyData({
      ...surveyData,
      questions: reindexedQuestions,
    });
    showToastMessage("Question deleted successfully!");
  };

  const saveDraft = async () => {
    if (surveyData.questions.length === 0) {
      showToastMessage("Please add at least one question before saving draft", true);
      return;
    }

    const payload = {
      user_id: sessionStorage.getItem("party_worker_id"),
      title: surveyData.title || "Untitled Survey",
      description: surveyData.description || "",
      questions: surveyData.questions.map((q, index) => ({
        question_text: q.text || q.question_text || "",
        question_type: q.type || q.question_type || "radio",
        options: q.options || [],
        question_id: q.question_id || index + 1,
      })),
      status: "Draft",
    };

    try {
      console.log("Saving draft with payload:", JSON.stringify(payload, null, 2));
      const res = await iConnect_create_survey_web(payload);
      if (res && res.status === "S") {
        showToastMessage("Draft saved successfully!");
        setTimeout(() => navigate("/survey-dashboard"), 1500);
      } else {
        showToastMessage(res.message || "Failed to save draft", true);
      }
    } catch (err) {
      console.error("saveDraft error:", err);
      showToastMessage("Network or server error while saving draft", true);
    }
  };

  const submitSurvey = () => {
    if (surveyData.questions.length === 0) {
      showToastMessage("Please add at least one question to submit", true);
      return;
    }
    setShowSubmitOptions(true);
  };

  const handleSubmitOptionsChange = (e) => {
    const { name, value } = e.target;
    console.log("handleSubmitOptionsChange:", { name, value });
    if (name === "targetBoothType" && !validBoothTypes.includes(value)) {
      console.warn("Invalid booth type selected:", value);
      showToastMessage(
        "Invalid Target Booth Type selected. Please choose Strong, Weak, Swing, or All.",
        true
      );
      return;
    }
    setSubmitOptions((prev) => ({
      ...prev,
      [name]: value,
      wards: [],
      selectAllWards: false,
    }));
    setBoothsByWard({});
  };

  const handleWardSelection = (wardId) => {
    setSubmitOptions((prev) => {
      const existingWard = prev.wards.find((w) => w.ward_id === wardId);
      let newWards;
      if (!existingWard) {
        newWards = [...prev.wards, { ward_id: wardId, booth_ids: [] }];
      } else {
        newWards = prev.wards;
      }
      return { ...prev, wards: newWards, selectAllWards: false };
    });
    setExpandedWard(wardId);
    setShowWardDropdown(false);
  };

  const removeWard = (wardId) => {
    setSubmitOptions((prev) => ({
      ...prev,
      wards: prev.wards.filter((w) => w.ward_id !== wardId),
    }));
    if (expandedWard === wardId) {
      setExpandedWard(null);
    }
  };

  const handleBoothToggle = (wardId, boothValue) => {
    const [boothId] = boothValue.split(" - ");
    setSubmitOptions((prev) => {
      const ward = prev.wards.find((w) => w.ward_id === wardId);
      let newBoothIds;
      if (ward.booth_ids[0] === "All") {
        newBoothIds = [boothId];
      } else if (ward.booth_ids.includes(boothId)) {
        newBoothIds = ward.booth_ids.filter((id) => id !== boothId);
      } else {
        newBoothIds = [...ward.booth_ids, boothId];
      }
      return {
        ...prev,
        wards: prev.wards.map((w) =>
          w.ward_id === wardId ? { ...w, booth_ids: newBoothIds } : w
        ),
        selectAllWards: false,
      };
    });
  };

  const handleSelectAllBooths = (wardId) => {
    setSubmitOptions((prev) => ({
      ...prev,
      wards: prev.wards.map((w) =>
        w.ward_id === wardId ? { ...w, booth_ids: ["All"] } : w
      ),
      selectAllWards: false,
    }));
  };

  const toggleSelectAllWards = () => {
    setSubmitOptions((prev) => {
      const selectAll = !prev.selectAllWards;
      return {
        ...prev,
        selectAllWards: selectAll,
        wards: selectAll
          ? wards.map((ward) => ({
              ward_id: ward.ward_id || ward.id,
              booth_ids: ["All"],
            }))
          : [],
      };
    });
    setExpandedWard(null);
  };

  const handleDateChange = (date) => {
    console.log("handleDateChange:", date ? date.toISOString() : null);
    const now = new Date();
    if (date && date <= now) {
      showToastMessage("Deadline must be in the future", true);
      return;
    }
    setSubmitOptions((prev) => ({
      ...prev,
      deadline: date,
    }));
  };

  const formatDateToMySQL = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      showToastMessage("Invalid deadline selected.", true);
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log("Formatted date:", formattedDate);
    return formattedDate;
  };

  const handleSubmitSurvey = async () => {
    if (
      !submitOptions.targetBoothType ||
      !validBoothTypes.includes(submitOptions.targetBoothType) ||
      !submitOptions.deadline ||
      (!submitOptions.selectAllWards &&
        submitOptions.wards.length === 0)
    ) {
      showToastMessage(
        "Please fill in all required fields: Target Booth Type, Deadline, and at least one Ward with valid Booth selection",
        true
      );
      return;
    }

    const now = new Date();
    if (submitOptions.deadline <= now) {
      showToastMessage("Deadline must be in the future", true);
      return;
    }

    const formattedBoothType =
      submitOptions.targetBoothType === "All" ? null : submitOptions.targetBoothType;
    const formattedDeadline = formatDateToMySQL(submitOptions.deadline);
    if (!formattedDeadline) {
      return;
    }

    const payload = {
      user_id: sessionStorage.getItem("party_worker_id"),
      title: surveyData.title || "Untitled Survey",
      description: surveyData.description || "",
      questions: surveyData.questions.map((q, index) => ({
        question_text: q.text || q.question_text || "",
        question_type: q.type || q.question_type || "radio",
        options: q.options || [],
        question_id: q.question_id || index + 1,
      })),
      status: "Pending",
      target_booth_type: formattedBoothType,
      deadline: formattedDeadline,
      wards: submitOptions.selectAllWards
        ? wards.map((ward) => ({
            ward_id: ward.ward_id || ward.id,
            booth_ids: ["All"],
          }))
        : submitOptions.wards,
    };

    try {
      console.log("Frontend payload before API call:", JSON.stringify(payload, null, 2));
      const res = await iConnect_create_survey_web(payload);
      if (res && res.status === "S") {
        showToastMessage(
          `Survey Created Successfully. Eligible Workers: ${
            res.eligible_worker_count || 0
          } (${res.eligible_worker_names || "None"})`
        );
        setTimeout(() => navigate("/survey-dashboard"), 1500);
      } else {
        showToastMessage(res.message || "Failed to submit survey", true);
      }
    } catch (err) {
      console.error("handleSubmitSurvey error:", err);
      showToastMessage("Network or server error while submitting survey", true);
    }
    setShowSubmitOptions(false);
  };

  const showToastMessage = (message, isError = false) => {
    setShowToast({ show: true, message, isError });
    setTimeout(() => {
      setShowToast({ show: false, message: "", isError: false });
    }, 3000);
  };

  const Toast = ({ message, show, isError }) => (
    <div
      className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50 ${
        show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      } ${isError ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
    >
      <div className="flex items-center">
        <span className="material-icons-outlined mr-2">
          {isError ? "error" : "check_circle"}
        </span>
        {message}
      </div>
    </div>
  );

  const WardItem = ({ ward, isExpanded, onToggle, onRemove, onSelectAllBooths, onBoothToggle }) => (
    <div className="border border-gray-200 rounded-lg mb-2 bg-white shadow-sm">
      <div
        className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => onToggle(ward.ward_id)}
      >
        <div className="flex items-center">
          <span className="material-icons-outlined mr-2 text-gray-600">
            {isExpanded ? "expand_less" : "expand_more"}
          </span>
          <span className="font-medium">
            {ward.name || ward.ward_name || `Ward ${ward.ward_id || ward.id}`}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(ward.ward_id);
          }}
          className="text-red-500 hover:text-red-700"
        >
          <span className="material-icons-outlined">delete</span>
        </button>
      </div>
      {isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => onSelectAllBooths(ward.ward_id)}
            className={`text-blue-600 hover:text-blue-800 mb-2 ${
              submitOptions.wards.find((w) => w.ward_id === ward.ward_id)?.booth_ids[0] === "All"
                ? "font-bold"
                : ""
            }`}
          >
            Select All Booths
          </button>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {isBoothsLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : (boothsByWard[ward.ward_id] || []).length === 0 ? (
              <p className="text-gray-500">No booths available for this ward.</p>
            ) : (
              (boothsByWard[ward.ward_id] || []).map((booth) => {
                const boothValue = `${booth.booth_id} - ${booth.booth_name || `Booth ${booth.booth_id}`} - ${booth.booth_address || "No Address"}`;
                return (
                  <div key={booth.booth_id || booth.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={submitOptions.wards
                        .find((w) => w.ward_id === ward.ward_id)
                        ?.booth_ids.includes(booth.booth_id || booth.id)}
                      onChange={() => onBoothToggle(ward.ward_id, boothValue)}
                      disabled={
                        submitOptions.wards.find((w) => w.ward_id === ward.ward_id)?.booth_ids[0] ===
                        "All"
                      }
                      className="custom-checkbox mr-2"
                    />
                    <span>
                      {`${booth.booth_id} - ${booth.booth_name || `Booth ${booth.booth_id}`} - ${booth.booth_address || "No Address"} (${booth.booth_type || "—"})`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  const SubmitOptionsModal = ({
    show,
    onClose,
    onSubmit,
    wards,
    submitOptions,
    setSubmitOptions,
    isWardsLoading,
    boothsByWard,
    isBoothsLoading,
    expandedWard,
    setExpandedWard,
    showWardDropdown,
    setShowWardDropdown,
    handleWardSelection,
    removeWard,
    handleSelectAllBooths,
    handleBoothToggle,
    toggleSelectAllWards,
    handleSubmitOptionsChange,
    handleDateChange,
  }) => {
    if (!show) return null;

    const currentYear = new Date().getFullYear();
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 1);
    const maxDate = new Date(currentYear + 5, 11, 31, 23, 59, 59);

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-gray-500/50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
            Submit Survey Options
          </h2>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="targetBoothType"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Target Booth Type
              </label>
              <select
                id="targetBoothType"
                name="targetBoothType"
                value={submitOptions.targetBoothType}
                onChange={handleSubmitOptionsChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="All">All Booths</option>
                <option value="Strong">Strong Booths</option>
                <option value="Weak">Weak Booths</option>
                <option value="Swing">Swing Booths</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="deadline"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
              >
                Deadline
              </label>
              <DatePicker
                selected={submitOptions.deadline}
                onChange={handleDateChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd HH:mm"
                minDate={minDate}
                maxDate={maxDate}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholderText="Select date and time"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Wards and Booths
              </label>
              {isWardsLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                </div>
              ) : wards.length === 0 ? (
                <p className="text-red-500">No wards available. Please contact support.</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-100 p-3 rounded-md">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={submitOptions.selectAllWards}
                        onChange={toggleSelectAllWards}
                        className="custom-checkbox mr-2"
                        disabled={wards.length === 0}
                      />
                      <span className="font-medium">Select All Wards</span>
                      <span className="ml-2 text-sm text-gray-500">
                        (Includes all booths in all wards)
                      </span>
                    </div>
                    <button
                      onClick={() => setShowWardDropdown(!showWardDropdown)}
                      className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <span className="material-icons-outlined mr-1">add</span>
                      {submitOptions.wards.length === 0 ? "Add Ward" : "Add Another Ward"}
                    </button>
                  </div>
                  {showWardDropdown && (
                    <div className="relative">
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {wards
                          .filter(
                            (ward) =>
                              !submitOptions.wards.some(
                                (w) => w.ward_id === (ward.ward_id || ward.id)
                              )
                          )
                          .map((ward) => (
                            <div
                              key={ward.ward_id || ward.id}
                              onClick={() => handleWardSelection(ward.ward_id || ward.id)}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {ward.name ||
                                ward.ward_name ||
                                `Ward ${ward.ward_id || ward.id}`}
                            </div>
                          ))}
                        {wards.filter(
                          (ward) =>
                            !submitOptions.wards.some(
                              (w) => w.ward_id === (ward.ward_id || ward.id)
                            )
                        ).length === 0 && (
                          <div className="p-2 text-gray-500">No more wards available</div>
                        )}
                      </div>
                    </div>
                  )}
                  {submitOptions.selectAllWards ? (
                    <div className="bg-gray-100 p-3 rounded-md">
                      <p className="font-medium">All Wards Selected</p>
                      <p className="text-sm text-gray-600">All booths in all wards are included.</p>
                    </div>
                  ) : submitOptions.wards.length > 0 ? (
                    <div className="space-y-2">
                      {submitOptions.wards.map((ward) => (
                        <WardItem
                          key={ward.ward_id}
                          ward={wards.find((w) => (w.ward_id || w.id) === ward.ward_id)}
                          isExpanded={expandedWard === ward.ward_id}
                          onToggle={(wardId) =>
                            setExpandedWard(expandedWard === wardId ? null : wardId)
                          }
                          onRemove={removeWard}
                          onSelectAllBooths={handleSelectAllBooths}
                          onBoothToggle={handleBoothToggle}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No wards selected</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={
                  !submitOptions.targetBoothType ||
                  !validBoothTypes.includes(submitOptions.targetBoothType) ||
                  !submitOptions.deadline ||
                  (!submitOptions.selectAllWards &&
                    submitOptions.wards.length === 0)
                }
              >
                Submit Survey
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main page layout
  return (
    <div className="pt-0 px-8">
      <style>
        {`
          .custom-checkbox {
            appearance: none;
            width: 18px !important;
            height: 18px !important;
            border: 2px solid #6b7280;
            border-radius: 0 !important;
            background-color: white;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            position: relative;
            box-sizing: border-box;
            vertical-align: middle;
            margin: 0 !important;
            padding: 0 !important;
            margin-right: 8px !important;
          }
          .custom-checkbox:checked {
            background-color: #2563eb;
            border-color: #2563eb;
          }
          .custom-checkbox:checked::after {
            content: '\\u2713';
            font-size: 12px;
            font-weight: bold;
            color: white;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          .custom-checkbox:hover {
            border-color: #3b82f6;
          }
          .custom-checkbox:disabled {
            background-color: #e5e7eb;
            border-color: #d1d5db;
            cursor: not-allowed;
          }
        `}
      </style>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Create Survey</h1>
          <p className="text-sm text-[var(--text-secondary)]">Build questions and configure target audience</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            type="button"
            onClick={saveDraft}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
          >
            <span className="material-icons-outlined mr-2 text-base">save</span>
            <span className="align-middle">Save Draft</span>
          </button>
          <button
            type="button"
            onClick={submitSurvey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <span className="material-icons-outlined mr-2 text-base">send</span>
            <span className="align-middle">Submit Survey</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Survey Details */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Survey Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Survey Name</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={surveyData.title}
                  onChange={handleSurveyChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                  placeholder="Enter survey name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description / Objective</label>
                <textarea
                  id="description"
                  name="description"
                  value={surveyData.description}
                  onChange={handleSurveyChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                  placeholder="Describe the purpose of this survey"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Add/Edit Question Form */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">{editingQuestionIndex !== null ? "Edit Question" : "Add New Question"}</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="questionText" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Text</label>
                <input
                  type="text"
                  id="questionText"
                  name="text"
                  value={currentQuestion.text}
                  onChange={handleQuestionChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                  placeholder="Enter your question"
                />
              </div>
              <div>
                <label htmlFor="questionType" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Type</label>
                <select
                  id="questionType"
                  name="type"
                  value={currentQuestion.type}
                  onChange={handleQuestionChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                >
                  <option value="radio">Single Choice (Radio)</option>
                  <option value="checkbox">Multiple Choice (Checkbox)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Options ({currentQuestion.options.length}/8)</label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className={`${currentQuestion.options.length <= 2 ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:text-red-700"} ml-2 p-2`}
                      disabled={currentQuestion.options.length <= 2}
                    >
                      <span className="material-icons-outlined">delete</span>
                    </button>
                  </div>
                ))}
                {currentQuestion.options.length < 8 && (
                  <button type="button" onClick={addOption} className="mt-3 flex items-center text-blue-600 hover:text-blue-800">
                    <span className="material-icons-outlined mr-1">add_circle</span>
                    Add Option
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addOrUpdateQuestion}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <span className="material-icons-outlined mr-2 text-base">add</span>
                  <span className="align-middle">{editingQuestionIndex !== null ? "Update Question" : "Add Question"}</span>
                </button>
                {editingQuestionIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentQuestion({ text: "", type: "radio", options: ["", ""], question_id: null });
                      setEditingQuestionIndex(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <span className="material-icons-outlined mr-2 text-base">cancel</span>
                    <span className="align-middle">Cancel Edit</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
              Questions ({surveyData.questions.length})
            </h2>
            {surveyData.questions.length > 0 ? (
              <div className="space-y-4 mb-6">
                {surveyData.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">
                        {index + 1}. {question.text || "Untitled Question"}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editQuestion(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <span className="material-icons-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <span className="material-icons-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Type: {question.type === "radio" ? "Single Choice" : "Multiple Choice"}
                    </p>
                    <ul className="list-disc pl-5">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className="text-sm">
                          {option || `Option ${optIndex + 1}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">No questions added yet</p>
            )}
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Live Preview ({surveyData.questions.length})</h2>
            {surveyData.questions.length > 0 ? (
              <div className="space-y-4">
                {surveyData.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium">{index + 1}. {question.text || "Untitled Question"}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Type: {question.type === "radio" ? "Single Choice" : "Multiple Choice"}</p>
                    <ul className="list-disc pl-5">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className="text-sm">{option || `Option ${optIndex + 1}`}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions added yet</p>
            )}
            {/* Mobile actions */}
            <div className="mt-6 flex md:hidden justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/survey-preview", { state: { surveyData, editable: true } })}
                className="px-4 py-2 border border-gray-300 rounded-lg text-[var(--text-primary)] hover:bg-gray-50"
              >
                Preview & Edit
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={submitSurvey}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Survey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={showToast.message}
        show={showToast.show}
        isError={showToast.isError}
      />

      {/* Submit Options Modal */}
      <SubmitOptionsModal
        show={showSubmitOptions}
        onClose={() => setShowSubmitOptions(false)}
        onSubmit={handleSubmitSurvey}
        wards={wards}
        submitOptions={submitOptions}
        setSubmitOptions={setSubmitOptions}
        isWardsLoading={isWardsLoading}
        boothsByWard={boothsByWard}
        isBoothsLoading={isBoothsLoading}
        expandedWard={expandedWard}
        setExpandedWard={setExpandedWard}
        showWardDropdown={showWardDropdown}
        setShowWardDropdown={setShowWardDropdown}
        handleWardSelection={handleWardSelection}
        removeWard={removeWard}
        handleSelectAllBooths={handleSelectAllBooths}
        handleBoothToggle={handleBoothToggle}
        toggleSelectAllWards={toggleSelectAllWards}
        handleSubmitOptionsChange={handleSubmitOptionsChange}
        handleDateChange={handleDateChange}
      />
    </div>
  );
};

export default CreateSurveyPage;