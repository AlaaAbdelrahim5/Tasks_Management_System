import React, { useState, useContext } from "react";
import { ThemeContext } from "../App";
import { FaProjectDiagram, FaTasks, FaRegCalendarAlt, FaUserAlt, FaClock } from "react-icons/fa";

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
  };
  
  const formBg = darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-800 border-gray-100";
  const fieldBg = darkMode
    ? "bg-gray-700 border-gray-600 placeholder-gray-300 text-white"
    : "bg-gray-50 border-gray-200 placeholder-gray-500 text-gray-800";
  const labelColor = darkMode ? "text-gray-300" : "text-gray-600";
  const accentColor = "blue";  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-md p-1 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl">
        <form
          onSubmit={handleSubmit}
          className={`p-6 rounded-xl shadow-xl w-full ${formBg} transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold text-center mb-6">
            Create New Task
            <div className="mt-2 w-20 h-1 bg-blue-500 mx-auto rounded-full" />
          </h2>

          <div className="space-y-5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaProjectDiagram />
              </div>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleChange}
                placeholder="Enter project name..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Project</label>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaTasks />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter task name..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Task Name</label>
            </div>
              <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none text-blue-500">
                <FaRegCalendarAlt />
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the task..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Description</label>
            </div>          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
              <FaUserAlt />
            </div>
            <input
              type="text"
              name="student"
              value={formData.assignedStudents[0] || ""}
              onChange={handleChange}
              placeholder="Enter student username..."
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
            />
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Assigned Student</label>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
              <FaClock />
            </div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
            >
              <option>In Progress</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Status</label>
          </div>          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
              <FaRegCalendarAlt />
            </div>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
            />
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Due Date</label>
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
