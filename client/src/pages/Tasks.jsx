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
  // Add state for task deletion
  const [deletingTask, setDeletingTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success", // "error", "success" or "warning"
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

    // Auto-hide notification after 4 seconds
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

  // Modified to show delete confirmation UI instead of window.confirm
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
    Pending: darkMode ? "text-yellow-500" : "text-yellow-700",
    "In Progress": darkMode ? "text-blue-500" : "text-blue-700",
    "On Hold": darkMode ? "text-orange-500" : "text-orange-700",
    Completed: darkMode ? "text-green-500" : "text-green-700",
    Cancelled: darkMode ? "text-red-500" : "text-red-700",
  };

  const thClass = `px-4 py-2 align-middle text-left font-medium uppercase ${
    darkMode ? "text-white border-gray-600" : "text-gray-900 border-gray-200"
  }`;

  const tdClass = `px-4 py-3 align-middle whitespace-nowrap ${
    darkMode ? "text-white border-gray-600" : "text-gray-900 border-gray-200"
  }`;

  return (
    <div className={`pt-16 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Notification Banner */}
      {notification.show && (
        <div
          className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-slide-in-right ${
            notification.type === "error"
              ? darkMode
                ? "bg-red-800 text-white"
                : "bg-red-100 text-red-800 border border-red-300"
              : notification.type === "success"
              ? darkMode
                ? "bg-green-800 text-white"
                : "bg-green-100 text-green-800 border border-green-300"
              : darkMode
              ? "bg-yellow-800 text-white"
              : "bg-yellow-100 text-yellow-800 border border-yellow-300"
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
        </div>
      )}
      
      <div className="flex justify-between px-4 pt-6 mb-4">
        <div className="flex gap-2 items-center">
          <label className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-2 py-1 rounded ${darkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}
          >
            <option>Tasks Status</option>
            <option>Project</option>
            <option>Due Date</option>
            <option>Assigned Student</option>
          </select>
        </div>
        <button
          onClick={() => setShowAddTaskForm(true)}
          className={`px-4 py-2 rounded ${darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
        >
          Create a New Task
        </button>
      </div>

      <div className={`mx-4 shadow rounded-lg overflow-x-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="table-auto w-full border-collapse">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
            <tr>
              {["Task ID", "Project", "Name", "Description", "Student", "Status", "Due Date", "Actions"].map((h) => (
                <th key={h} className={thClass}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...tasks].sort(handleSort).map((task) => (
              <tr key={task.id} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                <td className={tdClass}>{task.id}</td>
                <td className={tdClass}>{task.project}</td>
                <td className={tdClass}>{task.name}</td>
                <td className={tdClass}>{task.description}</td>
                <td className={tdClass}>{task.assignedStudent}</td>
                <td className="px-4 py-3 align-middle text-left">
                  <button
                    onClick={() => handleStatusClick(task)}
                    className={`font-semibold ${statusColors[task.status]} px-3 py-1 rounded-lg`}
                  >
                    {task.status}
                  </button>
                </td>
                <td className={tdClass}>{task.dueDate}</td>
                <td className="px-4 py-3 align-middle text-left">
                  <div className="inline-flex items-center space-x-2">
                    <button onClick={() => openForm(task)} className="text-blue-500 hover:text-blue-700">
                      <FaEdit />
                    </button>
                    <button onClick={() => showDeleteTaskConfirm(task)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {/* Delete Task Confirmation Dialog */}
{showDeleteConfirm && deletingTask && (
  <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? "bg-gray-900/70" : "bg-gray-100/70"}`}>
    <div className={`max-w-sm p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
      <p className={`text-center mb-3 font-medium ${darkMode ? "text-red-300" : "text-red-600"}`}>
        Are you sure you want to delete "{deletingTask.name}"?
      </p>
      <div className="flex gap-2">
        <button 
          onClick={confirmDeleteTask}
          className={`flex-1 py-2 rounded-lg font-medium transition-all
            ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
        >
          Yes, Delete
        </button>
        <button 
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeletingTask(null);
          }}
          className={`flex-1 py-2 rounded-lg font-medium transition-all
            ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-100" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}
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