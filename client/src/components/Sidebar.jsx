import React, { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { ThemeContext } from "../App";
import {
  FaHome,
  FaProjectDiagram,
  FaTasks,
  FaCommentDots,
  FaBars,
  FaTimes,
  FaClipboardList,
  FaSun,
  FaMoon,
} from "react-icons/fa";

const Sidebar = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Track window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
        ? `bg-blue-600 text-white font-medium shadow-md ${
            darkMode ? "shadow-blue-500/20" : "shadow-blue-500/30"
          }`
        : darkMode
        ? "text-gray-200 hover:bg-gray-700/70"
        : "text-gray-700 hover:bg-blue-100"
    }`;

  // State to track hover status for each nav item
  const [hoveredItem, setHoveredItem] = useState(null);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  return (
    <>
      {" "}
      {/* Mobile Menu Toggle Button */}{" "}
      <button
        onClick={toggleMobileMenu}
        className={`md:hidden fixed z-50 bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isMobileMenuOpen ? "scale-95 bg-red-500" : "scale-100 bg-blue-600"
        } ${
          darkMode
            ? "text-white ring-4 ring-blue-300/20"
            : "text-white ring-4 ring-blue-500/30"
        } active:scale-90`}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? (
          <FaTimes className="text-xl" />
        ) : (
          <FaBars className="text-xl" />
        )}{" "}
      </button>
      {/* Sidebar - Desktop and Mobile */}{" "}
      <aside
        className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out z-40
          ${
            darkMode
              ? "bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 text-white border-r border-gray-700"
              : "bg-gradient-to-b from-white via-blue-50/100 to-blue-50 text-gray-800 border-r border-gray-200"
          }
          ${
            windowWidth >= 768
              ? "w-64 translate-x-0 mt-0 shadow-lg"
              : isMobileMenuOpen
              ? "w-[280px] translate-x-0 mt-0 shadow-2xl"
              : "w-[280px] -translate-x-full mt-0"
          }
        `}
      >
        {" "}
        {/* Mobile sidebar header */}{" "}
        {windowWidth < 768 && (
          <div
            className={`p-4 flex items-center justify-between border-b ${
              darkMode
                ? "border-gray-700 bg-gradient-to-r from-gray-900 to-blue-900"
                : "border-gray-200 bg-gradient-to-r from-blue-700 to-blue-600"
            } shadow-md`}
          >
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-white rounded-md shadow-md">
                <FaClipboardList className={`text-blue-600 text-xl`} />
              </div>
              <h3 className={`font-bold text-lg text-white tracking-wide`}>
                Task Manager
              </h3>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full text-white hover:bg-white/20 active:scale-95 transition-transform"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        )}
        {/* Desktop sidebar header - only shown on desktop */}
        {windowWidth >= 768 && (
          <div
            className={`py-6 px-6 flex items-center justify-start rounded-b-2xl ${
              darkMode
                ? "bg-gradient-to-r from-gray-900 to-blue-900 border-b border-gray-700 shadow-xl"
                : "bg-gradient-to-r from-blue-700 to-blue-600 border-b border-blue-400/30 shadow-lg"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 bg-white rounded-full shadow-lg transform transition-transform duration-300 hover:scale-110 ${
                  darkMode ? "bg-white/10" : "bg-white/90"
                }`}
              >
                <FaClipboardList
                  className={`text-${
                    darkMode ? "blue-400" : "blue-600"
                  } text-2xl`}
                />
              </div>
              <h3
                className={`text-2xl font-extrabold tracking-wide bg-clip-text text-transparent ${
                  darkMode
                    ? "bg-gradient-to-r from-white/80 to-white/50"
                    : "bg-gradient-to-r from-white to-gray-200"
                }`}
              >
                Task Manager
              </h3>
            </div>
          </div>
        )}
        <div className="flex flex-col overflow-hidden h-[calc(100%-64px)]">
          <div className="flex-1 p-5 overflow-y-auto scrollbar-thin">
            {" "}
            <nav className="flex flex-col space-y-2.5">
              <p
                className={`text-xs uppercase tracking-wider font-semibold pl-3 mb-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Main Navigation
              </p>{" "}
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer transform hover:translate-x-1
                  ${
                    location.pathname === "/home" || location.pathname === "/"
                      ? `bg-blue-600 text-white font-semibold shadow-lg ${
                          darkMode ? "shadow-blue-500/30" : "shadow-blue-500/40"
                        } translate-x-1`
                      : hoveredItem === "home"
                      ? darkMode
                        ? "bg-gray-700/70 text-gray-100"
                        : "bg-blue-100 text-gray-800"
                      : darkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                  }`}
                onClick={() => {
                  navigate("/home");
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem("home")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={`${
                    location.pathname === "/home" || location.pathname === "/"
                      ? `text-white`
                      : darkMode
                      ? "text-blue-400"
                      : "text-blue-500"
                  }`}
                >
                  <FaHome
                    className={`${windowWidth < 768 ? "text-xl" : "text-lg"}`}
                  />
                </div>
                <span
                  className={`${
                    windowWidth < 768 ? "text-base font-medium" : "font-medium"
                  }`}
                >
                  Home
                </span>
              </div>{" "}
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer transform hover:translate-x-1
                  ${
                    location.pathname === "/projects"
                      ? `bg-blue-600 text-white font-semibold shadow-lg ${
                          darkMode ? "shadow-blue-500/30" : "shadow-blue-500/40"
                        } translate-x-1`
                      : hoveredItem === "projects"
                      ? darkMode
                        ? "bg-gray-700/70 text-gray-100"
                        : "bg-blue-100 text-gray-800"
                      : darkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                  }`}
                onClick={() => {
                  navigate("/projects");
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem("projects")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={`${
                    location.pathname === "/projects"
                      ? `text-white`
                      : darkMode
                      ? "text-blue-400"
                      : "text-blue-500"
                  }`}
                >
                  <FaProjectDiagram
                    className={`${windowWidth < 768 ? "text-xl" : "text-lg"}`}
                  />
                </div>
                <span
                  className={`${
                    windowWidth < 768 ? "text-base font-medium" : "font-medium"
                  }`}
                >
                  Projects
                </span>
              </div>{" "}
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer transform hover:translate-x-1
                  ${
                    location.pathname === "/tasks"
                      ? `bg-blue-600 text-white font-semibold shadow-lg ${
                          darkMode ? "shadow-blue-500/30" : "shadow-blue-500/40"
                        } translate-x-1`
                      : hoveredItem === "tasks"
                      ? darkMode
                        ? "bg-gray-700/70 text-gray-100"
                        : "bg-blue-100 text-gray-800"
                      : darkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                  }`}
                onClick={() => {
                  navigate("/tasks");
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem("tasks")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={`${
                    location.pathname === "/tasks"
                      ? `text-white`
                      : darkMode
                      ? "text-blue-400"
                      : "text-blue-500"
                  }`}
                >
                  <FaTasks
                    className={`${windowWidth < 768 ? "text-xl" : "text-lg"}`}
                  />
                </div>
                <span
                  className={`${
                    windowWidth < 768 ? "text-base font-medium" : "font-medium"
                  }`}
                >
                  Tasks
                </span>
              </div>{" "}
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer transform hover:translate-x-1
                  ${
                    location.pathname === "/chat"
                      ? `bg-blue-600 text-white font-semibold shadow-lg ${
                          darkMode ? "shadow-blue-500/30" : "shadow-blue-500/40"
                        } translate-x-1`
                      : hoveredItem === "chat"
                      ? darkMode
                        ? "bg-gray-700/70 text-gray-100"
                        : "bg-blue-100 text-gray-800"
                      : darkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                  }`}
                onClick={() => {
                  navigate("/chat");
                  if (windowWidth < 768) setIsMobileMenuOpen(false);
                }}
                onMouseEnter={() => setHoveredItem("chat")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  className={`${
                    location.pathname === "/chat"
                      ? `text-white`
                      : darkMode
                      ? "text-blue-400"
                      : "text-blue-500"
                  }`}
                >
                  <FaCommentDots
                    className={`${windowWidth < 768 ? "text-xl" : "text-lg"}`}
                  />
                </div>
                <span
                  className={`${
                    windowWidth < 768 ? "text-base font-medium" : "font-medium"
                  }`}
                >
                  Chat
                </span>
              </div>
            </nav>{" "}
          </div>{" "}
          {/* Footer information - fixed at bottom */}{" "}
          <div
            className={`p-4 mx-4 mb-17 rounded-lg shadow-md ${
              darkMode
                ? "bg-gradient-to-br from-gray-800/80 to-blue-900/20 border border-gray-700/30"
                : "bg-gradient-to-br from-white to-blue-100/80 border border-blue-200/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p
                className={`text-sm font-semibold ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Task Management
              </p>
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  darkMode ? "bg-green-400" : "bg-green-500"
                }`}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {new Date().toLocaleDateString()}{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <button
                id="toggle-mode"
                onClick={toggleDarkMode}
                className={`p-2 rounded-full shadow-md hover:scale-110 transition-all duration-300 flex items-center justify-center border
                  ${
                    darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-yellow-400 border-gray-600"
                      : "bg-white hover:bg-blue-100 text-indigo-600 border-blue-200"
                  }
                `}
                aria-label={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>
            </div>
          </div>
        </div>
      </aside>{" "}
      {/* Overlay when mobile menu is open */}
      <div
        className={`fixed inset-0 bg-black backdrop-blur-sm transition-all duration-300 ${
          isMobileMenuOpen && windowWidth < 768
            ? "opacity-60 z-30"
            : "opacity-0 -z-10"
        } md:hidden`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
    </>
  );
};

export default Sidebar;
