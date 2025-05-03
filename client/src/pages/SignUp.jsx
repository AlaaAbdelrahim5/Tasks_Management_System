import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";

const SignUp = () => {
  const { darkMode } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isStudent, setIsStudent] = useState(false);
  const [universityId, setUniversityId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isStudent && !universityId) {
      alert("Please enter your University ID");
      return;
    }

    const userData = {
      email,
      username,
      password,
      isStudent,
      universityId: isStudent ? universityId : null,
    };

    // Store signup data in localStorage
    const existingData = JSON.parse(localStorage.getItem("signUpData")) || [];
    localStorage.setItem("signUpData", JSON.stringify([...existingData, userData]));

    navigate("/login");
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} px-4 sm:px-6 lg:px-8`}>
      <div className={`p-5 sm:p-8 rounded-xl shadow-md w-full max-w-md mx-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Sign Up
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label
              htmlFor="email"
              className={`block mb-1 font-medium text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`w-full px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border border-gray-300'
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className={`block mb-1 font-medium text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className={`w-full px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border border-gray-300'
              }`}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className={`block mb-1 font-medium text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`w-full px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border border-gray-300'
              }`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isStudent"
              className="w-4 h-4"
              checked={isStudent}
              onChange={() => setIsStudent(!isStudent)}
            />
            <label htmlFor="isStudent" className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              I am a student
            </label>
          </div>

          {isStudent && (
            <div>
              <label
                htmlFor="universityId"
                className={`block mb-1 font-medium text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                University ID
              </label>
              <input
                type="text"
                id="universityId"
                className={`w-full px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border border-gray-300'
                }`}
                placeholder="Enter your University ID"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2 rounded-md hover:bg-blue-700 transition text-sm sm:text-base mt-2 sm:mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            Sign Up
          </button>
        </form>

        <div className={`mt-3 sm:mt-4 text-xs sm:text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Already have an account?{" "}
          <Link 
            to="/login" 
            className={`hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;