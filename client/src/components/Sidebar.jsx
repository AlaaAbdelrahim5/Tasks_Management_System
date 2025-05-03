import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../App';

const Sidebar = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <aside className={`fixed top-0 left-0 h-screen w-64 p-4 shadow-lg mt-16 ${
      darkMode 
        ? 'bg-gray-800 text-white' 
        : 'bg-gray-200 text-black'
    }`}>
      <nav className="flex flex-col space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? "bg-blue-500 text-white px-3 py-2 rounded"
              : darkMode
                ? "hover:bg-gray-700 px-3 py-2 rounded"
                : "hover:bg-gray-300 px-3 py-2 rounded"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            isActive
              ? "bg-blue-500 text-white px-3 py-2 rounded"
              : darkMode
                ? "hover:bg-gray-700 px-3 py-2 rounded"
                : "hover:bg-gray-300 px-3 py-2 rounded"
          }
        >
          Projects
        </NavLink>
        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            isActive
              ? "bg-blue-500 text-white px-3 py-2 rounded"
              : darkMode
                ? "hover:bg-gray-700 px-3 py-2 rounded"
                : "hover:bg-gray-300 px-3 py-2 rounded"
          }
        >
          Tasks
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            isActive
              ? "bg-blue-500 text-white px-3 py-2 rounded"
              : darkMode
                ? "hover:bg-gray-700 px-3 py-2 rounded"
                : "hover:bg-gray-300 px-3 py-2 rounded"
          }
        >
          Chat
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;