import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";
import { ThemeContext } from "../App";

const Header = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkLoginStatus = () => {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setUsername(userData.username || "");
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
    };

    checkLoginStatus();
  }, [location]);

  const logout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUsername("");
    navigate("/login");
    window.location.reload(); // Force a full page refresh to update all states
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 flex flex-wrap justify-between items-center py-3 px-5 shadow-md z-10 ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
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
          <>
            <h1
              id="index-username"
              className="font-medium text-center w-full sm:w-auto"
            >
              {username}
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