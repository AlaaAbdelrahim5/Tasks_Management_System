import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../App';
import { FaHome, FaProjectDiagram, FaTasks, FaCommentDots, FaBars, FaTimes } from 'react-icons/fa';

const Sidebar = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
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
  }, [windowWidth]);  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? `bg-blue-600 text-white font-medium shadow-md ${darkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`
        : darkMode
          ? 'text-gray-200 hover:bg-gray-700/70'
          : 'text-gray-700 hover:bg-blue-100'
    }`;
    
  // State to track hover status for each nav item
  const [hoveredItem, setHoveredItem] = useState(null);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <>      {/* Mobile Menu Toggle Button */}      <button
        onClick={toggleMobileMenu}
        className={`md:hidden fixed z-50 bottom-6 right-6 p-3 rounded-full shadow-xl transition-all duration-300 ${
          isMobileMenuOpen ? 'scale-95 rotate-180' : 'scale-100 rotate-0'
        } ${
          darkMode 
            ? 'bg-blue-600 text-white border-2 border-blue-400' 
            : 'bg-blue-500 text-white border border-blue-400'
        }`}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}      </button>{/* Sidebar - Desktop and Mobile */}      <aside 
        className={`fixed top-0 left-0 h-screen shadow-xl transition-all duration-300 ease-in-out z-40
          ${darkMode 
            ? 'bg-gradient-to-b from-gray-800 to-gray-900 text-white' 
            : 'bg-gradient-to-b from-white to-blue-50 text-gray-800'
          }
          ${windowWidth >= 768 
            ? 'w-64 translate-x-0 mt-0' 
            : isMobileMenuOpen 
              ? 'w-80 translate-x-0 mt-0' 
              : 'w-80 -translate-x-full mt-0'
          }
        `}
      >        {/* Mobile sidebar header */}        {windowWidth < 768 && (
          <div className={`p-4 flex items-center justify-between border-b ${
            darkMode 
              ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-blue-900' 
              : 'border-gray-300 bg-gradient-to-r from-blue-600 to-blue-700'
          }`}>
            <h3 className={`font-medium text-lg text-white`}>Task Management</h3>
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-full text-white hover:bg-white/20"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        )}{/* Desktop sidebar header - only shown on desktop */}
        {windowWidth >= 768 && (
          <div className={`py-5 px-5 flex items-center justify-start ${
            darkMode 
              ? 'bg-gradient-to-r from-gray-900 to-blue-900' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700'
          }`}>
            <h3 className={`font-semibold text-lg text-white`}>Task Management</h3>
          </div>
        )}<div className="flex flex-col overflow-hidden h-[calc(100%-56px)]">
          <div className="flex-1 p-5 overflow-y-auto">            <nav className="flex flex-col space-y-3">              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    location.pathname === '/home' || location.pathname === '/'
                      ? `bg-blue-600 text-white font-medium shadow-md ${darkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`
                      : hoveredItem === 'home'
                        ? darkMode ? 'bg-gray-700/70 text-gray-200' : 'bg-blue-100 text-gray-700'
                        : darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                onClick={() => {
                  // Use React Router navigation hook
                  navigate('/home');
                  // Close mobile menu if needed
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem('home')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaHome className={`${windowWidth < 768 ? 'text-xl' : 'text-lg'}`} />
                <span className={`${windowWidth < 768 ? 'text-base font-medium' : ''}`}>Home</span>
              </div>              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    location.pathname === '/projects'
                      ? `bg-blue-600 text-white font-medium shadow-md ${darkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`
                      : hoveredItem === 'projects'
                        ? darkMode ? 'bg-gray-700/70 text-gray-200' : 'bg-blue-100 text-gray-700'
                        : darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                onClick={() => {
                  navigate('/projects');
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem('projects')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaProjectDiagram className={`${windowWidth < 768 ? 'text-xl' : 'text-lg'}`} />
                <span className={`${windowWidth < 768 ? 'text-base font-medium' : ''}`}>Projects</span>
              </div>              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    location.pathname === '/tasks'
                      ? `bg-blue-600 text-white font-medium shadow-md ${darkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`
                      : hoveredItem === 'tasks'
                        ? darkMode ? 'bg-gray-700/70 text-gray-200' : 'bg-blue-100 text-gray-700'
                        : darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                onClick={() => {
                  navigate('/tasks');
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem('tasks')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaTasks className={`${windowWidth < 768 ? 'text-xl' : 'text-lg'}`} />
                <span className={`${windowWidth < 768 ? 'text-base font-medium' : ''}`}>Tasks</span>
              </div>              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    location.pathname === '/chat'
                      ? `bg-blue-600 text-white font-medium shadow-md ${darkMode ? 'shadow-blue-500/20' : 'shadow-blue-500/30'}`
                      : hoveredItem === 'chat'
                        ? darkMode ? 'bg-gray-700/70 text-gray-200' : 'bg-blue-100 text-gray-700'
                        : darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}
                onClick={() => {
                  navigate('/chat');
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem('chat')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaCommentDots className={`${windowWidth < 768 ? 'text-xl' : 'text-lg'}`} />
                <span className={`${windowWidth < 768 ? 'text-base font-medium' : ''}`}>Chat</span>
              </div>
            </nav>          </div>
            {/* Footer information - fixed at bottom */}          <div className={`p-4 mx-4 mb-6 rounded-lg shadow-sm ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60' 
                : 'bg-gradient-to-br from-blue-100 to-blue-200/70'
            }`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Task Management System</p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
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