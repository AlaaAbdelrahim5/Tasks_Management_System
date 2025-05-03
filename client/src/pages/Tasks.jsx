import React, { useContext } from "react";
import { ThemeContext } from "../App";

const Tasks = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`pt-16 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 pt-6 mb-4">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <label className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Sort by:
          </label>
          <select className={`rounded px-3 py-2 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-400 text-gray-900'
          }`}>
            <option>Tasks Status</option>
            <option>Project</option>
            <option>Due Date</option>
            <option>Assigned Student</option>
          </select>
        </div>
        <button className={`px-4 py-2 rounded hover:bg-blue-700 ${
          darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
        }`}>
          Create a New Task
        </button>
      </div>

      <div className={`shadow-md rounded-lg mx-4 sm:mx-6 overflow-x-auto ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <table className="w-full text-left border-collapse">
          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-200'}>
            <tr>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Task ID</th>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Project</th>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Task Name</th>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Description</th>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Assigned Student</th>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Status</th>
              <th className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}>
              <td className={`p-3 border-b ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>12345678</td>
              <td className={`p-3 border-b ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Project A</td>
              <td className={`p-3 border-b ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>Task 1</td>
              <td className={`p-3 border-b ${
                darkMode ? 'border-gray-600 text-gray-300' : 'text-gray-700'
              }`}>Example description</td>
              <td className={`p-3 border-b ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>John Doe</td>
              <td className={`p-3 border-b font-semibold ${
                darkMode ? 'border-gray-600 text-green-400' : 'text-green-700'
              }`}>In Progress</td>
              <td className={`p-3 border-b ${
                darkMode ? 'border-gray-600 text-white' : 'text-gray-900'
              }`}>2025-04-20</td>
            </tr>
            {/* Add more rows as needed */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tasks;