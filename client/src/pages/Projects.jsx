import React, { useEffect, useState, useContext, useCallback } from "react";
import ProjectCard from "../components/ProjectCard";
import ProjectSidebar from "../components/ProjectSidebar";
import { ThemeContext } from "../App";

const Projects = () => {
  const { darkMode } = useContext(ThemeContext);

  const [projects, setProjects] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    students: [],
    category: "",
    startDate: "",
    endDate: "",
    status: "In Progress",
  });

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error", // "error", "success" or "warning"
  });

  const [dateError, setDateError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUsername = user?.username;
  const isStudent = user?.isStudent;

  const refreshProjects = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              getProjects {
                id
                title
                description
                students
                category
                startDate
                endDate
                status
              }
            }
          `,
        }),
      });

      const json = await res.json();
      if (json.errors) {
        showNotification(json.errors[0].message, "error");
        return;
      }

      const all = json.data.getProjects;
      setProjects(
        isStudent
          ? all.filter((p) => p.students.includes(currentUsername))
          : all
      );
    } catch (err) {
      showNotification(
        "Failed to refresh projects. Please try again.",
        "error"
      );
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isStudent, currentUsername]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("http://localhost:4000/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query {
                getStudents {
                  username
                  email
                }
              }
            `,
          }),
        });

        const json = await res.json();
        if (json.errors) {
          console.error("Failed to load students:", json.errors[0].message);
          return;
        }

        setStudentList(json.data.getStudents || []);
      } catch (err) {
        console.error("Failed to load students", err);
      }
    };

    fetchStudents();
    refreshProjects();
  }, [refreshProjects]);

  const handleInputChange = (e) => {
    const { name, value, selectedOptions } = e.target;

    if (name === "students") {
      const values = Array.from(selectedOptions).map((opt) => opt.value);
      setFormData((prev) => ({ ...prev, students: values }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Reset date error when changing fields
      setDateError("");

      // If this is the end date field, validate against the start date
      if (name === "endDate" && formData.startDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(value);

        if (endDate < startDate) {
          setDateError("Due date cannot be earlier than start date");
          e.target.setCustomValidity(
            "Due date cannot be earlier than start date"
          );
        } else {
          e.target.setCustomValidity("");
        }
      }

      // If this is the start date field and we have an end date, validate
      if (name === "startDate" && formData.endDate) {
        const startDate = new Date(value);
        const endDate = new Date(formData.endDate);

        if (endDate < startDate) {
          setDateError("Start date must be before due date");
          e.target.setCustomValidity(
            "Start date cannot be later than due date"
          );
        } else {
          e.target.setCustomValidity("");
        }
      }
    }
  };

  const handleDeleteProjectConfirm = async () => {
    if (!projectToDelete) return;

    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation DeleteProject($id: ID!) {
              deleteProject(id: $id)
            }
          `,
          variables: { id: projectToDelete },
        }),
      });

      const json = await res.json();
      if (json.errors) {
        showNotification(json.errors[0].message, "error");
        return;
      }

      setProjects((prev) => prev.filter((proj) => proj.id !== projectToDelete));
      setSelectedProject(null);
      showNotification("Project deleted successfully!", "success");
    } catch (err) {
      showNotification("Error deleting project. Please try again.", "error");
    } finally {
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handleDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    // Validate that due date is not before start date
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      showNotification(
        "Due date cannot be earlier than start date. Please select a valid date range.",
        "error"
      );
      return;
    }

    const query = `
      mutation AddProject($projectInput: ProjectInput!) {
        addProject(projectInput: $projectInput) {
          id
          title
          description
          students
          category
          startDate
          endDate
          status
        }
      }
    `;
    const variables = { projectInput: formData };
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      if (json.errors) {
        // Check if it's a duplicate project name error
        if (
          json.errors[0].message.toLowerCase().includes("already exists") ||
          json.errors[0].message.toLowerCase().includes("duplicate")
        ) {
          showNotification(
            `Project with name "${formData.title}" already exists. Please use a different name.`,
            "error"
          );
        } else {
          showNotification(json.errors[0].message, "error");
        }
        return;
      }
      const newProj = json.data.addProject;
      if (!isStudent || newProj.students.includes(currentUsername)) {
        setProjects((prev) => [...prev, newProj]);
      }
      setFormData({
        title: "",
        description: "",
        students: [],
        category: "",
        startDate: "",
        endDate: "",
        status: "In Progress",
      });
      setShowForm(false);
      showNotification("Project created successfully!", "success");
    } catch (err) {
      console.error("Failed to add project:", err);
      showNotification("Error adding project. Please try again.", "error");
    }
  };

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type,
    });

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  };

  // Extract unique categories from projects
  const categories = [
    "All Categories",
    ...new Set(projects.map((p) => p.category).filter(Boolean)),
  ];

  // Enhanced filtering with category filter and sorting
  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "All Status" || p.status === statusFilter;
    const matchCategory =
      categoryFilter === "All Categories" || p.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  // Sort projects based on selected sorting option
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.startDate) - new Date(a.startDate);
      case "oldest":
        return new Date(a.startDate) - new Date(b.startDate);
      case "dueDate":
        return new Date(a.endDate) - new Date(b.endDate);
      case "alphabetical":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const fieldBg = darkMode
    ? "bg-gray-700 border-gray-600 placeholder-gray-300 text-white"
    : "bg-gray-50 border-gray-200 placeholder-gray-500 text-gray-800";
  const labelColor = darkMode ? "text-gray-300" : "text-gray-600";
  const accentColor = "blue";
  const formBg = darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800";

  // Project skeleton component for loading state
  const ProjectSkeleton = () => {
    return (
      <div
        className={`rounded-xl shadow-md overflow-hidden animate-pulse ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Card Header */}
        <div className="px-4 py-3 flex justify-between items-center">
          <div
            className={`h-3 w-24 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`h-3 w-10 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          ></div>
        </div>

        {/* Card Image Area */}
        <div
          className={`h-32 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          <div
            className={`h-5 w-3/4 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`h-4 w-1/2 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          ></div>
          <div className="pt-2">
            <div
              className={`h-2 w-full rounded-full ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            ></div>
          </div>
          <div className="flex justify-between pt-2">
            <div
              className={`h-6 w-16 rounded ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            ></div>
            <div className="flex space-x-1">
              <div
                className={`h-6 w-6 rounded-full ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`h-6 w-6 rounded-full ${
                  darkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add scroll-to-top functionality
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`pt-16 pb-4 min-h-screen ${
        darkMode
          ? "bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-indigo-50"
      }`}
    >
      <div className="px-6 py-4 max-w-screen-2xl mx-auto">
        {notification.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-fade-in-down transition-all transform ${
              notification.type === "error"
                ? darkMode
                  ? "bg-red-900/90 text-red-100 border border-red-800"
                  : "bg-red-100 text-red-800 border border-red-200"
                : notification.type === "success"
                ? darkMode
                  ? "bg-green-900/90 text-green-100 border border-green-800"
                  : "bg-green-100 text-green-800 border border-green-200"
                : darkMode
                ? "bg-yellow-900/90 text-yellow-100 border border-yellow-800"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
            } flex items-center justify-between`}
          >
            <div className="flex items-center">
              {notification.type === "error" && (
                <div
                  className={`p-1 rounded-full mr-3 ${
                    darkMode ? "bg-red-800" : "bg-red-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {notification.type === "success" && (
                <div
                  className={`p-1 rounded-full mr-3 ${
                    darkMode ? "bg-green-800" : "bg-green-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {notification.type === "warning" && (
                <div
                  className={`p-1 rounded-full mr-3 ${
                    darkMode ? "bg-yellow-800" : "bg-yellow-200"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
              className="ml-4 p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative">
              <h1
                className={`text-4xl sm:text-5xl font-extrabold mb-2 bg-clip-text text-transparent ${
                  darkMode
                    ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                    : "bg-gradient-to-r from-blue-600 to-cyan-400"
                }`}
              >
                {isStudent ? "Your Projects" : "Projects Overview"}
              </h1>
              <p
                className={`text-s ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Manage and track your project portfolio
              </p>
              <div className="w-65 h-1 mt-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
            </div>{" "}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  darkMode
                    ? "bg-blue-900/30 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                } shadow-sm`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                <span className="font-medium">
                  {sortedProjects.length}{" "}
                  {sortedProjects.length === 1 ? "Project" : "Projects"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-2">
            {!isStudent && (
              <button
                onClick={() => setShowForm(true)}
                className={`px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 ${
                  darkMode
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:from-blue-700 hover:to-purple-700"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-purple-700"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Add New Project
              </button>
            )}

            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 px-3 py-2.5 rounded-lg w-full pr-10 transition-colors shadow-sm border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div
              className={`relative rounded-lg shadow-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none w-full pl-4 pr-10 py-2.5 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    : "bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
              >
                <option>All Status</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>On Hold</option>
                <option>Cancelled</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div
              className={`relative rounded-lg shadow-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`appearance-none w-full pl-4 pr-10 py-2.5 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    : "bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div
              className={`relative rounded-lg shadow-sm ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`appearance-none w-full pl-4 pr-10 py-2.5 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    : "bg-white border border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="dueDate">Due Date</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>{" "}
        <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-4 opacity-30"></div>
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent bg-opacity-30 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg p-1.5 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl animate-fade-in">
              <form
                onSubmit={handleAddProject}
                className={`p-6 sm:p-8 rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto ${formBg} transition-all duration-300`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Create New Project</h2>
                    <div className="mt-2 w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setDateError("");
                    }}
                    className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="relative">
                    <input
                      type="text"
                      name="title"
                      placeholder="Project Title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
                      required
                    />
                    <label
                      className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                    >
                      Project Title
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      name="description"
                      placeholder="Provide project details..."
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all min-h-[120px]`}
                      rows={4}
                      required
                    />
                    <label
                      className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                    >
                      Description
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
                        required
                      >
                        <option value="">Select a Category</option>
                        <option>Web Development</option>
                        <option>Mobile Development</option>
                        <option>Data Science</option>
                        <option>Machine Learning</option>
                        <option>Other</option>
                      </select>
                      <label
                        className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                      >
                        Category
                      </label>
                    </div>

                    <div className="relative">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
                      >
                        <option>In Progress</option>
                        <option>Completed</option>
                        <option>Pending</option>
                        <option>On Hold</option>
                        <option>Cancelled</option>
                      </select>
                      <label
                        className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                      >
                        Status
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all ${
                          dateError && dateError.includes("Start date")
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        required
                      />
                      <label
                        className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                      >
                        Start Date
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all ${
                          dateError && dateError.includes("Due date")
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                        required
                      />
                      <label
                        className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                      >
                        End Date
                      </label>
                    </div>
                  </div>

                  {dateError && (
                    <div
                      className={`text-red-500 text-sm p-4 rounded-lg flex items-center space-x-2 border ${
                        darkMode
                          ? "bg-red-900/20 border-red-800"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{dateError}</span>
                    </div>
                  )}

                  <div className="relative">
                    <select
                      name="students"
                      multiple
                      value={formData.students}
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all h-36`}
                    >
                      {studentList.map((s) => (
                        <option key={s.email} value={s.username}>
                          {s.username}
                        </option>
                      ))}
                    </select>
                    <label
                      className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                    >
                      Assigned Students
                    </label>
                    <div className="text-xs mt-1 flex items-center gap-1 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Hold Ctrl key to select multiple students
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setDateError("");
                    }}
                    className={`px-5 py-2.5 rounded-lg font-medium border ${
                      darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    } transition-all duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProjectSkeleton key={i} />
            ))}
          </div>
        ) : sortedProjects.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
            {sortedProjects.map((project) => {
              const getProgress = (startDate, endDate) => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const now = new Date();
                if (now <= start) return 0;
                if (now >= end) return 100;
                const total = end - start;
                const elapsed = now - start;
                return Math.round((elapsed / total) * 100);
              };

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="h-full cursor-pointer transform transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl"
                >
                  <ProjectCard
                    project={{
                      ...project,
                      progress: getProgress(project.startDate, project.endDate),
                    }}
                    darkMode={darkMode}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`mt-10 text-center p-10 rounded-xl shadow-lg border ${
              darkMode
                ? "bg-gray-800/70 border-gray-700 backdrop-blur-sm"
                : "bg-white/80 border-gray-100 backdrop-blur-sm"
            } max-w-2xl mx-auto animate-fade-in`}
          >
            <div className="flex flex-col items-center">
              {searchQuery ||
              statusFilter !== "All Status" ||
              categoryFilter !== "All Categories" ? (
                <>
                  <div
                    className={`p-4 rounded-full mb-5 ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-16 w-16 ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    No matching projects found
                  </h3>
                  <p
                    className={`mt-3 max-w-md text-lg ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    We couldn't find any projects that match your current
                    filters.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className={`px-4 py-2 rounded-lg flex items-center ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        } transition-colors`}
                      >
                        <span>Clear Search</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                    {statusFilter !== "All Status" && (
                      <button
                        onClick={() => setStatusFilter("All Status")}
                        className={`px-4 py-2 rounded-lg flex items-center ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        } transition-colors`}
                      >
                        <span>Clear Status Filter</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                    {categoryFilter !== "All Categories" && (
                      <button
                        onClick={() => setCategoryFilter("All Categories")}
                        className={`px-4 py-2 rounded-lg flex items-center ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        } transition-colors`}
                      >
                        <span>Clear Category Filter</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`p-5 rounded-full mb-6 ${
                      darkMode
                        ? "bg-gradient-to-br from-blue-900/50 to-purple-900/50"
                        : "bg-gradient-to-br from-blue-100 to-purple-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-20 w-20 ${
                        darkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3
                    className={`text-2xl font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    No projects yet
                  </h3>
                  <p
                    className={`mt-3 max-w-md text-lg ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {isStudent
                      ? "You haven't been assigned to any projects yet."
                      : "Create your first project to start tracking your work."}
                  </p>
                  {!isStudent && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="mt-8 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Create New Project
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm bg-opacity-60 p-4">
            <div
              className={`w-full max-w-md p-6 rounded-lg ${
                darkMode ? "bg-gray-800" : "bg-white"
              } shadow-xl animate-fade-in transform transition-all duration-300`}
            >
              <div className="flex items-start mb-4">
                <div
                  className={`p-2 rounded-full mr-3 ${
                    darkMode ? "bg-red-900/30" : "bg-red-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${
                      darkMode ? "text-red-400" : "text-red-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Confirm Delete
                  </h3>
                  <p
                    className={`my-3 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Are you sure you want to delete this project? This action
                    cannot be undone and all associated data will be permanently
                    removed.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProjectConfirm}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
        <ProjectSidebar
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onDelete={handleDeleteProject}
          darkMode={darkMode}
        />
        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
              darkMode
                ? "bg-gray-800 text-blue-400 hover:bg-gray-700"
                : "bg-white text-blue-600 hover:bg-blue-50"
            } z-30`}
            title="Scroll to top"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Projects;
