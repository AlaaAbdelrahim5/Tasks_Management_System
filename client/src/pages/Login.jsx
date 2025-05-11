import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext, AuthContext } from "../App";

const Login = () => {
  const { darkMode } = useContext(ThemeContext);
  const { setIsLoggedIn, setCurrentUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const query = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          id
          email
          username
          isStudent
          universityId
        }
      }
    `;
  
    const variables = { email, password };
  
    try {
      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
  
      const result = await response.json();
  
      if (result.errors) {
        alert(result.errors[0].message);
        return;
      }      const user = result.data.login;
      
      // Mark this as a valid session
      sessionStorage.setItem("isCurrentSession", "true");
      
      // Store user data in localStorage (for this session or permanent)
      localStorage.setItem("user", JSON.stringify(user));
      
      // If user chose to stay signed in, store that preference
      if (staySignedIn) {
        localStorage.setItem("stayLoggedIn", "true");
      } else {
        // Make sure to remove the preference if it exists
        localStorage.removeItem("stayLoggedIn");
      }
      
      // Update app state to logged in
      setIsLoggedIn(true);
      setCurrentUser(user);
  
      // Navigate to home page
      navigate("/home");
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed: " + err.message);
    }
  };
    return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-blue-50 to-gray-100'} px-4 sm:px-6 lg:px-8`}>
      <div className={`p-6 sm:p-8 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 border-gray-200'} w-full max-w-sm sm:max-w-md backdrop-blur-sm mt-8`}>
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
          </div>          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="staySignedIn"
              className={`w-4 h-4 accent-blue-600 cursor-pointer`}
              checked={staySignedIn}
              onChange={() => setStaySignedIn(!staySignedIn)}
            />
            <label htmlFor="staySignedIn" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>
              Remember me (stay signed in)
            </label>
          </div>          <button
            type="submit"
            className={`w-full py-3 rounded-md font-medium shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.01] ${darkMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            Login
          </button>
        </form>

        <div className={`mt-6 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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