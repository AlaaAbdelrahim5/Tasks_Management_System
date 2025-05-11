import React, { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../App";
import { FaProjectDiagram, FaTasks, FaRegCalendarAlt, FaUserAlt, FaClock, FaFileAlt } from "react-icons/fa";

const AddTaskForm = ({ onClose, onSubmit }) => {
  const { darkMode } = useContext(ThemeContext);  const [user, setUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dateError, setDateError] = useState("");
  const [formData, setFormData] = useState({
    project: "",
    name: "",
    description: "",
    assignedStudents: [""],
    status: "In Progress",
    dueDate: "",
  });
    useEffect(() => {
    // Get logged in user from localStorage
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    setUser(loggedInUser);
    
    // If user is a student, fetch projects related to this student
    if (loggedInUser?.isStudent) {
      fetchUserProjects(loggedInUser.username);
      
      // Auto-set the student as the assignee
      setFormData(prev => ({
        ...prev,
        assignedStudents: [loggedInUser.username]
      }));
    }
  }, []);
  
  const fetchUserProjects = async (username) => {
    try {
      const query = `        query {
          getProjects {
            id
            title
            students
            startDate
            endDate
          }
        }
      `;
      
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await res.json();
      // Filter projects where the student is a member
      const studentProjects = data.data.getProjects.filter(project => 
        project.students.includes(username)
      );
      setUserProjects(studentProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle student field
    if (name === "student") {
      // If user is a student, they can only assign to themselves
      if (user?.isStudent) {
        setFormData((prev) => ({ ...prev, assignedStudents: [user.username] }));
      } else {
        setFormData((prev) => ({ ...prev, assignedStudents: [value] }));
      }
      return;
    }
      // Handle project changes
    if (name === "project") {
      const projectData = userProjects.find(p => p.title === value) || 
                         (Array.isArray(userProjects) ? null : userProjects);
      setSelectedProject(projectData);
      
      // If due date is already set, validate it with the new project
      if (formData.dueDate && projectData?.startDate) {
        validateDueDate(formData.dueDate, projectData.startDate);
      }
    }
    
    // Handle due date changes
    if (name === "dueDate" && selectedProject?.startDate) {
      validateDueDate(value, selectedProject.startDate);
    }
    
    // Update form data
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
    // Function to validate due date is not before project start date and not after project end date
  const validateDueDate = (dueDate, startDate) => {
    const dueDateTime = new Date(dueDate).getTime();
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = selectedProject?.endDate ? new Date(selectedProject.endDate).getTime() : null;
    
    if (dueDateTime < startDateTime) {
      setDateError(`Due date cannot be before project start date (${startDate})`);
    } else if (endDateTime && dueDateTime > endDateTime) {
      setDateError(`Due date cannot be after project end date (${selectedProject.endDate})`);
    } else {
      setDateError("");
    }
  };const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if there's a date validation error
    if (dateError) {
      alert(dateError);
      return; // Don't submit if there's a date error
    }
    
    // If user is a student, make sure they are assigned to the task
    let taskData = { ...formData };
    if (user?.isStudent) {
      taskData.assignedStudents = [user.username];
    }
    
    onSubmit(taskData);
    onClose();
  };
  
  const formBg = darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-800 border-gray-100";
  const fieldBg = darkMode
    ? "bg-gray-700 border-gray-600 placeholder-gray-300 text-white"
    : "bg-gray-50 border-gray-200 placeholder-gray-500 text-gray-800";
  const labelColor = darkMode ? "text-gray-300" : "text-gray-600";
  const accentColor = "blue";  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-md p-1 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl">
        <form
          onSubmit={handleSubmit}
          className={`p-6 rounded-xl shadow-xl w-full ${formBg} transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold text-center mb-6">
            Create New Task
            <div className="mt-2 w-20 h-1 bg-blue-500 mx-auto rounded-full" />
          </h2>

          <div className="space-y-5">            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaProjectDiagram />
              </div>
              {user?.isStudent ? (
                // If user is a student, show dropdown with only their projects
                <select
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
                >
                  <option value="">Select a project</option>
                  {userProjects.map(project => (
                    <option key={project.id} value={project.title}>
                      {project.title}
                    </option>
                  ))}
                </select>
              ) : (
                // If user is not a student, show text input
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  placeholder="Enter project name..."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
                />
              )}
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Project</label>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaTasks />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter task name..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Task Name</label>            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none text-blue-500">
                <FaFileAlt />
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the task..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Description</label>
            </div>              <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaUserAlt />
              </div>
              {user?.isStudent ? (
                // If user is a student, make field readonly and auto-filled with their username
                <input
                  type="text"
                  name="student"
                  value={user.username}
                  readOnly
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all opacity-75`}
                />
              ) : (
                // If user is not a student, show normal input field
                <input
                  type="text"
                  name="student"
                  value={formData.assignedStudents[0] || ""}
                  onChange={handleChange}
                  placeholder="Enter student username..."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
                />
              )}
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Assigned Student</label>
            </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
              <FaClock />
            </div>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
            >
              <option>In Progress</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>On Hold</option>
              <option>Cancelled</option>
            </select>            <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Status</label>
          </div>
            <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
              <FaRegCalendarAlt />
            </div>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${dateError ? "border-red-500" : fieldBg} focus:outline-none focus:ring-2 focus:ring-${dateError ? "red-500" : accentColor}-500 focus:border-transparent transition-all`}
            />
            <label className={`text-xs font-medium ${dateError ? "text-red-500" : labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Due Date</label>
            {dateError && (
              <p className="text-red-500 text-xs mt-1">{dateError}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm"
          >
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTaskForm;
