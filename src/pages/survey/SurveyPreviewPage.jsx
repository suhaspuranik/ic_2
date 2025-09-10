import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { iConnect_create_survey_web } from "../../apis/SurveyApis";

const SurveyPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const surveyData = location.state?.surveyData || {
    name: "",
    description: "",
    questions: [],
  };
  const editable = !!location.state?.editable;

  const [localSurveyData, setLocalSurveyData] = useState(surveyData);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [newQuestion, setNewQuestion] = useState({ text: "", type: "radio", options: ["", ""] });

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const ts = Date.parse(dateStr);
    if (Number.isNaN(ts)) return dateStr;
    return new Date(ts).toLocaleDateString();
  };

  // Debug: Log survey data to verify questions
  useEffect(() => {
    console.log("localSurveyData:", localSurveyData);
  }, [localSurveyData]);

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const toggleQuestionExpansion = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const editQuestion = (question) => {
    setEditingQuestion({ ...question });
    setExpandedQuestions(new Set([question.id]));
  };

  const saveEditedQuestion = () => {
    if (
      editingQuestion.text.trim() === "" ||
      editingQuestion.options.some((opt) => opt.trim() === "") ||
      editingQuestion.options.length < 2
    ) {
      showToastMessage(
        "Please fill in all question fields and ensure at least 2 options"
      );
      return;
    }

    setLocalSurveyData({
      ...localSurveyData,
      questions: localSurveyData.questions.map((q) =>
        q.id === editingQuestion.id ? editingQuestion : q
      ),
    });

    setEditingQuestion(null);
    showToastMessage("Question updated successfully!");
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
  };

  const removeQuestion = (id) => {
    setLocalSurveyData({
      ...localSurveyData,
      questions: localSurveyData.questions.filter((q) => q.id !== id),
    });
    setEditingQuestion(null);
    showToastMessage("Question removed successfully!");
  };

  const addOption = () => {
    if (editingQuestion.options.length < 8) {
      setEditingQuestion({
        ...editingQuestion,
        options: [...editingQuestion.options, ""],
      });
    }
  };

  const removeOption = (index) => {
    if (editingQuestion.options.length > 2) {
      const newOptions = editingQuestion.options.filter((_, i) => i !== index);
      setEditingQuestion({
        ...editingQuestion,
        options: newOptions,
      });
    }
  };

  const handleNewQuestionChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewOptionChange = (index, value) => {
    const options = [...newQuestion.options];
    options[index] = value;
    setNewQuestion((prev) => ({ ...prev, options }));
  };

  const addNewOption = () => {
    if (newQuestion.options.length < 8) {
      setNewQuestion((prev) => ({ ...prev, options: [...prev.options, ""] }));
    }
  };

  const removeNewOption = (index) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
    }
  };

  const addNewQuestionToSurvey = () => {
    if (
      newQuestion.text.trim() === "" ||
      newQuestion.options.some((opt) => opt.trim() === "") ||
      newQuestion.options.length < 2
    ) {
      showToastMessage("Please fill in question and at least two options");
      return;
    }
    const q = {
      id: Date.now(),
      text: newQuestion.text,
      type: newQuestion.type,
      options: [...newQuestion.options],
    };
    setLocalSurveyData((prev) => ({ ...prev, questions: [...prev.questions, q] }));
    setNewQuestion({ text: "", type: "radio", options: ["", ""] });
    showToastMessage("Question added");
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...editingQuestion.options];
    newOptions[index] = value;
    setEditingQuestion({
      ...editingQuestion,
      options: newOptions,
    });
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setEditingQuestion({
      ...editingQuestion,
      [name]: value,
    });
  };

  const saveSurvey = async () => {
    if (
      localSurveyData.name.trim() === "" ||
      localSurveyData.description.trim() === ""
    ) {
      showToastMessage("Please fill in survey name and description");
      return;
    }

    if (localSurveyData.questions.length === 0) {
      showToastMessage("Please add at least one question");
      return;
    }

    const payload = {
      party_worker_id: sessionStorage.getItem("party_worker_id") || "0",
      title: localSurveyData.name || "Untitled Survey",
      description: localSurveyData.description || "",
      questions: localSurveyData.questions.map((q) => ({
        question_text: q.text || q.question_text || "",
        question_type: q.type || q.question_type || "radio",
        options: q.options || [],
      })),
      status: "Draft",
    };

    try {
      console.log("Saving draft with payload:", payload);
      const res = await iConnect_create_survey_web(payload);
      if (res && res.success) {
        showToastMessage("Draft saved successfully");
        setTimeout(() => navigate("/survey-dashboard"), 2000);
      } else {
        showToastMessage(res.message || "Failed to save draft");
      }
    } catch (err) {
      console.error("saveSurvey error:", err);
      showToastMessage("Network or server error while saving draft");
    }
  };

  // Submit removed in preview

  // Toast component
  const Toast = ({ message, show }) => (
    <div
      className={`fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50 ${
        show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="flex items-center">
        <span className="material-icons-outlined mr-2">check_circle</span>
        {message}
      </div>
    </div>
  );

  return (
    <div className="pt-0 px-8">
      {/* Survey Details */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Survey Preview
        </h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              {localSurveyData.name}
            </h3>
            <p className="text-blue-700">{localSurveyData.description}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-[var(--text-secondary)]">Created Date</p>
              <p className="text-base font-medium text-[var(--text-primary)]">
                {formatDate(localSurveyData.createdDate)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-[var(--text-secondary)]">Deadline</p>
              <p className="text-base font-medium text-[var(--text-primary)]">
                {formatDate(localSurveyData.deadline)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-[var(--text-secondary)]">Target Booth</p>
              <p className="text-base font-medium text-[var(--text-primary)]">
                {localSurveyData.targetBooth || "-"}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-[var(--text-secondary)]">Status</p>
              <p className="text-base font-medium text-[var(--text-primary)]">
                {localSurveyData.status || "-"}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-[var(--text-secondary)]">Responses</p>
              <p className="text-base font-medium text-[var(--text-primary)]">
                {typeof localSurveyData.eligible === "number" && localSurveyData.eligible > 0
                  ? `${localSurveyData.responses ?? 0}/${localSurveyData.eligible}`
                  : `${localSurveyData.responses ?? 0}/${localSurveyData.eligible ?? 0}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Management */}
      {localSurveyData.questions.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
            Survey Questions ({localSurveyData.questions.length})
          </h2>
          <div className="space-y-4">
            {localSurveyData.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center flex-1">
                    <button
                      onClick={() => toggleQuestionExpansion(question.id)}
                      className="p-1 text-gray-500 hover:text-gray-700 mr-2"
                    >
                      <span className="material-icons-outlined">
                        {expandedQuestions.has(question.id)
                          ? "expand_less"
                          : "expand_more"}
                      </span>
                    </button>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      {qIndex + 1}. {question.text}
                    </h3>
                  </div>
                  {editable && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editQuestion(question)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <span className="material-icons-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <span className="material-icons-outlined">delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {expandedQuestions.has(question.id) && !editingQuestion && (
                  <>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      Type:{" "}
                      {question.type === "radio"
                        ? "Single Choice"
                        : "Multiple Choice"}
                    </p>
                    <div className="pl-4">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center mb-1">
                          <span className="material-icons-outlined text-gray-400 mr-2">
                            {question.type === "radio"
                              ? "radio_button_unchecked"
                              : "check_box_outline_blank"}
                          </span>
                          <span className="text-[var(--text-secondary)]">
                            {option}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {editingQuestion && editingQuestion.id === question.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                          Question Text
                        </label>
                        <input
                          type="text"
                          name="text"
                          value={editingQuestion.text}
                          onChange={handleQuestionChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                          placeholder="Enter your question"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                          Question Type
                        </label>
                        <select
                          name="type"
                          value={editingQuestion.type}
                          onChange={handleQuestionChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                        >
                          <option value="radio">Single Choice (Radio)</option>
                          <option value="checkbox">
                            Multiple Choice (Checkbox)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                          Options (2-8 allowed)
                        </label>
                        <div className="space-y-2">
                          {editingQuestion.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="text"
                                value={option}
                                onChange={(e) =>
                                  handleOptionChange(index, e.target.value)
                                }
                                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                                placeholder={`Option ${index + 1}`}
                              />
                              {editingQuestion.options.length > 2 && (
                                <button
                                  onClick={() => removeOption(index)}
                                  className="p-2 text-red-500 hover:text-red-700"
                                >
                                  <span className="material-icons-outlined">
                                    remove
                                  </span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {editingQuestion.options.length < 8 && (
                          <button
                            onClick={addOption}
                            className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <span className="material-icons-outlined mr-1">
                              add
                            </span>
                            Add Option
                          </button>
                        )}
                      </div>
                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={saveEditedQuestion}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editable && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Add New Question</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Text</label>
              <input
                type="text"
                name="text"
                value={newQuestion.text}
                onChange={handleNewQuestionChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                placeholder="Enter your question"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Question Type</label>
              <select
                name="type"
                value={newQuestion.type}
                onChange={handleNewQuestionChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
              >
                <option value="radio">Single Choice (Radio)</option>
                <option value="checkbox">Multiple Choice (Checkbox)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Options ({newQuestion.options.length}/8)</label>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleNewOptionChange(idx, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900"
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeNewOption(idx)}
                    className={`${newQuestion.options.length <= 2 ? "text-gray-400 cursor-not-allowed" : "text-red-500 hover:text-red-700"} ml-2 p-2`}
                    disabled={newQuestion.options.length <= 2}
                  >
                    <span className="material-icons-outlined">delete</span>
                  </button>
                </div>
              ))}
              {newQuestion.options.length < 8 && (
                <button type="button" onClick={addNewOption} className="mt-2 flex items-center text-blue-600 hover:text-blue-800">
                  <span className="material-icons-outlined mr-1">add_circle</span>
                  Add Option
                </button>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={addNewQuestionToSurvey}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - editing limited to this page; no return to create for edits */}
      {editable ? (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex justify-end items-center space-x-3">
            <button
              onClick={saveSurvey}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Save as Draft
            </button>
            {/* Submit removed in preview */}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex justify-between items-center">
            <div />
            <button
              onClick={() => navigate("/survey-dashboard")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast message={toastMessage} show={showToast} />
      {/* No submit modal in preview */}
    </div>
  );
};

export default SurveyPreviewPage;