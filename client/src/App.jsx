import { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
export const NavigationContext = createContext();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastVisitedPage, setLastVisitedPage] = useState("/home");
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Effect for checking login status on page load
  useEffect(() => {
    const user = localStorage.getItem("user");
    const stayLoggedIn = localStorage.getItem("stayLoggedIn");
    const savedPage = localStorage.getItem("lastVisitedPage");

    if (savedPage) {
      setLastVisitedPage(savedPage);
    }

    if (user) {
      const userData = JSON.parse(user);
      setCurrentUser(userData);

      // Always keep the user logged in within browser sessions
      // This ensures page refreshes don't log the user out
      setIsLoggedIn(true);

      // Keep the "stayLoggedIn" flag for when the browser is closed and reopened
      if (stayLoggedIn === "true") {
        // User has chosen to stay logged in across browser sessions
        localStorage.setItem("stayLoggedIn", "true");
      }
    }

    // Mark that we've started a session
    sessionStorage.setItem("isCurrentSession", "true");
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save preference to localStorage
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Update last visited page
  const updateLastVisitedPage = (path) => {
    if (path && path !== "/login" && path !== "/signup") {
      localStorage.setItem("lastVisitedPage", path);
      setLastVisitedPage(path);
    }
  };

  // Route tracker component to record page visits
  const RouteTracker = () => {
    const location = useLocation();

    useEffect(() => {
      if (
        isLoggedIn &&
        location.pathname !== "/login" &&
        location.pathname !== "/signup"
      ) {
        updateLastVisitedPage(location.pathname);
      }
    }, [location]);

    return null;
  };

  const ProtectedRoute = ({ element }) =>
    isLoggedIn ? (
      <>
        <Sidebar />
        <Header />
        <div
          className={`md:ml-64 min-h-screen pt-0 ${
            darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
          }`}
        >
          {element}
        </div>
      </>
    ) : (
      <Navigate to="/login" />
    ); // Add an effect to redirect to login if user is not logged in when the app starts
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
      <AuthContext.Provider
        value={{ isLoggedIn, setIsLoggedIn, currentUser, setCurrentUser }}
      >
        <NavigationContext.Provider
          value={{ lastVisitedPage, updateLastVisitedPage }}
        >
          <BrowserRouter>
            <RouteTracker />
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    to={isLoggedIn ? lastVisitedPage : "/login"}
                    replace
                  />
                }
              />
              <Route
                path="/home"
                element={<ProtectedRoute element={<Home />} />}
              />
              <Route
                path="/projects"
                element={<ProtectedRoute element={<Projects />} />}
              />
              <Route
                path="/tasks"
                element={<ProtectedRoute element={<Tasks />} />}
              />
              <Route
                path="/chat"
                element={<ProtectedRoute element={<Chat />} />}
              />
              <Route
                path="/login"
                element={
                  <>
                    <Header />
                    <div className="min-h-screen w-full overflow-y-auto">
                      {!isLoggedIn ? (
                        <Login />
                      ) : (
                        <Navigate to={lastVisitedPage} />
                      )}
                    </div>
                  </>
                }
              />
              <Route
                path="/signup"
                element={
                  <>
                    <Header />
                    <div className="min-h-screen w-full overflow-y-auto">
                      {!isLoggedIn ? (
                        <SignUp />
                      ) : (
                        <Navigate to={lastVisitedPage} />
                      )}
                    </div>
                  </>
                }
              />
            </Routes>
          </BrowserRouter>
        </NavigationContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
