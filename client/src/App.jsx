import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Chat from "./pages/Chat";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

// Create Theme Context
export const ThemeContext = createContext();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  const ProtectedRoute = ({ element }) =>
    isLoggedIn ? (
      <>
        <Sidebar />
        <div className="md:ml-64 dark:bg-gray-900 dark:text-white">
          {element}
        </div>
      </>
    ) : (
      <Navigate to="/login" />
    );

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/projects" element={<ProtectedRoute element={<Projects />} />} />
          <Route path="/tasks" element={<ProtectedRoute element={<Tasks />} />} />
          <Route path="/chat" element={<ProtectedRoute element={<Chat />} />} />
          <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!isLoggedIn ? <SignUp /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;