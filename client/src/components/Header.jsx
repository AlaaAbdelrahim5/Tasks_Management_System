import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
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
  }, []);const logout = () => {
    // Remove both user data and stay logged in preference
    localStorage.removeItem("user");
    localStorage.removeItem("stayLoggedIn");
    sessionStorage.removeItem("isCurrentSession");
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate("/login");
  };  return (
    <header
      className={`fixed top-0 right-0 flex flex-wrap justify-between items-center py-2 px-5 shadow-md z-10 
        ${windowWidth >= 768 ? 'left-64' : 'left-0'} 
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
    >
      <nav className="flex items-center">
        <button
          id="toggle-mode"
          onClick={toggleDarkMode}
          className={`p-2 rounded-full hover:bg-opacity-30 transition flex items-center justify-center ${
            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-300"
          }`}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <FaSun className="text-yellow-400" />
          ) : (
            <FaMoon className="text-gray-700" />
          )}
        </button>
      </nav>
      <nav className="flex flex-wrap items-center gap-4 mt-3 sm:mt-0">
        {!isLoggedIn ? (
          <>
            <Link to="/login">
              <button
                id="loginBtn"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
              >
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button
                id="signUpBtn"
                className={`px-4 py-2 rounded-md transition w-full sm:w-auto ${
                  darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Sign Up
              </button>
            </Link>
          </>
        ) : (
          <>            <h1
              id="index-username"
              className="font-medium text-center w-full sm:w-auto"
            >
              {currentUser?.username || ''}
            </h1>
            <button
              id="logout"
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition w-full sm:w-auto"
            >
              Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;