import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext, AuthContext } from "../App";

const Login = () => {
  const { darkMode } = useContext(ThemeContext);
  const { setIsLoggedIn, setCurrentUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
        setShake(true);
        setTimeout(() => setShake(false), 600);
        alert(result.errors[0].message);
        setLoading(false);
        return;
      }
      const user = result.data.login;

      sessionStorage.setItem("isCurrentSession", "true");
      localStorage.setItem("user", JSON.stringify(user));
      if (staySignedIn) {
        localStorage.setItem("stayLoggedIn", "true");
      } else {
        localStorage.removeItem("stayLoggedIn");
      }
      setIsLoggedIn(true);
      setCurrentUser(user);
      setLoading(false);
      navigate("/home");
    } catch (err) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setLoading(false);
      console.error("Login failed:", err);
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center transition-colors duration-700 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900"
          : "bg-gradient-to-br from-blue-100 via-white to-blue-200"
      } px-4 sm:px-6 lg:px-8`}
    >
      <style>
        {`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        @keyframes shake {
          0% { transform: translateX(0);}
          20% { transform: translateX(-8px);}
          40% { transform: translateX(8px);}
          60% { transform: translateX(-8px);}
          80% { transform: translateX(8px);}
          100% { transform: translateX(0);}
        }
        .fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) both;
        }
        .shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        `}
      </style>
      <div
        className={`p-6 sm:p-8 rounded-2xl shadow-2xl border transition-all duration-500 fade-in-up ${
          shake ? "shake" : ""
        } ${
          darkMode
            ? "bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900 border-gray-700"
            : "bg-white/90 border-blue-200"
        } w-full max-w-sm sm:max-w-md backdrop-blur-md mt-8`}
      >
        <h3
          className={`text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6 text-center tracking-tight transition-colors duration-500 ${
            darkMode ? "text-blue-200 drop-shadow-lg" : "text-blue-700"
          }`}
        >
          Welcome Back
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-2">
            <label
              htmlFor="email"
              className={`block mb-1 font-semibold transition-colors duration-500 ${
                darkMode ? "text-blue-100" : "text-blue-900"
              }`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 shadow-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-blue-100 placeholder-gray-400 focus:ring-blue-500"
                  : "border-blue-200 focus:ring-blue-400"
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="mb-2">
            <label
              htmlFor="password"
              className={`block mb-1 font-semibold transition-colors duration-500 ${
                darkMode ? "text-blue-100" : "text-blue-900"
              }`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 shadow-sm ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-blue-100 placeholder-gray-400 focus:ring-blue-500"
                  : "border-blue-200 focus:ring-blue-400"
              }`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="staySignedIn"
              className="w-4 h-4 accent-blue-600 cursor-pointer transition-all duration-200"
              checked={staySignedIn}
              onChange={() => setStaySignedIn(!staySignedIn)}
            />
            <label
              htmlFor="staySignedIn"
              className={`text-sm py-3 cursor-pointer transition-colors duration-500 ${
                darkMode ? "text-blue-200" : "text-blue-700"
              }`}
            >
              Remember me (stay signed in)
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              darkMode
                ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                : "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div
          className={`mt-6 text-sm text-center transition-colors duration-500 ${
            darkMode ? "text-blue-100" : "text-blue-900"
          }`}
        >
          Don't have an account?{" "}
          <Link
            to="/signup"
            className={`hover:underline font-semibold transition-colors duration-300 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
