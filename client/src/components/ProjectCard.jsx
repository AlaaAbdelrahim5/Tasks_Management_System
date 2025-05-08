import React from "react";

const ProjectCard = ({ project, darkMode }) => {
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

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "-";

  return (
    <div
    className={`p-4 rounded-lg shadow border transform transition-all duration-300 cursor-pointer
      ${darkMode
        ? "bg-gray-800 border-gray-600 hover:bg-gray-700 hover:shadow-blue-500/50"
        : "bg-white border-gray-300 hover:bg-gray-100 hover:shadow-lg hover:shadow-blue-300/50"
      }
      hover:scale-[1.02]
    `}
    >
      <h3
        className={`text-lg font-bold mb-2 ${
          darkMode ? "text-blue-400" : "text-blue-700"
        }`}
      >
        {project.title}
      </h3>

      <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
        <span className="font-semibold">Description:</span> {project.description}
      </p>

      <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
        <span className="font-semibold">Students:</span>{" "}
        {project.students?.join(", ") || "-"}
      </p>

      <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-2`}>
        <span className="font-semibold">Category:</span> {project.category}
      </p>

      <div className="w-full h-5 bg-gray-300 dark:bg-gray-700 rounded mt-2 mb-1 overflow-hidden">
        <div
          className="h-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center"
          style={{ width: `${progress}%` }}
        >
          {progress}%
        </div>
      </div>

      <div
        className={`flex justify-between text-sm font-medium ${
          darkMode ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <span>{formatDate(project.startDate)}</span>
        <span>{formatDate(project.endDate)}</span>
      </div>
    </div>
  );
};

export default ProjectCard;
