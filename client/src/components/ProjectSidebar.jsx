import React, { useContext } from "react";
import { ThemeContext } from "../App";

const ProjectSidebar = ({ project, onClose, darkMode }) => {
  if (!project) return null;

  return (
    <div className={`fixed top-16 right-0 w-80 h-[calc(100vh-64px)] border-l shadow-lg z-50 overflow-y-auto p-4 ${
      darkMode 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-300'
    }`}>
      <div className={`flex justify-between items-center mb-4 pb-2 ${
        darkMode ? 'border-gray-600' : 'border-gray-300'
      } border-b`}>
        <h2 className={`text-xl font-semibold ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {project.title}
        </h2>
        <button
          onClick={onClose}
          className={`text-xl font-bold hover:text-red-700 ${
            darkMode ? 'text-red-500' : 'text-red-600'
          }`}
        >
          ×
        </button>
      </div>
      <div className={`space-y-3 text-sm ${
        darkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        <p><strong className={darkMode ? 'text-white' : ''}>Description:</strong> {project.description}</p>
        <p><strong className={darkMode ? 'text-white' : ''}>Category:</strong> {project.category}</p>
        <p>
          <strong className={darkMode ? 'text-white' : ''}>Status:</strong> 
          <span className={`ml-1 font-medium ${
            project.status === 'Completed' ? 'text-green-500' :
            project.status === 'In Progress' ? 'text-yellow-500' :
            project.status === 'On Hold' ? 'text-orange-500' :
            'text-red-500'
          }`}>
            {project.status}
          </span>
        </p>
        <p><strong className={darkMode ? 'text-white' : ''}>Start Date:</strong> {project.startDate}</p>
        <p><strong className={darkMode ? 'text-white' : ''}>End Date:</strong> {project.endDate}</p>
        <p><strong className={darkMode ? 'text-white' : ''}>Progress:</strong> {project.progress}%</p>
        <div className={`h-2 rounded ${
          darkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div
            className={`h-2 rounded ${
              project.progress < 30 ? 'bg-red-500' :
              project.progress < 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
        <div>
          <strong className={darkMode ? 'text-white' : ''}>Students:</strong>
          <ul className={`list-disc ml-5 mt-1 ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {project.students.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;