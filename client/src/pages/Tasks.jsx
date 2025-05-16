import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";
import { FaEdit, FaTrash } from "react-icons/fa";
import TaskForm from "../components/TaskForm";
import AddTaskForm from "../components/AddTaskForm";

const Tasks = () => {
  const { darkMode } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sortBy, setSortBy] = useState("Tasks Status");
  const [showForm, setShowForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [formData, setFormData] = useState({
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
    try {
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

      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const { data } = await res.json();
      setTasks(isStudent ? data.getStudentTasks : data.getTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showNotification("Failed to fetch tasks", "error");
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
      setStudents(data.getStudents.filter((s) => proj.students.includes(s.username)));
    } catch (error) {
      console.error("Error fetching students:", error);
      showNotification("Failed to fetch students for this project", "error");
    }
  };

  const openForm = (task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        project: task.project,
        name: task.name,
        description: task.description,
        assignedStudent: task.assignedStudent,
        status: task.status,
        dueDate: task.dueDate,
      });
      const proj = projects.find((p) => p.title === task.project);
      if (proj) fetchStudents(proj.id);
    } else {
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

        showNotification(`Task "${data.name}" updated successfully!`, "success");
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

        showNotification(`Task "${data.name}" created successfully!`, "success");
      }

      setShowForm(false);
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      showNotification(`Failed to ${editingTask ? "update" : "add"} task.`, "error");
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
      showNotification(`Task "${taskData.name}" added successfully!`, "success");
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
          variables: { id: deletingTask.id }
        }),
      });

      const json = await res.json();
      if (json.errors) {
        showNotification(json.errors[0].message, "error");
        return;
      }

      showNotification(`Task "${deletingTask.name}" deleted successfully!`, "success");
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

      showNotification(`Task "${taskName}" status updated to ${status}`, "success");
      fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      showNotification("Failed to update task status.", "error");
    }
  };

  const handleStatusClick = (task) => {
    const options = ["In Progress", "Completed", "Pending", "On Hold", "Cancelled"];
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
        return a.assignedStudent.localeCompare(b.assignedStudent);
      default:
        return a.status.localeCompare(b.status);
    }
  };
  const statusColors = {
    Pending: darkMode ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-yellow-100" : "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800",
    "In Progress": darkMode ? "bg-gradient-to-r from-blue-700 to-blue-600 text-blue-100" : "bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900",
    "On Hold": darkMode ? "bg-gradient-to-r from-orange-700 to-orange-600 text-orange-100" : "bg-gradient-to-r from-orange-200 to-orange-300 text-orange-900",
    Completed: darkMode ? "bg-gradient-to-r from-green-700 to-green-600 text-green-100" : "bg-gradient-to-r from-green-200 to-green-300 text-green-900",
    Cancelled: darkMode ? "bg-gradient-to-r from-red-700 to-red-600 text-red-100" : "bg-gradient-to-r from-red-200 to-red-300 text-red-900",
  };  const thClass = `px-6 py-5 align-middle text-left font-extrabold uppercase tracking-wider text-base border-b-4 ${
    darkMode
      ? "text-white border-gray-700 bg-gradient-to-b from-gray-900 to-gray-700 shadow-inner"
      : "text-blue-900 border-blue-200 bg-gradient-to-b from-blue-100 to-white shadow-sm"
  } group transition-all duration-200`;

  const tdClass = `px-6 py-4 align-middle text-base border-b whitespace-normal break-words ${
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
            <span className="font-semibold text-lg">{notification.message}</span>
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
          <h1 className={`text-4xl font-extrabold ${darkMode ? "text-white" : "text-gray-800"}`}>
            <span className={`${darkMode ? "text-blue-400" : "text-blue-600"}`}>Task </span> 
            Management Dashboard
          </h1>
          <div className={`h-1.5 w-32 mt-3 rounded-full ${darkMode ? 
            "bg-gradient-to-r from-blue-600 to-indigo-500" : 
            "bg-gradient-to-r from-blue-500 to-indigo-400"}`}></div>
          <p className={`mt-3 text-lg ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Create, assign, and track tasks across all your projects with ease
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between px-2 md:px-6 pt-2 mb-8 gap-4">
        <div className={`p-3 md:p-4 rounded-xl ${darkMode ? "bg-gray-800/50 backdrop-blur-sm" : "bg-white/50 backdrop-blur-sm"} shadow-md flex gap-2 items-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <label className={`text-lg font-semibold ${darkMode ? "text-white" : "text-blue-900"}`}>Sort by:</label>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create a New Task
        </button>
      </div>      <div className={`mx-auto max-w-7xl shadow-2xl rounded-3xl overflow-hidden border-4 transform transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 ${
        darkMode ? "bg-gray-900 border-gray-800 backdrop-blur-sm" : "bg-white/90 border-blue-200 backdrop-blur-sm"
      }`}>
        <table className="tasks-table table-fixed w-full border-collapse rounded-3xl overflow-hidden">
          <thead>            <tr>              {["Task ID", "Project", "Name", "Description", "Student", "Status", "Due Date", "Actions"].map((h) => {
                // Set column widths
                const columnWidthClass = h === "Description" ? "w-1/4" : 
                                       h === "Name" ? "w-1/8" :
                                       h === "Actions" ? "w-[100px]" :
                                       h === "Task ID" ? "w-[80px]" :
                                       h === "Status" ? "w-[120px]" : "";
                
                return (
                  <th key={h} className={`${thClass} ${columnWidthClass}`}>
                    <div className="flex items-center gap-1 group">
                      <span className="group-hover:text-blue-500 transition-colors duration-200">{h}</span>
                      {h !== "Actions" && 
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${darkMode ? "text-blue-400" : "text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      }
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[...tasks].sort(handleSort).map((task, idx) => (                <tr
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
                <td className={tdClass}>
                  <span className={`px-3 py-1 rounded-full font-mono text-sm font-bold ${
                    darkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>#{task.id}</span>
                </td>
                <td className={tdClass}>
                  <span className={`inline-block px-4 py-2 rounded-lg font-bold ${
                    darkMode ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-800' : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}>
                    {task.project}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className="font-bold text-base block">
                    {task.name}
                  </span>
                  <div className={`h-1 w-12 mt-1 rounded-full ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'bg-gradient-to-r from-blue-400 to-purple-400'
                  }`}></div>                </td>                <td className={`${tdClass} max-w-0`}>
                  <div className="description-cell custom-scrollbar">
                    <p className="description-text break-words hyphens-auto" title={task.description}>
                      {task.description}
                    </p>
                    <button 
                      className={`mt-1 text-xs font-medium ${
                        darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                      }`}
                      onClick={() => {
                        // Replace alert with a better UI for viewing full description
                        const modal = document.createElement("div");
                        modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50";
                        modal.onclick = () => document.body.removeChild(modal);
                        
                        const content = document.createElement("div");
                        content.className = `max-w-lg max-h-[80vh] overflow-y-auto p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl custom-scrollbar`;
                        content.onclick = (e) => e.stopPropagation();
                        
                        const title = document.createElement("h3");
                        title.className = `font-bold text-xl mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`;
                        title.textContent = "Task Description";
                        
                        const desc = document.createElement("p");
                        desc.className = `${darkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`;
                        desc.textContent = task.description;
                        
                        const closeBtn = document.createElement("button");
                        closeBtn.className = `mt-4 px-4 py-2 rounded-md ${
                          darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                        } text-sm`;
                        closeBtn.textContent = "Close";
                        closeBtn.onclick = () => document.body.removeChild(modal);
                        
                        content.appendChild(title);
                        content.appendChild(desc);
                        content.appendChild(closeBtn);
                        modal.appendChild(content);
                        document.body.appendChild(modal);
                      }}
                    >
                      {task.description.length > 50 ? 'Show more...' : ''}
                    </button>
                  </div>
                </td>
                <td className={tdClass}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                      darkMode ? "bg-blue-800 text-blue-100" : "bg-blue-200 text-blue-800"
                    }`}>
                      {task.assignedStudent.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{task.assignedStudent}</span>
                  </div>
                </td>
                <td className="px-6 py-4 align-middle text-left">
                  <button                    onClick={() => handleStatusClick(task)}
                    className={`font-bold px-5 py-2 rounded-full shadow-md border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 cursor-pointer ${statusColors[task.status]} hover:scale-105 hover:shadow-lg`}
                  >
                    {task.status}
                  </button>
                </td>
                <td className={tdClass}>
                  <span className={`px-3 py-1 rounded-lg font-mono text-sm font-semibold ${
                    new Date(task.dueDate) < new Date() 
                      ? (darkMode ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-red-100 text-red-700 border border-red-200')
                      : new Date(task.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
                        ? (darkMode ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-800' : 'bg-yellow-100 text-yellow-700 border border-yellow-200')
                        : (darkMode ? 'bg-green-900/40 text-green-300 border border-green-800' : 'bg-green-100 text-green-700 border border-green-200')
                  }`}>
                    {task.dueDate}
                  </span>
                </td>
                <td className="px-6 py-4 align-middle text-left">
                  <div className="inline-flex items-center space-x-2">                    <button
                      onClick={() => openForm(task)}
                      className={`p-2 rounded-full ${darkMode ? 'bg-blue-800 hover:bg-blue-700 text-blue-200 hover:text-white border-blue-700' : 'bg-blue-200 hover:bg-blue-300 text-blue-700 hover:text-blue-900 border-blue-300'} shadow hover:shadow-md transition-all duration-200 border-2 transform hover:scale-110`}
                      title="Edit Task"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => showDeleteTaskConfirm(task)}
                      className={`p-2 rounded-full ${darkMode ? 'bg-red-800 hover:bg-red-700 text-red-200 hover:text-white border-red-700' : 'bg-red-200 hover:bg-red-300 text-red-700 hover:text-red-900 border-red-300'} shadow hover:shadow-md transition-all duration-200 border-2 transform hover:scale-110`}
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
                <td colSpan={8} className="text-center py-16 text-xl text-gray-400 font-semibold">
                  <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${darkMode ? "text-gray-600" : "text-gray-400"} mb-4`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No tasks found.</p>
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
      </div>      {/* Task Status Summary */}
      {tasks.length > 0 && (
        <div className={`mt-6 p-6 mx-auto max-w-4xl rounded-2xl shadow-lg ${
          darkMode ? "bg-gray-800/50 backdrop-blur-sm" : "bg-white/60 backdrop-blur-sm"  
        } animate-fade-in flex flex-wrap gap-4 justify-center`}>
          <h3 className={`w-full text-center text-xl font-bold mb-4 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}>Task Status Summary</h3>
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-gray-900/80" : "bg-blue-50/80"}`}>
            <span className="text-sm font-medium">Total Tasks:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800"
            }`}>{tasks.length}</span>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-gray-900/80" : "bg-green-50/80"}`}>
            <span className="text-sm font-medium">Completed:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              darkMode ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"
            }`}>{tasks.filter(t => t.status === "Completed").length}</span>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-gray-900/80" : "bg-blue-50/80"}`}>
            <span className="text-sm font-medium">In Progress:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              darkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800"
            }`}>{tasks.filter(t => t.status === "In Progress").length}</span>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-gray-900/80" : "bg-yellow-50/80"}`}>
            <span className="text-sm font-medium">Pending:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              darkMode ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800"
            }`}>{tasks.filter(t => t.status === "Pending").length}</span>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-gray-900/80" : "bg-orange-50/80"}`}>
            <span className="text-sm font-medium">On Hold:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              darkMode ? "bg-orange-900/50 text-orange-300" : "bg-orange-100 text-orange-800"
            }`}>{tasks.filter(t => t.status === "On Hold").length}</span>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-gray-900/80" : "bg-red-50/80"}`}>
            <span className="text-sm font-medium">Cancelled:</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
              darkMode ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800"
            }`}>{tasks.filter(t => t.status === "Cancelled").length}</span>
          </div>
        </div>
      )}

      {/* Delete Task Confirmation Dialog */}
      {showDeleteConfirm && deletingTask && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? "bg-gray-900/90 backdrop-blur-sm" : "bg-gray-100/90 backdrop-blur-sm"}`}>
          <div className={`max-w-sm w-full p-8 rounded-3xl shadow-2xl border-4 transform transition-all duration-300 animate-fade-in ${
            darkMode ? "bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700" : "bg-gradient-to-br from-white to-blue-50 border-blue-200"
          }`}>
            <div className="mb-6 text-center">
              <div className={`mx-auto rounded-full w-16 h-16 flex items-center justify-center mb-4 ${darkMode ? "bg-red-900/30" : "bg-red-100"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${darkMode ? "text-red-400" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className={`font-extrabold text-xl ${darkMode ? "text-red-300" : "text-red-600"}`}>
                Delete Task
              </p>
              <p className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Are you sure you want to delete <span className="font-mono font-bold">{deletingTask.name}</span>?
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={confirmDeleteTask}
                className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-lg border-2 transition-all duration-200 hover:scale-105
                  ${darkMode ? "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white border-red-700" : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-red-500"}`}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingTask(null);
                }}
                className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-lg border-2 transition-all duration-200 hover:scale-105
                  ${darkMode ? "bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700" : "bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300"}`}
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
    </div>
  );
};

export default Tasks;