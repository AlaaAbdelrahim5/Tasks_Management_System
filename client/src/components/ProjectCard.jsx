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
  
  // Determine status color
  const getStatusColor = (status) => {
    const statusColors = {
      "Completed": darkMode ? "from-green-600 to-green-400" : "from-green-600 to-green-400",
      "In Progress": darkMode ? "from-blue-600 to-blue-400" : "from-blue-600 to-blue-400",
      "Pending": darkMode ? "from-yellow-600 to-yellow-400" : "from-yellow-600 to-yellow-400",
      "On Hold": darkMode ? "from-orange-600 to-orange-400" : "from-orange-600 to-orange-400",
      "Cancelled": darkMode ? "from-red-600 to-red-400" : "from-red-600 to-red-400"
    };
    return statusColors[status] || (darkMode ? "from-gray-600 to-gray-400" : "from-gray-600 to-gray-400");
  };
  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg border transform transition-all duration-300 cursor-pointer h-full flex flex-col
        ${darkMode
          ? "bg-gray-800 border-gray-700 hover:shadow-blue-500/20 hover:border-blue-400"
          : "bg-white border-gray-200 hover:shadow-xl hover:shadow-blue-300/30 hover:border-blue-300"
        }
        hover:scale-[1.02]
      `}
    >
      {/* Status indicator stripe at the top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusColor(project.status)}`}></div>
        {/* Project content */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3
            className={`text-xl font-bold ${
              darkMode ? "text-blue-400" : "text-blue-700"
            }`}
          >
            {project.title}
          </h3>
          <span 
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              darkMode ? "bg-gray-700 text-" : "bg-gray-100"
            } ${
              project.status === "Completed" ? (darkMode ? "text-green-400" : "text-green-600") :
              project.status === "In Progress" ? (darkMode ? "text-blue-400" : "text-blue-600") :
              project.status === "Pending" ? (darkMode ? "text-yellow-400" : "text-yellow-600") :
              project.status === "On Hold" ? (darkMode ? "text-orange-400" : "text-orange-600") :
              (darkMode ? "text-red-400" : "text-red-600")
            }`}
          >
            {project.status}
          </span>
        </div>
        
        <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-3 text-sm line-clamp-2`}>
          {project.description}
        </p>

        <div className="mb-4">
          <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Category
          </div>
          <div className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
            {project.category}
          </div>
        </div>

        <div className="mb-4">
          <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Team
          </div>
          <div className={`${darkMode ? "text-gray-300" : "text-gray-700"} text-sm`}>
            {project.students?.join(", ") || "-"}
          </div>
        </div>        <div className="mb-2">
          <div className={`flex justify-between text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <span>Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                progress < 30 ? "bg-red-500" : 
                progress < 70 ? "bg-yellow-500" : 
                "bg-green-500"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="border-t mt-auto pt-3 border-gray-200 dark:border-gray-700">
          <div
            className={`flex justify-between text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div>
              <span className="block font-semibold">Start Date</span>
              <span>{formatDate(project.startDate)}</span>
            </div>
            <div className="text-right">
              <span className="block font-semibold">Due Date</span>
              <span>{formatDate(project.endDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
