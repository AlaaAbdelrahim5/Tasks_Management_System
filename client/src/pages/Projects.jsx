import React, { useEffect, useState, useContext } from "react";
import ProjectCard from "../components/ProjectCard";
import ProjectSidebar from "../components/ProjectSidebar";
import { ThemeContext } from "../App";

const Projects = () => {
  const { darkMode } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
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

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("projects")) || [];
    setProjects(data);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, selectedOptions } = e.target;
    if (name === "students") {
      const values = Array.from(selectedOptions).map((opt) => opt.value);
      setFormData({ ...formData, students: values });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    // const progress = calculateProgress(formData.startDate, formData.endDate);
    // const newProject = { ...formData, progress };
    // const updatedProjects = [...projects, newProject];
    // setProjects(updatedProjects);
    // localStorage.setItem("projects", JSON.stringify(updatedProjects));
    // setFormData({
    //   title: "",
    //   description: "",
    //   students: [],
    //   category: "",
    //   startDate: "",
    //   endDate: "",
    //   status: "In Progress",
    // });
    setShowForm(false);
  };

  const calculateProgress = (start, end) => {
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    if (now < s) return 0;
    if (now > e) return 100;
    return Math.floor(((now - s) / (e - s)) * 100);
  };

  const filteredProjects = projects.filter((project) => {
    const matchSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "All Status" || project.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={`py-16 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="m-4">
        <h2 className={`text-2xl pb-4 font-bold ${darkMode ? 'text-blue-400' : 'text-blue-800'}`}>
          Projects Overview
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            className={`px-4 py-2 rounded hover:bg-blue-700 ${
              darkMode ? 'bg-blue-600 text-white' : 'bg-blue-800 text-white'
            }`}
            onClick={() => setShowForm(true)}
          >
            Add New Project
          </button>
          <input
            type="text"
            placeholder="Search projects by title or description..."
            className={`px-3 py-2 rounded flex-grow ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'border border-gray-400 text-gray-800 placeholder-gray-600'
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 rounded ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border border-gray-400 text-gray-800'
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

        {showForm && (
          <div className={`fixed inset-0 flex justify-center items-center z-50 ${
            darkMode ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-500 bg-opacity-50'
          }`}>
            <form
              onSubmit={handleAddProject}
              className={`p-6 rounded shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
              }`}
            >
              <h3 className={`text-xl font-semibold mb-4 ${
                darkMode ? 'text-blue-400' : 'text-blue-800'
              }`}>
                Create New Project
              </h3>

              <input
                type="text"
                name="title"
                placeholder="Project Title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full p-2 mb-3 rounded ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
                required
              />

              <textarea
                name="description"
                placeholder="Project Description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full p-2 mb-3 rounded ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
                required
              />

              <select
                name="students"
                multiple
                onChange={handleInputChange}
                className={`w-full p-2 mb-3 rounded h-28 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
              >
                {(JSON.parse(localStorage.getItem("signUpData")) || [])
                  .filter((u) => u.isStudent)
                  .map((student) => (
                    <option key={student.email} value={student.username}>
                      {student.username}
                    </option>
                  ))}
              </select>

              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full p-2 mb-3 rounded ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
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
                className={`w-full p-2 mb-3 rounded ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
                required
              />

              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full p-2 mb-3 rounded ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
                required
              />

              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full p-2 mb-4 rounded ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border border-gray-400 text-gray-800'
                }`}
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
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((project, index) => (
            <div key={index} onClick={() => setSelectedProject(project)}>
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