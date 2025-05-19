import React, { useContext, useEffect, useState, useRef } from "react";
import { ThemeContext } from "../App";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaFileExport,
  FaKeyboard,
  FaBell,
  FaArrowUp,
} from "react-icons/fa";
import TaskForm from "../components/TaskForm";
import AddTaskForm from "../components/AddTaskForm";
import DashboardChart from "../components/DashboardChart";

const Tasks = () => {
  // Add console logs for debugging 
  console.log("Tasks component is rendering");
  
  const { darkMode } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [sortBy, setSortBy] = useState("Tasks Status");
  const [filterBy, setFilterBy] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    assignedStudent: "",
    status: "In Progress",
    dueDate: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const taskActionRef = useRef(null);
  
  // Add loading and error states for debugging
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUsername = user?.username;
  const isStudent = user?.isStudent;

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  // Filter tasks when tasks, searchTerm, or filterBy changes
  useEffect(() => {
    let result = [...tasks];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.name.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.project.toLowerCase().includes(searchLower) ||
        task.assignedStudent.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (filterBy !== 'All') {
      result = result.filter(task => task.status === filterBy);
    }
    
    setFilteredTasks(result);
  }, [tasks, searchTerm, filterBy]);
  
  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only process shortcuts when not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('task-search').focus();
      }
      
      // Ctrl/Cmd + N for new task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowAddTaskForm(true);
      }
      
      // / to focus search
      if (e.key === '/' && document.activeElement === document.body) {
        e.preventDefault();
        document.getElementById('task-search').focus();
      }
      
      // ? to show keyboard shortcuts
      if (e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }

      // H to show help
      if (e.key === 'h' && document.activeElement === document.body) {
        e.preventDefault();
        setShowHelp(true);
      }
      
      // Esc to close modals
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
        setShowHelp(false);
        if (!showForm && !showAddTaskForm && !showDeleteConfirm) {
          setSearchTerm('');
          document.getElementById('task-search').blur();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForm, showAddTaskForm, showDeleteConfirm]);

  const showNotification = (message, type) => {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query { getProjects { id title students startDate endDate } }`,
        }),
      });
      const { data } = await res.json();
      setProjects(data.getProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      showNotification("Failed to fetch projects", "error");
    }
  };
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching tasks. Is student:", isStudent, "Username:", currentUsername);
        const query = isStudent
        ? `query {
            getStudentTasks(username: "${currentUsername}") {
              id project name description assignedStudent status dueDate
            }
          }`
        : `query {
            getTasks {
              id project name description assignedStudent status dueDate
            }
          }`;

      console.log("GraphQL query:", query);
      
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const responseJson = await res.json();
      console.log("Tasks response:", responseJson);
      
      if (responseJson.errors) {
        throw new Error(responseJson.errors[0].message);
      }      const taskData = isStudent ? responseJson.data?.getStudentTasks || [] : responseJson.data?.getTasks || [];
      console.log("Parsed tasks:", taskData);
      setTasks(taskData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(error.message || "Failed to fetch tasks");
      showNotification("Failed to fetch tasks: " + error.message, "error");
      setIsLoading(false);
      // Set empty tasks array to prevent blank screen
      setTasks([]);
    }
  };

  const fetchStudents = async (projectId) => {
    try {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return;

      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query { getStudents { username email } }`,
        }),
      });

      const { data } = await res.json();
      setStudents(
        data.getStudents.filter((s) => proj.students.includes(s.username))
      );
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification("Failed to fetch students for this project", "error");
    }
  };

  const openForm = (task) => {
    if (task) {
      setEditingTask(task);      setFormData({
        project: task.project,
        name: task.name,
        description: task.description,
        assignedStudent: task.assignedStudent,
        status: task.status,
        dueDate: task.dueDate,
      });
      const proj = projects.find((p) => p.title === task.project);
      if (proj) fetchStudents(proj.id);    } else {
      setEditingTask(null);
      setFormData({
        project: "",
        name: "",
        description: "",
        assignedStudent: "",
        status: "In Progress",
        dueDate: "",
      });
    }
    setShowForm(true);
  };

  const handleFieldChange = (name, value) => {
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const saveTask = async (data) => {
    try {
      if (editingTask) {
        const mutation = `
          mutation UpdateTask($id: ID!, $input: TaskInput!) {
            updateTask(id: $id, taskInput: $input) { id }
          }
        `;
        const res = await fetch("http://localhost:4000/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: mutation,
            variables: { id: editingTask.id, input: data },
          }),
        });

        const json = await res.json();
        if (json.errors) {
          showNotification(json.errors[0].message, "error");
          return;
        }

        showNotification(
          `Task "${data.name}" updated successfully!`,
          "success"
        );
      } else {
        const mutation = `
          mutation AddTask($input: TaskInput!) {
            addTask(taskInput: $input) { id }
          }
        `;
        const res = await fetch("http://localhost:4000/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: mutation,
            variables: { input: data },
          }),
        });

        const json = await res.json();
        if (json.errors) {
          showNotification(json.errors[0].message, "error");
          return;
        }

        showNotification(
          `Task "${data.name}" created successfully!`,
          "success"
        );
      }

      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      showNotification(
        `Failed to ${editingTask ? "update" : "add"} task.`,
        "error"
      );
    }
  };

  const handleAddTask = async (taskData) => {
    try {
      const mutation = `
        mutation AddTask($input: TaskInput!) {
          addTask(taskInput: $input) { id }
        }
      `;
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { input: taskData },
        }),
      });

      const json = await res.json();
      if (json.errors) {
        showNotification(json.errors[0].message, "error");
        return;
      }

      setShowAddTaskForm(false);
      showNotification(
        `Task "${taskData.name}" added successfully!`,
        "success"
      );
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      showNotification("Failed to add task.", "error");
    }
  };

  const showDeleteTaskConfirm = (task) => {
    setDeletingTask(task);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      const mutation = `
        mutation DeleteTask($id: ID!) {
          deleteTask(id: $id) {
            id
          }
        }
      `;

      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { id: deletingTask.id },
        }),
      });

      const json = await res.json();
      if (json.errors) {
        showNotification(json.errors[0].message, "error");
        return;
      }

      showNotification(
        `Task "${deletingTask.name}" deleted successfully!`,
        "success"
      );
      fetchTasks();
      setShowDeleteConfirm(false);
      setDeletingTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      showNotification("Failed to delete task.", "error");
    }
  };

  const updateTaskStatus = async (id, status, taskName) => {
    try {
      const mutation = `
        mutation UpdateTaskStatus($id: ID!, $status: String!) {
          updateTaskStatus(id: $id, status: $status) { id status }
        }
      `;
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation, variables: { id, status } }),
      });

      const json = await res.json();
      if (json.errors) {
        showNotification(json.errors[0].message, "error");
        return;
      }

      showNotification(
        `Task "${taskName}" status updated to ${status}`,
        "success"
      );
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      showNotification("Failed to update task status.", "error");
    }
  };

  // Function to export tasks to CSV
  const exportTasksToCSV = () => {
    try {
      // Create CSV header
      let csvContent = "ID,Project,Name,Description,Assigned Student,Status,Due Date\n";
      // Add each task as a row
      const tasksToExport = searchTerm.trim() || filterBy !== 'All' ? filteredTasks : tasks;
      
      tasksToExport.forEach(task => {
        // Escape fields that might contain commas or quotes
        const escapeField = (field) => {
          if (!field && field !== 0) return '""';
          const stringField = String(field);
          // If the field contains commas, quotes, or newlines, wrap in quotes and escape any quotes
          if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        };
          // Format the row with proper escaping
        const row = [
          escapeField(task.id),
          escapeField(task.project),
          escapeField(task.name),
          escapeField(task.description),
          escapeField(task.assignedStudent),
          escapeField(task.status),
          escapeField(task.dueDate)
        ].join(',');
        
        csvContent += row + '\n';
      });
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up and trigger download
      link.setAttribute('href', url);
      link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('Tasks exported successfully!', 'success');
    } catch (error) {
      console.error("Error exporting tasks:", error);
      showNotification("Failed to export tasks", "error");
    }
  };

  const handleStatusClick = (task) => {
    const options = [
      "In Progress",
      "Completed",
      "Pending",
      "On Hold",
      "Cancelled",
    ];
    const idx = options.indexOf(task.status);
    const newStatus = options[(idx + 1) % options.length];
    updateTaskStatus(task.id, newStatus, task.name);
  };

  const handleSort = (a, b) => {
    switch (sortBy) {
      case "Project":
        return a.project.localeCompare(b.project);
      case "Due Date":
        return new Date(a.dueDate) - new Date(b.dueDate);
      case "Assigned Student":
        return a.assignedStudent.localeCompare(b.assignedStudent);      default:
        return a.status.localeCompare(b.status);
    }
  };

  // Add scroll to top functionality
  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Add scroll event listener to show/hide scroll-to-top button
  useEffect(() => {
    const scrollBtn = document.getElementById('scroll-to-top');
    
    const toggleScrollButton = () => {
      if (scrollBtn) {
        if (window.pageYOffset > 300) {
          scrollBtn.classList.remove('opacity-0', 'invisible');
          scrollBtn.classList.add('opacity-100', 'visible');
        } else {
          scrollBtn.classList.add('opacity-0', 'invisible');
          scrollBtn.classList.remove('opacity-100', 'visible');
        }
      }
    };
    
    window.addEventListener('scroll', toggleScrollButton);
    return () => window.removeEventListener('scroll', toggleScrollButton);
  }, []);
  
  const statusColors = {
    Pending: darkMode
      ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-yellow-100"
      : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800",
    "In Progress": darkMode
      ? "bg-gradient-to-r from-blue-700 to-blue-600 text-blue-100"
      : "bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900",
    "On Hold": darkMode
      ? "bg-gradient-to-r from-orange-700 to-orange-600 text-orange-100"
      : "bg-gradient-to-r from-orange-200 to-orange-300 text-orange-900",
    Completed: darkMode
      ? "bg-gradient-to-r from-green-700 to-green-600 text-green-100"
      : "bg-gradient-to-r from-green-200 to-green-300 text-green-900",
    Cancelled: darkMode
      ? "bg-gradient-to-r from-red-700 to-red-600 text-red-100"
      : "bg-gradient-to-r from-red-200 to-red-300 text-red-900",
  };

  

  const thClass = `px-6 py-5 align-middle text-center font-extrabold uppercase tracking-wider text-base border-b-4 ${
    darkMode
      ? "text-white border-gray-700 bg-gradient-to-b from-gray-900 to-gray-700 shadow-inner"
      : "text-blue-900 border-blue-200 bg-gradient-to-b from-blue-100 to-white shadow-sm"
  } group transition-all duration-200`;
  const tdClass = `px-6 py-4 align-middle text-center text-base border-b whitespace-normal break-words ${
    darkMode ? "text-gray-100 border-gray-700" : "text-gray-900 border-blue-100"
  }`;
  return (
    <div
      className={`pt-24 min-h-screen pb-10 px-2 md:px-8 transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 bg-fixed"
          : "bg-gradient-to-br from-blue-100 via-white to-blue-200 bg-fixed"
      }`}
    >
      {/* Debug Info */}
      {error && (
        <div className={`p-4 mb-4 rounded-xl ${darkMode ? 'bg-red-900/40 text-red-200' : 'bg-red-100 text-red-800'} border-2 ${darkMode ? 'border-red-800' : 'border-red-300'}`}>
          <h3 className="text-lg font-bold">Error Loading Tasks</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchTasks();
            }}
            className={`mt-2 px-4 py-2 rounded-md ${darkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <div className={`p-4 rounded-full ${darkMode ? 'bg-blue-900/40' : 'bg-blue-100'} animate-pulse`}>
            <svg className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification.show && (
        <div
          className={`fixed top-24 right-4 z-50 p-5 rounded-2xl shadow-2xl max-w-md animate-slide-in-right border-2 backdrop-blur-sm
            ${
              notification.type === "error"
                ? darkMode
                  ? "bg-red-900/90 text-white border-red-700"
                  : "bg-red-100/90 text-red-800 border-red-300"
                : notification.type === "success"
                ? darkMode
                  ? "bg-green-900/90 text-white border-green-700"
                  : "bg-green-100/90 text-green-800 border-green-300"
                : darkMode
                ? "bg-yellow-900/90 text-white border-yellow-700"
                : "bg-yellow-100/90 text-yellow-800 border-yellow-300"
            } flex items-center justify-between transition-all duration-300 transform hover:scale-102`}
        >
          <div className="flex items-center">
            {notification.type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-3"
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
                className="h-6 w-6 mr-3"
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
                className="h-6 w-6 mr-3"
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
            <span className="font-semibold text-lg">
              {notification.message}
            </span>
          </div>
          <button
            onClick={() =>
              setNotification((prev) => ({ ...prev, show: false }))
            }
            className="ml-4 text-2xl opacity-70 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}
      {/* Header Section */}
      <div className="mb-10 animate-fade-in">
        <div className="relative mb-6">
          <h1
            className={`text-4xl font-extrabold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            <span className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}>
              Task{" "}
            </span>
            Management Dashboard
          </h1>
          <div
            className={`h-1.5 w-32 mt-3 rounded-full ${
              darkMode
                ? "bg-gradient-to-r from-blue-600 to-indigo-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-400"
            }`}
          ></div>
          <p
            className={`mt-3 text-lg ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Create, assign, and track tasks across all your projects with ease
          </p>
        </div>

        {/* Search and filters row */}
        <div className={`flex flex-col lg:flex-row gap-4 items-start lg:items-center ${
          darkMode ? "text-white" : "text-gray-800"
        }`}>
          {/* Search box */}
          <div className={`relative flex-grow lg:max-w-md`}>
            <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none`}>
              <FaSearch className={`${darkMode ? "text-gray-400" : "text-gray-500"}`} />
            </div>
            <input
              id="task-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks by name, project, or student..."
              className={`w-full py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                darkMode
                  ? "bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500"
                  : "bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500"
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                } hover:text-gray-700`}
              >
                <span className="text-xl">&times;</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <FaFilter className={showFilters ? (darkMode ? "text-blue-400" : "text-blue-600") : ""} />
              <span>Filters {filterBy !== "All" && `(${filterBy})`}</span>
            </button>

            {/* Export button */}
            <button
              onClick={exportTasksToCSV}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
              title="Export tasks to CSV"
            >
              <FaFileExport />
              <span className="hidden md:inline">Export Tasks</span>
            </button>            {/* Keyboard shortcuts button */}
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
              title="Keyboard shortcuts"
            >
              <FaKeyboard />
              <span className="hidden md:inline">Shortcuts</span>
            </button>

            {/* Help button */}
            <button
              onClick={() => setShowHelp(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
                darkMode
                  ? "bg-blue-700 border-blue-600 hover:bg-blue-600 text-white"
                  : "bg-blue-500 border-blue-400 hover:bg-blue-600 text-white"
              }`}
              title="Help"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">Help</span>
            </button>
          </div>
        </div>

        {/* Filter dropdown */}
        {showFilters && (
          <div className={`mt-4 p-6 rounded-xl shadow-lg animate-fade-in-down ${
            darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
          }`}>
            <div className="mb-3">
              <h3 className="font-bold mb-2">Filter by Status:</h3>
              <div className="flex flex-wrap gap-2">
                {["All", "In Progress", "Completed", "Pending", "On Hold", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterBy(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filterBy === status
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-2">
              <h3 className="font-bold mb-2">Sort by:</h3>
              <div className="flex flex-wrap gap-2">
                {["Tasks Status", "Project", "Due Date", "Assigned Student"].map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setSortBy(sort)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      sortBy === sort
                        ? darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white"
                        : darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row justify-between px-2 md:px-6 pt-2 mb-8 gap-4">
        <div
          className={`p-3 md:p-4 rounded-xl ${
            darkMode
              ? "bg-gray-800/50 backdrop-blur-sm"
              : "bg-white/50 backdrop-blur-sm"
          } shadow-md flex gap-2 items-center`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <label
            className={`text-lg font-semibold ${
              darkMode ? "text-white" : "text-blue-900"
            }`}
          >
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 shadow-md hover:shadow-lg font-semibold ${
              darkMode
                ? "bg-gray-800/90 text-white border-gray-600 hover:bg-gray-700"
                : "bg-white/90 text-blue-900 border-blue-300 hover:border-blue-400"
            }`}
          >
            <option>Tasks Status</option>
            <option>Project</option>
            <option>Due Date</option>
            <option>Assigned Student</option>

          </select>
        </div>
        <button
          onClick={() => setShowAddTaskForm(true)}
          className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-300 border-2 text-lg tracking-wide transform hover:scale-105 flex items-center justify-center gap-2
            ${
              darkMode
                ? "bg-gradient-to-r from-blue-800 to-blue-600 text-white border-blue-800 hover:from-blue-700 hover:to-indigo-600 hover:border-blue-700 hover:shadow-blue-700/30"
                : "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-500 hover:from-blue-500 hover:to-indigo-600 hover:border-blue-400 hover:shadow-blue-500/30"
            }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create a New Task
        </button>
      </div>{" "}
      <div
        className={`mx-auto max-w-7xl shadow-2xl rounded-3xl overflow-hidden border-4 transform transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 ${
          darkMode
            ? "bg-gray-900 border-gray-800 backdrop-blur-sm"
            : "bg-white/90 border-blue-200 backdrop-blur-sm"
        }`}
      >
        <table className="tasks-table table-fixed w-full border-collapse rounded-3xl overflow-hidden">
          <thead>
            {" "}
            <tr>
              {" "}              {[
                "Task ID",
                "Project",
                "Name",
                "Description",
                "Student",
                "Status",
                "Due Date",
                "Actions",
              ].map((h) => {
                // Set column widths
                const columnWidthClass =
                  h === "Description"
                    ? "w-1/4"
                    : h === "Name"
                    ? "w-1/8"
                    : h === "Actions"
                    ? "w-[100px]"
                    : h === "Task ID"
                    ? "w-[80px]"                    : h === "Status"
                    ? "w-[120px]"
                    : "";

                return (
                  <th key={h} className={`${thClass} ${columnWidthClass}`}>
                    <div className="flex items-center gap-1 group text-center">
                      <span className="group-hover:text-blue-500 transition-colors duration-200 text-center mx-auto">
                        {h}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[...(filteredTasks.length > 0 ? filteredTasks : tasks)].sort(handleSort).map((task, idx) => (
              <tr
                key={task.id}
                className={`transition-all duration-200 animate-fade-in ${
                  idx % 2 === 0
                    ? darkMode
                      ? "bg-gray-900/90"
                      : "bg-blue-50/90"
                    : darkMode
                    ? "bg-gray-800/90"
                    : "bg-white/90"
                } hover:scale-[1.01] hover:shadow-xl hover:z-10 relative`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {" "}
                <td className={tdClass}>
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-mono text-sm font-bold ${
                      darkMode
                        ? "bg-blue-900/50 text-blue-300 border border-blue-800"
                        : "bg-blue-100 text-blue-700 border border-blue-200"
                    }`}
                  >
                    #{task.id}
                  </span>
                </td>{" "}
                <td className={tdClass}>
                  <span
                    className={`inline-block px-4 py-2 rounded-lg font-bold ${
                      darkMode
                        ? "bg-indigo-900/40 text-indigo-300 border border-indigo-800"
                        : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    }`}
                  >
                    {task.project}
                  </span>
                </td>{" "}
                <td className={tdClass}>
                  <span className="font-bold text-base block text-center">
                    {task.name}
                  </span>
                  <div
                    className={`h-1 w-12 mt-1 rounded-full mx-auto ${
                      darkMode
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gradient-to-r from-blue-400 to-purple-400"
                    }`}
                  ></div>{" "}
                </td>{" "}
                <td className={`${tdClass} max-w-0`}>
                  <div className="description-cell custom-scrollbar mx-auto">
                    <p
                      className="description-text break-words hyphens-auto text-center"
                      title={task.description}
                    >
                      {task.description}
                    </p>
                    <button
                      className={`mt-1 text-xs font-medium ${
                        darkMode
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-800"
                      }`}
                      onClick={() => {
                        // Replace alert with a better UI for viewing full description
                        const modal = document.createElement("div");
                        modal.className =
                          "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";
                        modal.onclick = () => document.body.removeChild(modal);

                        const content = document.createElement("div");
                        content.className = `max-w-lg max-h-[80vh] overflow-y-auto p-6 rounded-lg ${
                          darkMode ? "bg-gray-800" : "bg-white"
                        } shadow-xl custom-scrollbar`;
                        content.onclick = (e) => e.stopPropagation();

                        const title = document.createElement("h3");
                        title.className = `font-bold text-xl mb-3 ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`;
                        title.textContent = "Task Description";

                        const desc = document.createElement("p");
                        desc.className = `${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        } whitespace-pre-wrap`;
                        desc.textContent = task.description;

                        const closeBtn = document.createElement("button");
                        closeBtn.className = `mt-4 px-4 py-2 rounded-md ${
                          darkMode
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        } text-sm`;
                        closeBtn.textContent = "Close";
                        closeBtn.onclick = () =>
                          document.body.removeChild(modal);

                        content.appendChild(title);
                        content.appendChild(desc);
                        content.appendChild(closeBtn);
                        modal.appendChild(content);
                        document.body.appendChild(modal);
                      }}
                    >
                      {task.description.length > 50 ? "Show more..." : ""}
                    </button>
                  </div>
                </td>{" "}
                <td className={tdClass}>
                  <div className="flex items-center justify-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                        darkMode
                          ? "bg-blue-800 text-blue-100"
                          : "bg-blue-200 text-blue-800"
                      }`}
                    >
                      {task.assignedStudent.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{task.assignedStudent}</span>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle text-center">
                  <button
                    onClick={() => handleStatusClick(task)}
                    className={`font-bold px-5 py-2 rounded-full shadow-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 cursor-pointer ${
                      statusColors[task.status]
                    } hover:scale-105 hover:shadow-lg`}
                  >
                    {task.status}
                  </button>                </td>
                <td className={tdClass}>
                  <span
                    className={`inline-block px-3 py-1 rounded-lg font-mono text-sm font-semibold ${
                      new Date(task.dueDate) < new Date()
                        ? darkMode
                          ? "bg-red-900/40 text-red-300 border border-red-800"
                          : "bg-red-100 text-red-700 border border-red-200"
                        : new Date(task.dueDate) <
                          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
                        ? darkMode
                          ? "bg-yellow-900/40 text-yellow-300 border border-yellow-800"
                          : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : darkMode
                        ? "bg-green-900/40 text-green-300 border border-green-800"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }`}
                  >
                    {task.dueDate}
                  </span>
                </td>{" "}
                <td className="px-6 py-4 align-middle text-center">
                  <div className="inline-flex items-center justify-center space-x-2">
                    {" "}
                    <button
                      onClick={() => openForm(task)}
                      className={`p-2 rounded-full ${
                        darkMode
                          ? "bg-blue-800 hover:bg-blue-700 text-blue-200 hover:text-white border-blue-700"
                          : "bg-blue-200 hover:bg-blue-300 text-blue-700 hover:text-blue-900 border-blue-300"
                      } shadow hover:shadow-md transition-all duration-200 border-2 transform hover:scale-110`}
                      title="Edit Task"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => showDeleteTaskConfirm(task)}
                      className={`p-2 rounded-full ${
                        darkMode
                          ? "bg-red-800 hover:bg-red-700 text-red-200 hover:text-white border-red-700"
                          : "bg-red-200 hover:bg-red-300 text-red-700 hover:text-red-900 border-red-300"
                      } shadow hover:shadow-md transition-all duration-200 border-2 transform hover:scale-110`}
                      title="Delete Task"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-16 text-xl text-gray-400 font-semibold"
                >
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-16 w-16 ${
                        darkMode ? "text-gray-600" : "text-gray-400"
                      } mb-4`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p
                      className={`${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      No tasks found.
                    </p>
                    <button
                      onClick={() => setShowAddTaskForm(true)}
                      className={`mt-4 px-6 py-2 text-sm font-medium rounded-full ${
                        darkMode
                          ? "bg-blue-700 text-white hover:bg-blue-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      } transition-colors duration-200`}
                    >
                      Add your first task
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>{" "}
      {/* Task Statistics and Charts */}
      {tasks.length > 0 && (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Summary */}
          <div
            className={`p-6 rounded-2xl shadow-lg ${
              darkMode
                ? "bg-gray-800/50 backdrop-blur-sm"
                : "bg-white/60 backdrop-blur-sm"
            } animate-fade-in`}
          >
            <h3
              className={`text-xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Task Status Summary
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/80" : "bg-blue-50/80"
                }`}
              >
                <span className="text-sm font-medium">Total Tasks</span>
                <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {tasks.length}
                </span>
              </div>

              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/80" : "bg-green-50/80"
                }`}
              >
                <span className="text-sm font-medium">Completed</span>
                <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {tasks.filter((t) => t.status === "Completed").length}
                </span>
              </div>

              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/80" : "bg-blue-50/80"
                }`}
              >
                <span className="text-sm font-medium">In Progress</span>
                <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  {tasks.filter((t) => t.status === "In Progress").length}
                </span>
              </div>

              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/80" : "bg-yellow-50/80"
                }`}
              >
                <span className="text-sm font-medium">Pending</span>
                <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-yellow-400" : "text-yellow-600"
                  }`}
                >
                  {tasks.filter((t) => t.status === "Pending").length}
                </span>
              </div>

              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/80" : "bg-orange-50/80"
                }`}
              >
                <span className="text-sm font-medium">On Hold</span>
                <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-orange-400" : "text-orange-600"
                  }`}
                >
                  {tasks.filter((t) => t.status === "On Hold").length}
                </span>
              </div>

              <div
                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${
                  darkMode ? "bg-gray-900/80" : "bg-red-50/80"
                }`}
              >
                <span className="text-sm font-medium">Cancelled</span>
                <span
                  className={`text-2xl font-bold ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`}
                >
                  {tasks.filter((t) => t.status === "Cancelled").length}
                </span>
              </div>
            </div>

            {/* Due Date Analysis */}
            <div className="mt-6">
              <h4 className={`text-lg font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Due Date Analysis
              </h4>
              <div className="flex flex-wrap gap-4">
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl flex-1 ${
                    darkMode ? "bg-gray-900/80" : "bg-red-50/80"
                  }`}
                >
                  <FaBell className={darkMode ? "text-red-400" : "text-red-500"} />
                  <div>
                    <span className="text-sm font-medium block">Overdue</span>
                    <span
                      className={`text-lg font-bold ${
                        darkMode ? "text-red-400" : "text-red-600"
                      }`}
                    >
                      {tasks.filter(t => new Date(t.dueDate) < new Date()).length}
                    </span>
                  </div>
                </div>
                
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl flex-1 ${
                    darkMode ? "bg-gray-900/80" : "bg-yellow-50/80"
                  }`}
                >
                  <FaArrowUp className={`transform rotate-45 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`} />
                  <div>
                    <span className="text-sm font-medium block">Due Soon</span>
                    <span
                      className={`text-lg font-bold ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`}
                    >
                      {tasks.filter(t => {
                        const dueDate = new Date(t.dueDate);
                        const today = new Date();
                        const threeDaysLater = new Date();
                        threeDaysLater.setDate(today.getDate() + 3);
                        return dueDate >= today && dueDate <= threeDaysLater;
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Task Chart */}
          <div
            className={`p-6 rounded-2xl shadow-lg ${
              darkMode
                ? "bg-gray-800/50 backdrop-blur-sm"
                : "bg-white/60 backdrop-blur-sm"
            } animate-fade-in flex flex-col`}
          >
            <h3
              className={`text-xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Task Visualization
            </h3>
              <div className="flex-grow flex justify-center items-center">
                <DashboardChart 
                data={{
                  labels: ['Completed', 'In Progress', 'Pending', 'On Hold', 'Cancelled'],
                  values: [
                    tasks.filter(t => t.status === 'Completed').length,
                    tasks.filter(t => t.status === 'In Progress').length,
                    tasks.filter(t => t.status === 'Pending').length,
                    tasks.filter(t => t.status === 'On Hold').length,
                    tasks.filter(t => t.status === 'Cancelled').length
                  ],
                  colors: [
                    darkMode ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)', // green
                    darkMode ? 'rgba(96, 165, 250, 0.85)' : 'rgba(59, 130, 246, 0.85)', // blue
                    darkMode ? 'rgba(251, 191, 36, 0.85)' : 'rgba(245, 158, 11, 0.85)', // yellow
                    darkMode ? 'rgba(251, 146, 60, 0.85)' : 'rgba(249, 115, 22, 0.85)', // orange
                    darkMode ? 'rgba(248, 113, 113, 0.85)' : 'rgba(239, 68, 68, 0.85)'  // red
                  ]
                }}
                darkMode={darkMode}
                chartType="doughnut"
              />
            </div>
          </div>
        </div>
      )}
      {/* Delete Task Confirmation Dialog */}
      {showDeleteConfirm && deletingTask && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center ${
            darkMode
              ? "bg-gray-900/90 backdrop-blur-sm"
              : "bg-gray-100/90 backdrop-blur-sm"
          }`}
        >
          <div
            className={`max-w-sm w-full p-8 rounded-3xl shadow-2xl border-4 transform transition-all duration-300 animate-fade-in ${
              darkMode
                ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700"
                : "bg-gradient-to-br from-white to-blue-50 border-blue-200"
            }`}
          >
            <div className="mb-6 text-center">
              <div
                className={`mx-auto rounded-full w-16 h-16 flex items-center justify-center mb-4 ${
                  darkMode ? "bg-red-900/30" : "bg-red-100"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-8 w-8 ${
                    darkMode ? "text-red-400" : "text-red-500"
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
              <p
                className={`font-extrabold text-xl ${
                  darkMode ? "text-red-300" : "text-red-600"
                }`}
              >
                Delete Task
              </p>
              <p
                className={`mt-2 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Are you sure you want to delete{" "}
                <span className="font-mono font-bold">{deletingTask.name}</span>
                ?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={confirmDeleteTask}
                className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-lg border-2 transition-all duration-200 hover:scale-105
                  ${
                    darkMode
                      ? "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white border-red-700"
                      : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-red-500"
                  }`}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingTask(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-lg border-2 transition-all duration-200 hover:scale-105
                  ${
                    darkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300"
                  }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Task Form */}
      <TaskForm
        show={showForm}
        darkMode={darkMode}
        projects={projects}
        students={students}
        initialData={formData}
        onFieldChange={handleFieldChange}
        onProjectChange={fetchStudents}
        onSave={saveTask}
        onClose={() => setShowForm(false)}
        isEditing={!!editingTask}
      />
      {/* Add Task Form */}
      {showAddTaskForm && (
        <AddTaskForm
          onClose={() => setShowAddTaskForm(false)}
          onSubmit={handleAddTask}
        />
      )}
      {/* Export Tasks Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={exportTasksToCSV}
          className={`px-4 py-2 rounded-full font-semibold shadow-md transition-all duration-300 flex items-center gap-2
            ${
              darkMode
                ? "bg-blue-800 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
        >
          <FaFileExport className="w-5 h-5" />
          Export Tasks
        </button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`}
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div 
            className={`m-4 max-w-md w-full p-6 rounded-xl shadow-2xl animate-fade-in ${
              darkMode
                ? "bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700"
                : "bg-white border-2 border-blue-100"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Keyboard Shortcuts
            </h3>
            
            <div className={`space-y-3 mb-5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              <div className="flex justify-between items-center">
                <span>Search tasks</span>
                <div className="flex space-x-1">
                  <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                    darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                  }`}>Ctrl</kbd>
                  <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                    darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                  }`}>K</kbd>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Add new task</span>
                <div className="flex space-x-1">
                  <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                    darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                  }`}>Ctrl</kbd>
                  <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                    darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                  }`}>N</kbd>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Alternative search</span>
                <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                }`}>/</kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Show keyboard shortcuts</span>
                <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                }`}>?</kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Close modals / Clear search</span>
                <kbd className={`px-2 py-1 rounded text-xs font-semibold ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-300"
                }`}>Esc</kbd>
              </div>
            </div>
            
            <button 
              onClick={() => setShowKeyboardShortcuts(false)}
              className={`w-full py-2 rounded-lg font-medium text-center ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm bg-opacity-50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className={`m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
              darkMode
                ? "bg-gradient-to-br from-gray-900 to-gray-800 text-gray-200"
                : "bg-white text-gray-800"
            } p-8`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 ">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${darkMode ? "text-blue-400" : "text-blue-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Task Management Help
              </h2>
              <button
                className={`p-2 rounded-full ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setShowHelp(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={`mb-8 p-4 rounded-xl ${darkMode ? "bg-blue-900/30 text-blue-100" : "bg-blue-50 text-blue-800"} border-l-4 ${darkMode ? "border-blue-700" : "border-blue-400"}`}>
              <p className="font-medium">
                This help guide will assist you in using all features of the Task Management Dashboard.
              </p>
            </div>

            <div className="space-y-8">
              {/* Basic Usage */}
              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Basic Usage
                </h3>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>View all tasks assigned to you or created by you</li>
                    <li>Click on the status button to cycle through different statuses</li>
                    <li>Use the edit button to modify task details</li>
                    <li>Use the delete button to remove tasks (requires confirmation)</li>
                    <li>Click "Create a New Task" to add a new task</li>
                  </ul>
                </div>
              </section>

              {/* Searching & Filtering */}
              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Searching & Filtering
                </h3>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Use the search box to find tasks by name, project, or assigned student</li>
                    <li>Click the filter button to filter tasks by status</li>
                    <li>Sort tasks by various criteria (Status, Project, Due Date, etc.)</li>
                    <li>Clear all filters using the chip at the bottom of the screen</li>
                  </ul>
                </div>
              </section>

              {/* Task Priorities */}              {/* Task Statuses */}
              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Task Statuses
                </h3>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className="mb-3">Tasks can have the following statuses:</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-700 text-white" : "bg-blue-200 text-blue-900"}`}>
                      <span className="font-bold">In Progress</span>
                      <p className="text-sm mt-1">Currently being worked on</p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-green-700 text-white" : "bg-green-200 text-green-900"}`}>
                      <span className="font-bold">Completed</span>
                      <p className="text-sm mt-1">Task has been finished</p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-yellow-700 text-white" : "bg-yellow-200 text-yellow-900"}`}>
                      <span className="font-bold">Pending</span>
                      <p className="text-sm mt-1">Not yet started</p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-orange-700 text-white" : "bg-orange-200 text-orange-900"}`}>
                      <span className="font-bold">On Hold</span>
                      <p className="text-sm mt-1">Temporarily paused</p>
                    </div>
                    <div className={`p-3 rounded-lg ${darkMode ? "bg-red-700 text-white" : "bg-red-200 text-red-900"}`}>
                      <span className="font-bold">Cancelled</span>
                      <p className="text-sm mt-1">No longer being pursued</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Keyboard Shortcuts */}
              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Keyboard Shortcuts
                </h3>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Search tasks</span>
                      <div className="flex space-x-1">
                        <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>Ctrl</kbd>
                        <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>K</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Add new task</span>
                      <div className="flex space-x-1">
                        <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>Ctrl</kbd>
                        <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>N</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Alternative search</span>
                      <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>/</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Show keyboard shortcuts</span>
                      <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>?</kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Close modals / Clear search</span>
                      <kbd className={`px-2 py-1 rounded text-xs font-semibold ${darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-200 border border-gray-300"}`}>Esc</kbd>
                    </div>
                  </div>
                </div>
              </section>

              {/* Exporting Data */}
              <section>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  Exporting Data
                </h3>
                <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p>
                    You can export your tasks to a CSV file by clicking the "Export Tasks" button in the toolbar.
                    The CSV file can be opened in Excel, Google Sheets, or any spreadsheet application.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <FaFileExport className={darkMode ? "text-blue-400" : "text-blue-600"} />
                    <span className="font-medium">Export Tasks</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className={`px-6 py-3 rounded-lg font-medium ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <button
        id="scroll-to-top"
        onClick={handleScrollToTop}
        className={`fixed right-6 bottom-6 p-3 rounded-full shadow-lg z-50 transition-all duration-300 opacity-0 invisible ${
          darkMode
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "bg-blue-500 text-white hover:bg-blue-400"
        }`}
        aria-label="Scroll to top"
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

      {/* Task Status View Chip - Shows when sorted or filtered */}
      {(filterBy !== "All" || sortBy !== "Tasks Status" || searchTerm) && (
        <div
          className={`fixed left-4 bottom-4 px-4 py-2 rounded-full shadow-lg z-40 ${
            darkMode
              ? "bg-gray-800 text-gray-200"
              : "bg-white text-gray-800"
          } flex items-center gap-2 text-sm border ${
            darkMode ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <span className="font-medium">
            {filterBy !== "All" && `Status: ${filterBy}`}
            {filterBy !== "All" && sortBy !== "Tasks Status" && " | "}
            {sortBy !== "Tasks Status" && `Sorted by: ${sortBy}`}
            {(filterBy !== "All" || sortBy !== "Tasks Status") && searchTerm && " | "}
            {searchTerm && `Search: "${searchTerm}"`}
          </span>
          <button
            onClick={() => {
              setFilterBy("All");
              setSortBy("Tasks Status");
              setSearchTerm("");
            }}
            className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            title="Clear all filters"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default Tasks;
