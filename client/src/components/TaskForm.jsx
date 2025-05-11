import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../App";
import { FaProjectDiagram, FaTasks, FaRegCalendarAlt, FaUserAlt, FaClock } from "react-icons/fa";

const TaskForm = ({
  show,
  projects,
  students,
  initialData,
  onFieldChange,
  onProjectChange,
  onSave,
  onClose,
}) => {
  const { darkMode } = useContext(ThemeContext);
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  if (!show) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    onFieldChange(name, value);
    if (name === "project") {
      const proj = projects.find(p => p.title === value);
      if (proj) onProjectChange(proj.id);
    }
  };

  const submit = e => {
    e.preventDefault();
    onSave(data);
  };
  
  const formBg = darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800";
  const fieldBg = darkMode
    ? "bg-gray-700 border-gray-600 placeholder-gray-300 text-white"
    : "bg-gray-50 border-gray-200 placeholder-gray-500 text-gray-800";
  const accentColor = darkMode ? "blue-400" : "blue-600";
  const labelColor = darkMode ? "text-gray-300" : "text-gray-600";  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-full max-w-lg p-1 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
        <form
          onSubmit={submit}
          className={`p-6 rounded-xl shadow-lg w-full ${formBg} transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">
            {data.taskId ? "Edit Task" : "Create New Task"}
            <div className={`h-1 w-16 bg-${accentColor} mx-auto mt-2 rounded-full`}></div>
          </h2>

          <div className="space-y-4">
            <div className="relative">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-${accentColor}`}>
                <FaProjectDiagram />
              </div>
              <select
                name="project"
                value={data.project}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all`}
                required        >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.title}>
                  {p.title}
                </option>
              ))}
            </select>
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Project</label>
          </div>

          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-${accentColor}`}>
              <FaTasks />
            </div>
            <input
              name="name"
              type="text"
              value={data.name}
              onChange={handleChange}
              placeholder="Enter task name"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all`}
              required
            />
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Task Name</label>
          </div>

          <div className="relative">
            <textarea
              name="description"
              value={data.description}
              onChange={handleChange}
              placeholder="Provide task details..."
              className={`w-full p-4 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all min-h-[100px]`}
            />
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Description</label>
          </div>

          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-${accentColor}`}>
              <FaUserAlt />
            </div>
            <select
              name="assignedStudent"
              value={data.assignedStudent}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all`}
              required
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.username} value={s.username}>
                  {s.username}
                </option>
              ))}
            </select>
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Assigned To</label>
          </div>

          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-${accentColor}`}>
              <FaClock />
            </div>
            <select
              name="status"
              value={data.status}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all`}
            >
              {["In Progress", "Completed", "Pending", "On Hold", "Cancelled"].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Status</label>
          </div>

          <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-${accentColor}`}>
              <FaRegCalendarAlt />
            </div>
            <input
              name="dueDate"
              type="date"
              value={data.dueDate}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor} focus:border-transparent transition-all`}
              required
            />
            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Due Date</label>
          </div>
          </div>

          <div className="flex justify-end items-center gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-lg font-medium border-2 ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-100"} transition-all duration-200`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200`}
            >
              {data.taskId ? "Update Task" : "Add Task"}
            </button>
          </div>      </form>
      </div>
    </div>
  );
};

export default TaskForm;
