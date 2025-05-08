import React, { useEffect, useState, useContext } from "react";
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
  const [selectedProject, setSelectedProject] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    students: [],
    category: "",
    startDate: "",
    endDate: "",
    status: "In Progress",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const currentUsername = user?.username;
  const isStudent = user?.isStudent;

  useEffect(() => {
    fetch("http://localhost:4000/graphql", {
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
    })
      .then((res) => res.json())
      .then((result) => setStudentList(result.data.getStudents || []))
      .catch((err) => console.error("Failed to load students", err));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/graphql", {
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
    })
      .then((res) => res.json())
      .then((result) => {
        const all = result.data.getProjects;
        setProjects(
          isStudent
            ? all.filter((p) => p.students.includes(currentUsername))
            : all
        );
      })
      .catch((err) => console.error("Failed to fetch projects", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    if (name === "students") {
      const values = Array.from(selectedOptions).map((opt) => opt.value);
      setFormData((prev) => ({ ...prev, students: values }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
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
        alert(json.errors[0].message);
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
    } catch (err) {
      console.error("Failed to add project:", err);
      alert("Error adding project.");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "All Status" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fieldClass = `w-full p-2 mb-3 rounded border transition-colors focus:outline-none focus:ring-2 ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 focus:ring-blue-500"
      : "bg-gray-50 border-gray-200 text-gray-800 focus:ring-blue-300"
  }`;

  const overlayBg = darkMode
    ? "bg-gray-900 bg-opacity-70"
    : "bg-gray-500 bg-opacity-40";
  const formBg = darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800";
  const formBorder = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`py-16 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className="m-4">
        <h2 className={`text-2xl pb-4 font-bold ${darkMode ? "text-blue-400" : "text-blue-800"}`}>
          {isStudent ? "Your Projects" : "All Projects"}
        </h2>

        {!isStudent && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mb-4">
            <button
              onClick={() => setShowForm(true)}
              className={`px-4 py-2 rounded transition-colors ${
                darkMode
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-blue-800 text-white hover:bg-blue-700"
              }`}
            >
              Add New Project
            </button>
            <input
              type="text"
              placeholder="Search projects by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-3 py-2 rounded flex-grow transition-colors ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "border border-gray-400 text-gray-800 placeholder-gray-600"
              }`}
            />
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
          </div>
        )}

        {showForm && (
          <div className={`fixed inset-0 flex items-center justify-center z-50 ${overlayBg}`}>
            <form
              onSubmit={handleAddProject}
              className={`p-6 rounded shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto border ${formBg} ${formBorder} transition-colors`}
            >
              <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-blue-400" : "text-blue-800"}`}>
                Create New Project
              </h3>

              <input
                type="text"
                name="title"
                placeholder="Project Title"
                value={formData.title}
                onChange={handleInputChange}
                className={fieldClass}
                required
              />

              <textarea
                name="description"
                placeholder="Project Description"
                value={formData.description}
                onChange={handleInputChange}
                className={fieldClass}
                rows={4}
                required
              />

              <select
                name="students"
                multiple
                value={formData.students}
                onChange={handleInputChange}
                className={`${fieldClass} h-28`}
              >
                {studentList.map((s) => (
                  <option key={s.email} value={s.username}>
                    {s.username}
                  </option>
                ))}
              </select>

              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={fieldClass}
                required
              >
                <option value="">Select a Category</option>
                <option>Web Development</option>
                <option>Mobile Development</option>
                <option>Data Science</option>
                <option>Machine Learning</option>
                <option>Other</option>
              </select>

              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={fieldClass}
                required
              />

              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={fieldClass}
                required
              />

              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={fieldClass}
              >
                <option>In Progress</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>On Hold</option>
                <option>Cancelled</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    darkMode
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    darkMode
                      ? "bg-green-600 text-white hover:bg-green-500"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} onClick={() => setSelectedProject(project)}>
              <ProjectCard project={project} darkMode={darkMode} />
            </div>
          ))}
        </div>

        <ProjectSidebar
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default Projects;
