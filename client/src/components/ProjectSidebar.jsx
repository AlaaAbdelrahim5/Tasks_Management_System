import React, { useEffect, useState, useRef } from "react";

const ProjectSidebar = ({ project, onClose, onDelete, darkMode }) => {
  const [tasks, setTasks] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sidebarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);

    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (!project) return;
    const fetchTasksByProject = async () => {
      const query = `
        query {
          getTasks {
            id
            project
            name
            description
            assignedStudent
            status
            dueDate
          }
        }
      `;
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      const allTasks = json.data.getTasks;
      const filtered = allTasks.filter((t) => t.project === project.title);
      setTasks(filtered);
    };
    fetchTasksByProject();
  }, [project]);

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
      ref={sidebarRef}
      className={`
        fixed top-18 right-0 w-full sm:w-96 h-[calc(100vh-4rem)] flex flex-col z-50
        ${
          darkMode
            ? "bg-gray-900 border-l border-gray-700"
            : "bg-gray-100 border-l border-gray-300"
        }
        transition-all duration-300 ease-in-out transform
        ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }
        shadow-2xl rounded-l-2xl
      `}
      style={{
        boxShadow: darkMode
          ? "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
          : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      }}
    >
      {/* Fixed Header */}
      <div
        className={`
        sticky top-0 z-10 bg-gradient-to-r
        ${
          darkMode
            ? "from-blue-950 to-purple-950"
            : "from-blue-600 to-purple-700"
        }
        text-white px-4 py-3 border-b-4
        ${darkMode ? "border-blue-800" : "border-blue-400"}
        rounded-tl-2xl
      `}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl font-bold truncate">
            {project.title}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors p-1 rounded-full hover:bg-white/10 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
            tabIndex={0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarColor: darkMode ? "#374151 #111827" : "#d1d5db #f3f4f6",
        }}
      >
        <style>
          {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: ${darkMode ? "#1e293b" : "#f1f5f9"};
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(
              to bottom,
              ${darkMode ? "#3b82f6" : "#60a5fa"},
              ${darkMode ? "#6366f1" : "#818cf8"}
            );
            border-radius: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(
              to bottom,
              ${darkMode ? "#2563eb" : "#2563eb"},
              ${darkMode ? "#a21caf" : "#a21caf"}
            );
          }
            `}
        </style>
        <div
          className={`custom-scrollbar p-4 space-y-4 text-sm ${
            darkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            } shadow-sm`}
          >
            <h3
              className={`text-base font-bold mb-3 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Project Overview
            </h3>
            <p className="mb-3">{project.description}</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="col-span-1">
                <p className="text-xs uppercase tracking-wider font-medium mb-1 opacity-70">
                  Category
                </p>
                <p className={`font-medium ${darkMode ? "text-white" : ""}`}>
                  {project.category}
                </p>
              </div>
              <div className="col-span-1">
                <p className="text-xs uppercase tracking-wider font-medium mb-1 opacity-70">
                  Status
                </p>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium
            ${
              project.status === "Completed"
                ? darkMode
                  ? "bg-green-900/50 text-green-300"
                  : "bg-green-100 text-green-800"
                : project.status === "In Progress"
                ? darkMode
                  ? "bg-blue-900/50 text-blue-300"
                  : "bg-blue-100 text-blue-800"
                : project.status === "Pending"
                ? darkMode
                  ? "bg-yellow-900/50 text-yellow-300"
                  : "bg-yellow-100 text-yellow-800"
                : project.status === "On Hold"
                ? darkMode
                  ? "bg-orange-900/50 text-orange-300"
                  : "bg-orange-100 text-orange-800"
                : darkMode
                ? "bg-red-900/50 text-red-300"
                : "bg-red-100 text-red-800"
            }`}
                >
                  {project.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="col-span-1">
                <p className="text-xs uppercase tracking-wider font-medium mb-1 opacity-70">
                  Start Date
                </p>
                <p className={`font-medium ${darkMode ? "text-white" : ""}`}>
                  {project.startDate}
                </p>
              </div>
              <div className="col-span-1">
                <p className="text-xs uppercase tracking-wider font-medium mb-1 opacity-70">
                  End Date
                </p>
                <p className={`font-medium ${darkMode ? "text-white" : ""}`}>
                  {project.endDate}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs uppercase tracking-wider font-medium opacity-70">
                  Progress
                </p>
                <span
                  className={`text-sm font-bold ${
                    progress < 30
                      ? "text-red-500"
                      : progress < 70
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`}
                >
                  {progress}%
                </span>
              </div>
              <div
                className={`h-2.5 rounded-full overflow-hidden ${
                  darkMode ? "bg-gray-900" : "bg-gray-200"
                } shadow-inner`}
              >
                <div
                  className={`
              h-full rounded-full
              ${
                progress < 30
                  ? "bg-gradient-to-r from-red-400 to-red-600"
                  : progress < 70
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                  : "bg-gradient-to-r from-green-400 to-green-600"
              }
              shadow-md
            `}
                  style={{ width: `${progress}%`, transition: "width 0.5s" }}
                ></div>
              </div>
            </div>
          </div>
          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            } mt-4 shadow-sm`}
          >
            <h3
              className={`text-base font-bold mb-3 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Team Members
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {project.students.map((s, i) => (
                <div
                  key={i}
                  className={`
              px-3 py-2 rounded-lg
              ${darkMode ? "bg-gray-900" : "bg-gray-100"}
              flex items-center
              transition-all duration-200
              hover:shadow-md hover:scale-[1.03]
            `}
                >
                  <div
                    className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center ${
                      darkMode ? "bg-blue-600" : "bg-blue-500"
                    } text-white font-medium`}
                  >
                    {s.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Display tasks */}
          <div
            className={`p-4 rounded-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            } mt-4 shadow-sm`}
          >
            <h3
              className={`text-base font-bold mb-3 ${
                darkMode ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Related Tasks
            </h3>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`
                      p-3 rounded-lg
                      ${darkMode ? "bg-gray-900" : "bg-gray-100"}
                      border-l-4
                      ${
                        task.status === "Completed"
                          ? "border-green-500"
                          : task.status === "In Progress"
                          ? "border-blue-500"
                          : task.status === "Pending"
                          ? "border-yellow-500"
                          : task.status === "On Hold"
                          ? "border-orange-500"
                          : "border-red-500"
                      }
                      transition-all duration-200
                      hover:shadow-lg hover:scale-[1.02]
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{task.name}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full 
                        ${
                          task.status === "Completed"
                            ? darkMode
                              ? "bg-green-900/50 text-green-300"
                              : "bg-green-100 text-green-800"
                            : task.status === "In Progress"
                            ? darkMode
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-blue-100 text-blue-800"
                            : task.status === "Pending"
                            ? darkMode
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-yellow-100 text-yellow-800"
                            : task.status === "On Hold"
                            ? darkMode
                              ? "bg-orange-900/50 text-orange-300"
                              : "bg-orange-100 text-orange-800"
                            : darkMode
                            ? "bg-red-900/50 text-red-300"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className="opacity-70">ID: {task.id}</span>
                      <span className="font-medium">
                        Assigned to: {task.assignedStudent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`p-6 rounded-lg flex flex-col items-center justify-center ${
                  darkMode ? "bg-gray-900" : "bg-gray-50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-12 w-12 mb-3 ${
                    darkMode ? "text-gray-600" : "text-gray-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 18v-6M9 15h6"
                  />
                </svg>
                <p
                  className={`text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  } font-medium`}
                >
                  No tasks associated with this project yet
                </p>
                {!JSON.parse(localStorage.getItem("user"))?.isStudent && (
                  <p
                    className={`text-center text-xs mt-2 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Create tasks for this project from the Tasks page
                  </p>
                )}
              </div>
            )}
          </div>
          {/* Add extra space at the bottom to prevent content from being hidden behind fixed footer */}
          <div className="h-16"></div>
        </div>
      </div>

      {/* Fixed Footer with Delete Button */}
      {!JSON.parse(localStorage.getItem("user"))?.isStudent && (
        <div
          className={`
          sticky bottom-0 left-0 right-0 p-4
          ${darkMode ? "bg-gray-900" : "bg-gray-100"}
          border-t ${darkMode ? "border-gray-700" : "border-gray-300"}
          shadow-lg rounded-bl-2xl
        `}
        >
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`
                w-full py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2
                ${
                  darkMode
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                }
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400
                active:scale-95
              `}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Delete Project
            </button>
          ) : (
            <div
              className={`p-4 rounded-lg ${
                darkMode ? "bg-gray-800/90" : "bg-white/90"
              } shadow-lg border ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <p
                className={`text-center mb-3 font-medium ${
                  darkMode ? "text-red-300" : "text-red-600"
                }`}
              >
                Are you sure you want to delete "{project.title}"?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onDelete(project.id);
                    setShowDeleteConfirm(false);
                  }}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all
                    ${
                      darkMode
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 active:scale-95
                  `}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all
                    ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 active:scale-95
                  `}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
