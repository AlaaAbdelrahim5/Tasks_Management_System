import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaSignInAlt, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
import { ThemeContext, AuthContext } from "../App";

const Header = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("stayLoggedIn");
    sessionStorage.removeItem("isCurrentSession");
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate("/login");
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  return (
    <header
      className={`fixed top-0 right-0 flex justify-end items-center py-3 px-8 shadow-xl z-20
        ${!isAuthPage && windowWidth >= 768 ? 'left-64' : 'left-0'}
        ${darkMode
          ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white"
          : "bg-gradient-to-r from-white via-blue-50 to-gray-100 text-gray-900"}
        transition-all duration-500 border-b
        ${darkMode ? "border-b-blue-900" : "border-b-blue-400"}
      `}
      style={{ minHeight: 72 }}
    >
      <nav className="flex items-center gap-6">
        {!isLoggedIn ? (
          <div className="flex items-center gap-4">
            <Link to="/login">
              <button
                id="loginBtnHeader"
                className={`bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2 text-base rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:scale-105 transition-all duration-300 flex items-center gap-2
                  ${location.pathname === '/login' ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                disabled={location.pathname === '/login'}
              >
                <FaSignInAlt /> Login
              </button>
            </Link>
            <Link to="/signup">
              <button
                id="signUpBtnHeader"
                className={`px-5 py-2 text-base rounded-xl font-semibold shadow-lg flex items-center gap-2 border transition-all duration-300 hover:scale-105
                  ${darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
                    : "bg-gray-100 hover:bg-blue-100 text-blue-700 border-blue-200"}
                  ${location.pathname === '/signup' ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                disabled={location.pathname === '/signup'}
              >
                <FaUserPlus /> Sign Up
              </button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-row items-center gap-4">
            <div className={`flex items-center gap-2 py-2 px-4 rounded-xl shadow border
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}
            `}>
              <FaUserCircle className={`text-2xl ${darkMode ? "text-blue-300" : "text-blue-600"}`} />
              <span
                id="index-username"
                className="font-semibold text-base"
              >
                {currentUser?.username || ''}
              </span>
            </div>
            <button
              id="logout"
              onClick={logout}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2 text-base rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-pink-700 hover:scale-105 transition-all duration-300 flex items-center gap-2"
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