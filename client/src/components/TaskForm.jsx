import React, { useEffect, useState } from "react";

const TaskForm = ({
  show,
  darkMode,
  projects,
  students,
  initialData,
  onFieldChange,
  onProjectChange,
  onSave,
  onClose,
}) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={submit}
        className={`p-6 rounded-lg shadow-lg w-full max-w-md ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4 text-center">
          {data.taskId ? "Edit Task" : "Create New Task"}
        </h2>

        <select
          name="project"
          value={data.project}
          onChange={handleChange}
          className="w-full p-2 mb-3 rounded"
          required
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.title}>
              {p.title}
            </option>
          ))}
        </select>

        <input
          name="name"
          type="text"
          value={data.name}
          onChange={handleChange}
          placeholder="Task Name"
          className="w-full mb-3 p-2 rounded"
          required
        />

        <textarea
          name="description"
          value={data.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full mb-3 p-2 rounded"
        />

        <select
          name="assignedStudent"
          value={data.assignedStudent}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded"
          required
        >
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s.username} value={s.username}>
              {s.username}
            </option>
          ))}
        </select>

        <select
          name="status"
          value={data.status}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded"
        >
          {["In Progress", "Completed", "Pending", "On Hold", "Cancelled"].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <input
          name="dueDate"
          type="date"
          value={data.dueDate}
          onChange={handleChange}
          className="w-full mb-4 p-2 rounded"
          required
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-red-500 text-white"
          >
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">
            {data.taskId ? "Update" : "Add"} Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
