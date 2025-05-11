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

// Create Context objects
export const ThemeContext = createContext();
export const AuthContext = createContext();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Effect for checking login status on page load
  useEffect(() => {
    const user = localStorage.getItem("user");
    const stayLoggedIn = localStorage.getItem("stayLoggedIn");
    
    if (user) {
      const userData = JSON.parse(user);
      
      // Check for "stay logged in" preference for persistent logins
      if (stayLoggedIn === "true") {
        // User has chosen to stay logged in across sessions
        setIsLoggedIn(true);
        setCurrentUser(userData);
      } else {
        // For initial app load - don't auto-login if they didn't choose "stay logged in"
        // But keep the user data for the current session
        setCurrentUser(userData);
        
        // Check if this is a page load (not from login page)
        const isPageReload = !sessionStorage.getItem("isCurrentSession");
        if (isPageReload) {
          // It's a page reload/new visit and user didn't choose "stay logged in"
          localStorage.removeItem("user");
        } else {
          // It's during an active session, user should be logged in
          setIsLoggedIn(true);
        }
      }
    }
    
    // Mark that we've started a session
    sessionStorage.setItem("isCurrentSession", "true");
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
  };  const ProtectedRoute = ({ element }) =>
    isLoggedIn ? (
      <>
        <Sidebar />
        <Header />        <div className={`md:ml-64 min-h-screen pt-0 ${
          darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'
        }`}>
          {element}
        </div>
      </>
    ) : (
      <Navigate to="/login" />
    );// Add an effect to redirect to login if user is not logged in when the app starts
  useEffect(() => {
    // This will cause an automatic redirect to login page on page load if not logged in
    const checkAuth = () => {
      if (!isLoggedIn) {
        // No need to do anything, routing will handle it
      }
    };
    checkAuth();
  }, [isLoggedIn]);
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser }}>
        <BrowserRouter>
          <Routes>          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
          <Route path="/projects" element={<ProtectedRoute element={<Projects />} />} />
          <Route path="/tasks" element={<ProtectedRoute element={<Tasks />} />} />
          <Route path="/chat" element={<ProtectedRoute element={<Chat />} />} />          <Route path="/login" element={
            <>
              <Header />
              <div className="min-h-screen w-full overflow-y-auto">
                {!isLoggedIn ? <Login /> : <Navigate to="/home" />}
              </div>
            </>
          } />
          <Route path="/signup" element={
            <>
              <Header />
              <div className="min-h-screen w-full overflow-y-auto">
                {!isLoggedIn ? <SignUp /> : <Navigate to="/home" />}
              </div>
            </>
          } /></Routes>
      </BrowserRouter>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;