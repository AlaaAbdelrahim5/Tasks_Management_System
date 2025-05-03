import React, { useContext } from "react";
import { ThemeContext } from "../App";

const ProjectCard = ({ project, darkMode }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return darkMode ? 'text-green-400' : 'text-green-600';
      case 'In Progress': return darkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'On Hold': return darkMode ? 'text-orange-400' : 'text-orange-600';
      case 'Cancelled': return darkMode ? 'text-red-400' : 'text-red-600';
      default: return darkMode ? 'text-gray-300' : 'text-gray-600';
    }
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return darkMode ? 'bg-red-500' : 'bg-red-600';
    if (progress < 70) return darkMode ? 'bg-yellow-500' : 'bg-yellow-600';
    return darkMode ? 'bg-green-500' : 'bg-green-600';
  };

  return (
    <div className={`w-72 p-4 rounded shadow border ${
      darkMode 
        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    } transition-colors duration-200`}>
      <h3 className={`text-lg font-bold mb-2 ${
        darkMode ? 'text-blue-400' : 'text-blue-600'
      }`}>
        {project.title}
      </h3>
      <p className={`text-sm ${
        darkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {project.description}
      </p>
      <p className={`mt-2 text-sm ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Status: <span className={`font-semibold ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </p>
      <p className={`text-sm ${
        darkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Progress: <span className={`font-semibold ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {project.progress}%
        </span>
      </p>
      <div className={`h-2 rounded mt-2 ${
        darkMode ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <div
          className={`h-2 rounded ${getProgressColor(project.progress)}`}
          style={{ width: `${project.progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProjectCard;