import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../App";

const Login = () => {
  const { darkMode } = useContext(ThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const userData = { email, username: email.split("@")[0] };
    localStorage.setItem("user", JSON.stringify(userData));

    // Redirect to home or dashboard
    navigate("/");

    // Force page reload to update header state
    window.location.reload();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} px-4 sm:px-6 lg:px-8`}>
      <div className={`p-6 sm:p-8 rounded-xl shadow-md w-full max-w-sm sm:max-w-md lg:max-w-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Login
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`w-full px-3 sm:px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border border-gray-300'}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className={`block mb-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`w-full px-3 sm:px-4 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border border-gray-300'}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="staySignedIn"
              className="w-4 h-4"
              checked={staySignedIn}
              onChange={() => setStaySignedIn(!staySignedIn)}
            />
            <label htmlFor="staySignedIn" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Stay signed in
            </label>
          </div>

          <button
            type="submit"
            className={`w-full py-2 rounded-md hover:bg-blue-700 transition ${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
          >
            Login
          </button>
        </form>

        <div className={`mt-4 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className={`hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;