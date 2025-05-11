import React, { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ThemeContext } from '../App';
import { FaHome, FaProjectDiagram, FaTasks, FaCommentDots, FaBars, FaTimes } from 'react-icons/fa';

const Sidebar = () => {
  const { darkMode } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    if (windowWidth >= 768) {
      setIsMobileMenuOpen(false);
    }
  }, [windowWidth]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? `bg-blue-600 text-white font-medium shadow-md ${darkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`
        : darkMode
          ? 'text-gray-200 hover:bg-gray-700/70'
          : 'text-gray-700 hover:bg-gray-300/70'
    }`;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMobileMenu}
        className={`md:hidden fixed z-50 bottom-6 right-6 p-3 rounded-full shadow-lg transition-transform ${
          isMobileMenuOpen ? 'scale-90' : 'scale-100'
        } ${
          darkMode 
            ? 'bg-blue-600 text-white border border-blue-500' 
            : 'bg-white text-blue-600 border border-gray-200'
        }`}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
      </button>{/* Sidebar - Desktop and Mobile */}      <aside 
        className={`fixed top-0 left-0 h-screen shadow-xl transition-all duration-300 ease-in-out z-40
          ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}
          ${windowWidth >= 768 
            ? 'w-64 translate-x-0 mt-16' 
            : isMobileMenuOpen 
              ? 'w-64 translate-x-0 mt-0' 
              : 'w-64 -translate-x-full mt-0'
          }
        `}
      >
        {/* Mobile sidebar header */}        {windowWidth < 768 && (
          <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <h3 className="font-medium text-lg">Task Management</h3>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-full hover:bg-gray-500/20"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        )}
          <div className={`flex flex-col overflow-hidden ${
            windowWidth >= 768 ? 'h-full' : 'h-[calc(100vh-56px)]'
          }`}>
          <div className="flex-1 p-5 overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              <NavLink
                to="/"
                className={navLinkClass}
                onClick={() => windowWidth < 768 && setIsMobileMenuOpen(false)}
              >
                <FaHome className="text-lg" />
                <span>Home</span>
              </NavLink>
              
              <NavLink
                to="/projects"
                className={navLinkClass}
                onClick={() => windowWidth < 768 && setIsMobileMenuOpen(false)}
              >
                <FaProjectDiagram className="text-lg" />
                <span>Projects</span>
              </NavLink>
              
              <NavLink
                to="/tasks"
                className={navLinkClass}
                onClick={() => windowWidth < 768 && setIsMobileMenuOpen(false)}
              >
                <FaTasks className="text-lg" />
                <span>Tasks</span>
              </NavLink>
              
              <NavLink
                to="/chat"
                className={navLinkClass}
                onClick={() => windowWidth < 768 && setIsMobileMenuOpen(false)}
              >
                <FaCommentDots className="text-lg" />
                <span>Chat</span>
              </NavLink>
            </nav>
          </div>
            {/* Footer information - fixed at bottom */}
          <div className={`p-4 mx-4 mb-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-700/50' : 'bg-gray-200/50'}`}>
            <p className="text-sm font-medium">Task Management System</p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </aside>
        {/* Overlay when mobile menu is open */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isMobileMenuOpen && windowWidth < 768 ? 'opacity-50 z-30' : 'opacity-0 -z-10'
        } md:hidden`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </>
  );
};

export default Sidebar;