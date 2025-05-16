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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isStudent && !universityId) {
      alert("Please enter your University ID");
      return;
    }

    const query = `
      mutation SignUp($userInput: SignUpInput!) {
        signUp(userInput: $userInput) {
          id
          email
          username
        }
      }
    `;

    const variables = {
      userInput: {
        email,
        username,
        password,
        isStudent,
        universityId: isStudent ? universityId : null,
      },
    };

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
      }

      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      alert("Signup failed: " + err.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900"
          : "bg-gradient-to-br from-blue-100 via-white to-blue-300"
      }`}
    >
      {/* Animated background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400 opacity-30 rounded-full blur-3xl animate-blob1 pointer-events-none z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-400 opacity-30 rounded-full blur-3xl animate-blob2 pointer-events-none z-0"></div>

      <div
        className={`relative z-10 p-5 sm:p-8 rounded-2xl mt-4 shadow-2xl border transition-all duration-500 ${
          darkMode
            ? "bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900 border-gray-700"
            : "bg-white/90 border-blue-200"
        } w-full max-w-md mx-auto backdrop-blur-md mt-8 animate-fadeIn`}
      >
        <h3
          className={`text-2xl sm:text-3xl font-extrabold text-center tracking-tight transition-colors duration-300 ${
            darkMode ? "text-blue-200 drop-shadow-lg" : "text-blue-700"
          } animate-slideDown`}
        >
          <span className="inline-block animate-pop mb-2">Sign Up</span>
        </h3>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6 animate-fadeIn delay-200"
        >
          <div className="group transition-all duration-300">
            <label
              htmlFor="email"
              className={`block font-semibold text-sm sm:text-base transition-colors duration-300 ${
                darkMode ? "text-blue-100" : "text-blue-900"
              }`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className={`w-full px-4 py-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm ${
                darkMode
                  ? "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600"
                  : "border border-gray-300 focus:bg-blue-50"
              }`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="group transition-all duration-300">
            <label
              htmlFor="username"
              className={`block font-semibold text-sm sm:text-base transition-colors duration-300 ${
                darkMode ? "text-blue-100" : "text-blue-900"
              }`}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              className={`w-full px-4 py-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm ${
                darkMode
                  ? "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600"
                  : "border border-gray-300 focus:bg-blue-50"
              }`}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="group transition-all duration-300">
            <label
              htmlFor="password"
              className={`block font-semibold text-sm sm:text-base transition-colors duration-300 ${
                darkMode ? "text-blue-100" : "text-blue-900"
              }`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`w-full px-4 py-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm ${
                darkMode
                  ? "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600"
                  : "border border-gray-300 focus:bg-blue-50"
              }`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 animate-fadeIn delay-300">
            <input
              type="checkbox"
              id="isStudent"
              className="w-4 h-4 accent-blue-500 transition-all duration-200"
              checked={isStudent}
              onChange={() => setIsStudent(!isStudent)}
            />
            <label
              htmlFor="isStudent"
              className={`text-sm sm:text-base cursor-pointer transition-colors duration-300 ${
                darkMode ? "text-blue-200" : "text-blue-700"
              }`}
            >
              I am a student
            </label>
          </div>

          {isStudent && (
            <div className="animate-slideDown">
              <label
                htmlFor="universityId"
                className={`block font-semibold text-sm sm:text-base transition-colors duration-300 ${
                  darkMode ? "text-blue-100" : "text-blue-900"
                }`}
              >
                University ID
              </label>
              <input
                type="text"
                id="universityId"
                className={`w-full px-4 py-2 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 shadow-sm ${
                  darkMode
                    ? "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600"
                    : "border border-gray-300 focus:bg-blue-50"
                }`}
                placeholder="Enter your University ID"
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-base mt-2 sm:mt-4 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
              darkMode
                ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                : "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            } animate-pop`}
          >
            Sign Up
          </button>
        </form>

        <div
          className={`mt-8 text-sm text-center transition-colors duration-300 ${
            darkMode ? "text-blue-100" : "text-blue-900"
          } animate-fadeIn delay-500`}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className={`hover:underline font-semibold transition-colors duration-200 ${
              darkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-800"
            }`}
          >
            Login
          </Link>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-30px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        @keyframes pop {
          0% { transform: scale(0.9);}
          60% { transform: scale(1.05);}
          100% { transform: scale(1);}
        }
        @keyframes blob1 {
          0%,100% { transform: scale(1) translate(0,0);}
          50% { transform: scale(1.15) translate(40px, 30px);}
        }
        @keyframes blob2 {
          0%,100% { transform: scale(1) translate(0,0);}
          50% { transform: scale(1.1) translate(-30px, -20px);}
        }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(.4,0,.2,1) both;}
        .animate-slideDown { animation: slideDown 0.7s cubic-bezier(.4,0,.2,1) both;}
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,0,.2,1) both;}
        .animate-blob1 { animation: blob1 8s ease-in-out infinite;}
        .animate-blob2 { animation: blob2 10s ease-in-out infinite;}
        .delay-200 { animation-delay: 0.2s;}
        .delay-300 { animation-delay: 0.3s;}
        .delay-500 { animation-delay: 0.5s;}
        `}
      </style>
    </div>
  );
};

export default SignUp;
