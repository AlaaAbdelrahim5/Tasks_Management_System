import React, { useState, useContext } from "react";
import { ThemeContext } from "../App";

const AddTaskForm = ({ onClose, onSubmit }) => {
  const { darkMode } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    assignedStudents: [""],
    status: "In Progress",
    dueDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "student") {
      setFormData((prev) => ({ ...prev, assignedStudents: [value] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };  // Use only form styling, no background overlay
  const formBg = darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-800 border-gray-100";
  const fieldBg = darkMode
    ? "bg-gray-700 border-gray-600 placeholder-gray-300 text-gray-100"
    : "bg-gray-50 border-gray-200 placeholder-gray-600 text-gray-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'transparent' }}>
      <form
        onSubmit={handleSubmit}
        className={`p-8 rounded-2xl shadow-xl w-full max-w-md border ${formBg} transition-colors`}
      >
        <h2 className="text-2xl font-bold text-center mb-8">
          Create New Task
          <div className="mt-2 w-12 h-1 bg-blue-500 mx-auto rounded-full" />
        </h2>

        <div className="space-y-5">
          {[
            { label: "Project", name: "project", type: "text" },
            { label: "Task Name", name: "name", type: "text" },
            { label: "Description", name: "description", type: "textarea" },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  rows="4"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-100"} transition-all`}
                />
              ) : (
                <input
                  type="text"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-100"} transition-all`}
                />
              )}
            </div>
          ))}

          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Assigned Student
            </label>
            <input
              type="text"
              name="student"
              value={formData.assignedStudents[0] || ""}
              onChange={handleChange}
              placeholder="Enter student username..."
              className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-100"} transition-all`}
            />
          </div>

          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-100"} transition-all`}
            >
              <option>In Progress</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div>
            <label className={`block mb-2 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-100"} transition-all`}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTaskForm;
