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

export const ThemeContext = createContext();
export const AuthContext = createContext();
export const NavigationContext = createContext();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastVisitedPage, setLastVisitedPage] = useState("/home");
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  useEffect(() => {
    const user = localStorage.getItem("user");
    const stayLoggedIn = localStorage.getItem("stayLoggedIn");
    const isCurrentSession = sessionStorage.getItem("isCurrentSession");
    const savedPage = localStorage.getItem("lastVisitedPage");
    
    if (savedPage) {
      setLastVisitedPage(savedPage);
    }

    if (user) {
      const userData = JSON.parse(user);
      
      // Check if user should stay logged in
      // If stayLoggedIn is true OR this is the same browser session, keep them logged in
      // Otherwise, log them out (e.g., browser was closed and reopened without "stay signed in")
      if (stayLoggedIn === "true" || isCurrentSession === "true") {
        setCurrentUser(userData);
        setIsLoggedIn(true);
      } else {
        // User didn't choose to stay signed in and this is a new session
        // Log them out by cleaning up localStorage
        localStorage.removeItem("user");
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
    }

    // Mark this as the current session
    sessionStorage.setItem("isCurrentSession", "true");
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const updateLastVisitedPage = (path) => {
    if (path && path !== "/login" && path !== "/signup") {
      localStorage.setItem("lastVisitedPage", path);
      setLastVisitedPage(path);
    }
  };

  const RouteTracker = () => {
    const location = useLocation();

    useEffect(() => {
      if (
        location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/"
      ) {
        updateLastVisitedPage(location.pathname);
      }
    }, [location.pathname]);

    return null;
  };

  const ProtectedRoute = ({ element }) => {
    return isLoggedIn ? (
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
    );
  };

  useEffect(() => {}, [isLoggedIn]);

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
              />{" "}
            </Routes>
          </BrowserRouter>
        </NavigationContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
