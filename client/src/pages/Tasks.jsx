import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";
import { FaEdit, FaTrash } from "react-icons/fa";
import TaskForm from "../components/TaskForm";

const Tasks = () => {
  const { darkMode } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sortBy, setSortBy] = useState("Tasks Status");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    assignedStudent: "",
    status: "In Progress",
    dueDate: "",
  });
  const [editingTask, setEditingTask] = useState(null);

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
      body: JSON.stringify({
        query: `query { getProjects { id title students } }`,
      }),
    });
    const { data } = await res.json();
    setProjects(data.getProjects);
  };

  const fetchTasks = async () => {
    const query = isStudent
      ? `query {
          getStudentTasks(username: "${currentUsername}") {
            id taskId project name description assignedStudent status dueDate
          }
        }`
      : `query {
          getTasks {
            id taskId project name description assignedStudent status dueDate
          }
        }`;

    const res = await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const { data } = await res.json();
    setTasks(isStudent ? data.getStudentTasks : data.getTasks);
  };

  const fetchStudents = async (projectId) => {
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
        taskId: task.taskId,
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
    if (editingTask) {
      const mutation = `
        mutation UpdateTask($id: ID!, $input: TaskInput!) {
          updateTask(id: $id, taskInput: $input) { id }
        }
      `;
      await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { id: editingTask.id, input: data },
        }),
      });
    } else {
      const mutation = `
        mutation AddTask($input: TaskInput!) {
          addTask(taskInput: $input) { id }
        }
      `;
      await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { input: { ...data, taskId: `${tasks.length + 1}` } },
        }),
      });
    }
    setShowForm(false);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) return;

    const mutation = `
      mutation DeleteTask($id: ID!) {
        deleteTask(id: $id) { id }
      }
    `;

    await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables: { id } }),
    });

    fetchTasks();
  };

  const updateTaskStatus = async (id, status) => {
    const mutation = `
      mutation UpdateTaskStatus($id: ID!, $status: String!) {
        updateTaskStatus(id: $id, status: $status) { id status }
      }
    `;
    await fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables: { id, status } }),
    });
    fetchTasks();
  };

  const handleStatusClick = (task) => {
    const options = ["In Progress", "Completed", "Pending", "On Hold", "Cancelled"];
    const idx = options.indexOf(task.status);
    const newStatus = options[(idx + 1) % options.length];
    updateTaskStatus(task.id, newStatus);
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
          onClick={() => openForm(null)}
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
                <td className={tdClass}>{task.taskId}</td>
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
                    <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
      />
    </div>
  );
};

export default Tasks;
