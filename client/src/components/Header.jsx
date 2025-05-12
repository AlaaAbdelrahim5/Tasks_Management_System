import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSun, FaMoon, FaUserCircle, FaSignInAlt, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import { ThemeContext, AuthContext } from "../App";

const Header = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const logout = () => {
    // Remove both user data and stay logged in preference
    localStorage.removeItem("user");
    localStorage.removeItem("stayLoggedIn");
    sessionStorage.removeItem("isCurrentSession");
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate("/login");
  };
  
  // Check if we're on login or signup page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <header
      className={`fixed top-0 right-0 flex justify-between items-center py-3 px-6 shadow-lg z-10 
        ${!isAuthPage && windowWidth >= 768 ? 'left-64' : 'left-0'} 
        ${darkMode 
          ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white" 
          : "bg-gradient-to-r from-white to-gray-50 text-gray-800"}`}
    >
      <div className="flex items-center">
        {/* Removing the duplicate title */}
        <button
          id="toggle-mode"
          onClick={toggleDarkMode}
          className={`p-2.5 rounded-full hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center ${
            darkMode 
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-400" 
              : "bg-gray-100 hover:bg-gray-200 text-indigo-600"
          }`}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      <nav className="flex items-center gap-4">
        {!isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button
                id="loginBtnHeader"
                className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md flex items-center gap-2 ${
                  location.pathname === '/login' ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={location.pathname === '/login'}
              >
                <FaSignInAlt /> Login
              </button>
            </Link>
            <Link to="/signup">
              <button
                id="signUpBtnHeader"
                className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-300 shadow-md flex items-center gap-2 ${
                  darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } ${location.pathname === '/signup' ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={location.pathname === '/signup'}
              >
                <FaUserPlus /> Sign Up
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-row items-center gap-3">
            <div className={`flex items-center gap-2 py-1.5 px-3 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-100"
            }`}>
              <FaUserCircle className={`text-lg ${darkMode ? "text-blue-400" : "text-blue-500"}`} />
              <h1
                id="index-username"
                className="font-medium text-sm sm:text-base"
              >
                {currentUser?.username || ''}
              </h1>
            </div>
            <button
              id="logout"
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1.5 text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md flex items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;