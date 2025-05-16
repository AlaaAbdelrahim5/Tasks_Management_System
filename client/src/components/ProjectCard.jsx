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

  const progress = project.progress || getProgress(project.startDate, project.endDate);

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "-";
  
  // Calculate days remaining
  const getDaysRemaining = () => {
    const end = new Date(project.endDate);
    const now = new Date();
    if (isNaN(end)) return "N/A";
    
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    return `${days} days remaining`;
  };
  
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
  };  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-lg border transform transition-all duration-300 cursor-pointer h-full flex flex-col project-card-hover
        ${darkMode
          ? "bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-400"
          : "bg-white border-gray-200 hover:shadow-xl hover:shadow-blue-300/30 hover:border-blue-300"
        }
      `}
    >
      {/* Status indicator stripe at the top */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${getStatusColor(project.status)}`}></div>
      
      {/* Project content */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3
              className={`text-xl font-bold group-hover:text-blue-500 ${
                darkMode ? "text-blue-400" : "text-blue-700"
              }`}
            >
              {project.title}
            </h3>
            <div className="mt-1 flex items-center">
              <div className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium mr-2 ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                {project.category}
              </div>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {getDaysRemaining()}
              </span>
            </div>
          </div>
          
          <span 
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              darkMode ? "bg-gray-700" : "bg-gray-100"
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
        
        <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-4 text-sm line-clamp-2`}>
          {project.description}
        </p>

        <div className="mb-4">
          <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Team Members
          </div>
          <div className="flex flex-wrap gap-1">
            {project.students && project.students.length > 0 ? (
              project.students.slice(0, 3).map((student, index) => (
                <div key={index} 
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs 
                  ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {student}
                </div>
              ))
            ) : (
              <span className={`italic text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No team members assigned</span>
            )}
            {project.students && project.students.length > 3 && (
              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs
                ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
              >
                +{project.students.length - 3}
              </div>
            )}
          </div>
        </div>        <div className="mb-4">
          <div className={`flex justify-between text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <span className="font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Progress
            </span>
            <span className={`font-semibold ${
              progress < 30 ? (darkMode ? "text-red-400" : "text-red-600") : 
              progress < 70 ? (darkMode ? "text-yellow-400" : "text-yellow-600") : 
              (darkMode ? "text-green-400" : "text-green-600")
            }`}>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress < 30 ? "bg-gradient-to-r from-red-600 to-red-400" : 
                progress < 70 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" : 
                "bg-gradient-to-r from-green-600 to-green-400"
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="border-t mt-auto pt-3 border-gray-200 dark:border-gray-700">
          <div
            className={`flex justify-between items-center text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <div>
              <span className="block font-semibold mb-0.5">Start Date</span>
              <span className={`${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              } px-2 py-0.5 rounded text-xs`}>{formatDate(project.startDate)}</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="text-right">
              <span className="block font-semibold mb-0.5">Due Date</span>
              <span className={`${
                darkMode ? "bg-gray-700" : "bg-gray-100"
              } px-2 py-0.5 rounded text-xs`}>{formatDate(project.endDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
