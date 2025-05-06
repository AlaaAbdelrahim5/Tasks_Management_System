import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";

const Tasks = () => {
  const { darkMode } = useContext(ThemeContext);
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sortBy, setSortBy] = useState("Tasks Status");

  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    assignedStudent: "",
    status: "In Progress",
    dueDate: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUsername = user?.username;
  const isStudent = user?.isStudent;

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    const res = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `query { getProjects { id title students } }` }),
    });
    const { data } = await res.json();
    setProjects(data.getProjects);
  };

  const fetchTasks = async () => {
    const query = isStudent
      ? `query { getStudentTasks(username: "${currentUsername}") { id taskId project name description assignedStudent status dueDate } }`
      : `query { getTasks { id taskId project name description assignedStudent status dueDate } }`;

    const res = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const { data } = await res.json();
    setTasks(isStudent ? data.getStudentTasks : data.getTasks);
  };

  const fetchStudents = async (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const res = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `query { getStudents { username email } }` }),
    });
    const { data } = await res.json();
    const connected = data.getStudents.filter((s) =>
      project.students.includes(s.username)
    );
    setStudents(connected);
  };

  const handleSort = (a, b) => {
    switch (sortBy) {
      case "Project": return a.project.localeCompare(b.project);
      case "Due Date": return new Date(a.dueDate) - new Date(b.dueDate);
      case "Assigned Student": return a.assignedStudent.localeCompare(b.assignedStudent);
      default: return a.status.localeCompare(b.status);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const taskId = `${tasks.length + 1}`;

    const mutation = `
      mutation AddTask($taskInput: TaskInput!) {
        addTask(taskInput: $taskInput) { id }
      }
    `;
    const variables = { taskInput: { ...formData, taskId } };

    await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables }),
    });

    setShowForm(false);
    fetchTasks();
  };

  const statusOptions = ["In Progress", "Completed", "Pending", "On Hold", "Cancelled"];
  const statusColors = {
    "Pending": "text-yellow-500",
    "In Progress": "text-blue-500",
    "On Hold": "text-orange-500",
    "Completed": "text-green-500",
    "Cancelled": "text-red-500"
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const mutation = `
      mutation UpdateTaskStatus($id: ID!, $status: String!) {
        updateTaskStatus(id: $id, status: $status) {
          id
          status
        }
      }
    `;
    const variables = { id: taskId, status: newStatus };

    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const { data } = await res.json();
      if (data.updateTaskStatus) fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleStatusClick = (task) => {
    const currentIndex = statusOptions.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const newStatus = statusOptions[nextIndex];
    updateTaskStatus(task.id, newStatus);
  };

  return (
    <div className={`pt-16 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
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
          onClick={() => setShowForm(true)}
          className={`px-4 py-2 rounded ${darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
        >Create a New Task</button>
      </div>

      <div className={`mx-4 shadow rounded-lg overflow-x-auto ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full border-collapse">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-200"}>
            <tr>
              {["Task ID", "Project", "Name", "Description", "Student", "Status", "Due Date"].map((h, i) => (
                <th key={i} className={`p-3 border-b ${darkMode ? "text-white border-gray-600" : "text-gray-900"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...tasks].sort(handleSort).map((task) => (
              <tr key={task.id} className={darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}>
                <td className="p-3 border-b">{task.taskId}</td>
                <td className="p-3 border-b">{task.project}</td>
                <td className="p-3 border-b">{task.name}</td>
                <td className="p-3 border-b">{task.description}</td>
                <td className="p-3 border-b">{task.assignedStudent}</td>
                <td
                  onClick={() => handleStatusClick(task)}
                  className={`p-3 border-b cursor-pointer font-semibold ${statusColors[task.status]}`}
                >{task.status}</td>
                <td className="p-3 border-b">{task.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className={`p-6 rounded-lg shadow-lg w-full max-w-md ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}`}>
            <h2 className="text-xl font-semibold mb-4 text-center">Create New Task</h2>

            <label className="block mb-1">Project</label>
            <select
              value={formData.project}
              onChange={(e) => {
                const title = e.target.value;
                setFormData({ ...formData, project: title });
                const selected = projects.find(p => p.title === title);
                if (selected) fetchStudents(selected.id);
              }}
              className="w-full p-2 mb-3 rounded"
              required
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>

            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Task Name"
              className="w-full mb-3 p-2 rounded"
              required
            />

            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
              className="w-full mb-3 p-2 rounded"
            />

            <label className="block mb-1">Assign to Student</label>
            <select
              value={formData.assignedStudent}
              onChange={(e) => setFormData({ ...formData, assignedStudent: e.target.value })}
              className="w-full mb-3 p-2 rounded"
              required
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.email} value={s.username}>{s.username}</option>
              ))}
            </select>

            <label className="block mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full mb-3 p-2 rounded"
            >
              {statusOptions.map(status => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <label className="block mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full mb-4 p-2 rounded"
              required
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} type="button" className="bg-red-500 text-white px-4 py-2 rounded">Cancel</button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add Task</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Tasks;