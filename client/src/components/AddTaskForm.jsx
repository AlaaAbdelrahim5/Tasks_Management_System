import React, { useState } from "react";

const AddTaskForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    assignedStudents: [""], // updated from 'student'
    status: "In Progress",
    dueDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "student") {
      // single student as array
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/90 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <h2 className="text-2xl font-bold text-center mb-8 text-slate-700">
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
              <label className="block mb-2 text-sm text-slate-600 font-medium">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  rows="4"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              ) : (
                <input
                  type="text"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}

          <div>
            <label className="block mb-2 text-sm text-slate-600 font-medium">
              Assigned Student
            </label>
            <input
              type="text"
              name="student"
              value={formData.assignedStudents[0] || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="Enter student username..."
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-600 font-medium">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              <option>In Progress</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm text-slate-600 font-medium">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTaskForm;
