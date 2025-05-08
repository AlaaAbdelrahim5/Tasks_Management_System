import React from "react";

const ProjectSidebar = ({ project, onClose, onDelete, darkMode }) => {
  if (!project) return null;

  const getProgress = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start) || isNaN(end)) return 0;
    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const progress = getProgress(project.startDate, project.endDate);

  return (
    <div
      className={`fixed top-16 right-0 w-full sm:w-80 h-[calc(100vh-64px)] border-l shadow-lg z-50 overflow-y-auto p-4 ${
        darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
      }`}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center mb-4 pb-2 ${
          darkMode ? "border-gray-600" : "border-gray-300"
        } border-b`}
      >
        <h2
          className={`text-lg sm:text-xl font-semibold ${
            darkMode ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {project.title}
        </h2>
        <button
          onClick={onClose}
          className={`text-lg sm:text-xl font-bold hover:text-red-700 ${
            darkMode ? "text-red-500" : "text-red-600"
          }`}
        >
          ×
        </button>
      </div>

      {/* Project Details */}
      <div
        className={`space-y-3 text-sm ${
          darkMode ? "text-gray-300" : "text-gray-700"
        }`}
      >
        <p>
          <strong className={darkMode ? "text-white" : ""}>Description:</strong>{" "}
          {project.description}
        </p>
        <p>
          <strong className={darkMode ? "text-white" : ""}>Category:</strong>{" "}
          {project.category}
        </p>
        <p>
          <strong className={darkMode ? "text-white" : ""}>Status:</strong>
          <span
            className={`ml-1 font-medium ${
              project.status === "Completed"
                ? "text-green-500"
                : project.status === "In Progress"
                ? "text-yellow-500"
                : project.status === "On Hold"
                ? "text-orange-500"
                : "text-red-500"
            }`}
          >
            {project.status}
          </span>
        </p>
        <p>
          <strong className={darkMode ? "text-white" : ""}>Start Date:</strong>{" "}
          {project.startDate}
        </p>
        <p>
          <strong className={darkMode ? "text-white" : ""}>End Date:</strong>{" "}
          {project.endDate}
        </p>
        <p>
          <strong className={darkMode ? "text-white" : ""}>Progress:</strong>{" "}
          {progress}%
        </p>

        <div
          className={`h-2 rounded ${
            darkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <div
            className={`h-2 rounded ${
              progress < 30
                ? "bg-red-500"
                : progress < 70
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div>
          <strong className={darkMode ? "text-white" : ""}>Students:</strong>
          <ul className="list-disc ml-5 mt-1">
            {project.students.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onDelete(project.id)}
          className={`w-full py-2 rounded mt-2 font-medium ${
            darkMode
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProjectSidebar;
