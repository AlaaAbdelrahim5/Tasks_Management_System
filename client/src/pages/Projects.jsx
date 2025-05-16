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
        className={`rounded-xl shadow-lg overflow-hidden animate-pulse
        ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <div
          className={`h-3 w-1/3 m-4 rounded ${
            darkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        ></div>
        <div
          className={`h-32 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div className="p-4 space-y-3">
          <div
            className={`h-4 w-3/4 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          ></div>
          <div
            className={`h-4 w-1/2 rounded ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          ></div>
          <div className="flex justify-between mt-4">
            <div
              className={`h-6 w-1/4 rounded ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`h-6 w-1/4 rounded ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            ></div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div
      className={`pt-16 pb-4 min-h-screen ${
        darkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="m-4 max-w-screen-2xl mx-8">
        {notification.show && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-fade-in transition-all ${
              notification.type === "error"
                ? darkMode
                  ? "bg-red-900/90 text-red-100"
                  : "bg-red-100 text-red-800 border border-red-200"
                : notification.type === "success"
                ? darkMode
                  ? "bg-green-900/90 text-green-100"
                  : "bg-green-100 text-green-800 border border-green-200"
                : darkMode
                ? "bg-yellow-900/90 text-yellow-100"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
            } flex items-center justify-between`}
          >
            <div className="flex items-center">
              {notification.type === "error" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {notification.type === "success" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {notification.type === "warning" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() =>
                setNotification((prev) => ({ ...prev, show: false }))
              }
              className="ml-4 text-sm opacity-70 hover:opacity-100"
            >
              &times;
            </button>
          </div>        )}

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                {isStudent ? "Your Projects" : "Projects Overview"}
              </h1>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage and track your project portfolio
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg ${darkMode ? "bg-blue-900/30" : "bg-blue-100"}`}>
              <span className={`font-medium ${darkMode ? "text-blue-300" : "text-blue-700"}`}>
                {sortedProjects.length} {sortedProjects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-2">
            {!isStudent && (
              <button
                onClick={() => setShowForm(true)}
                className={`px-4 py-2.5 rounded-lg shadow-md transition-all ${
                  darkMode
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                }`}
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
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
                </span>
              </button>
            )}

            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search projects by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-3 py-2 rounded w-full pr-10 transition-colors ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "border border-gray-400 text-gray-800 placeholder-gray-600"
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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded transition-colors ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "border border-gray-400 text-gray-800"
              }`}
            >
              <option>All Status</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-3 py-2 rounded transition-colors ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "border border-gray-400 text-gray-800"
              }`}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded transition-colors ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "border border-gray-400 text-gray-800"
              }`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueDate">Due Date</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="w-full max-w-lg p-1 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl">
              <form
                onSubmit={handleAddProject}
                className={`p-6 rounded-xl shadow-lg w-full max-h-[90vh] overflow-y-auto ${formBg} transition-all duration-300`}
              >
                <h2 className="text-2xl font-bold text-center mb-6">
                  Create New Project
                  <div className="mt-2 w-24 h-1 bg-blue-500 mx-auto rounded-full" />
                </h2>

                <div className="space-y-4">
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
                      className={`w-full p-4 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all min-h-[100px]`}
                      rows={4}
                      required
                    />
                    <label
                      className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}
                    >
                      Description
                    </label>
                  </div>

                  <div className="relative">
                    <select
                      name="students"
                      multiple
                      value={formData.students}
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all h-32`}
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
                    <div className="text-xs text-gray-500 mt-1">
                      Hold Ctrl/Cmd key to select multiple students
                    </div>
                  </div>

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

                  {dateError && (
                    <div
                      className={`text-red-500 text-sm p-3 rounded-lg border border-red-400 ${
                        darkMode ? "bg-red-900 bg-opacity-20" : "bg-red-50"
                      }`}
                    >
                      <span className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {dateError}
                      </span>
                    </div>
                  )}

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

                <div className="flex justify-end items-center gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setDateError("");
                    }}
                    className={`px-5 py-2.5 rounded-lg font-medium border-2 ${
                      darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100"
                    } transition-all duration-200`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200`}
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}        {isLoading ? (
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

              return (                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="h-full cursor-pointer transform hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
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
            className={`mt-10 text-center p-8 rounded-lg ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-16 w-16 mx-auto ${
                darkMode ? "text-gray-600" : "text-gray-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3
              className={`text-xl mt-4 font-medium ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No projects found
            </h3>
            <p
              className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {searchQuery ||
              statusFilter !== "All Status" ||
              categoryFilter !== "All Categories"
                ? "Try adjusting your filters to see more results"
                : "Create a new project to get started"}
            </p>
            {!isStudent && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Project
              </button>
            )}
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              className={`w-full max-w-md p-6 rounded-lg ${
                darkMode ? "bg-gray-800" : "bg-white"
              } shadow-xl`}
            >
              <h3
                className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Confirm Delete
              </h3>
              <p
                className={`my-4 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Are you sure you want to delete this project? This action cannot
                be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                  }}
                  className={`px-4 py-2 rounded ${
                    darkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProjectConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
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
      </div>
    </div>
  );
};

export default Projects;
