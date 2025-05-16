import React, { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../App";
import { FaProjectDiagram, FaTasks, FaRegCalendarAlt, FaUserAlt, FaClock, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";

const AddTaskForm = ({ onClose, onSubmit }) => {
  const { darkMode } = useContext(ThemeContext);  
  const [user, setUser] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [projectStudents, setProjectStudents] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dateError, setDateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    project: "",
    name: "",
    description: "",
    student: "",
    dueDate: ""
  });
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
    } else {
      // For instructors, fetch all projects
      fetchAllProjects();
    }
  }, []);
  
  const fetchAllProjects = async () => {
    try {
      const query = `
        query {
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
      setUserProjects(data.data.getProjects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };
  
  const fetchUserProjects = async (username) => {
    try {
      const query = `
        query {
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
  };  
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error for this field
    setFieldErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
    
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
      const projectData = userProjects.find(p => p.title === value);
      setSelectedProject(projectData);
      
      // Update the list of students for this project
      if (projectData) {
        setProjectStudents(projectData.students || []);
        
        // Reset the assigned student when project changes
        if (!user?.isStudent) {
          setFormData(prev => ({ 
            ...prev, 
            assignedStudents: [""] 
          }));
        }
      }
      
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
  };
  
  const validateField = (name, value) => {
    if (!value || (Array.isArray(value) && !value[0])) {
      return "Please fill out this field.";
    }
    return "";
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check required fields
    const newFieldErrors = {
      project: validateField("project", formData.project),
      name: validateField("name", formData.name),
      description: validateField("description", formData.description),
      student: !user?.isStudent ? validateField("student", formData.assignedStudents[0]) : "",
      dueDate: validateField("dueDate", formData.dueDate)
    };
    
    setFieldErrors(newFieldErrors);
    
    // Check if there are any errors
    if (Object.values(newFieldErrors).some(error => error) || dateError) {
      return; // Don't submit if there are errors
    }
    
    // Convert assignedStudents array to a single assignedStudent string
    let taskData = {
      ...formData,
      assignedStudent: formData.assignedStudents[0] || ""
    };
    
    // Remove the assignedStudents array as it's not expected by the API
    delete taskData.assignedStudents;
    
    // If user is a student, make sure they are assigned to the task
    if (user?.isStudent) {
      taskData.assignedStudent = user.username;
    }
    
    onSubmit(taskData);
    onClose();
  };

  const formBg = darkMode ? "bg-gray-800 text-gray-100 border-gray-700" : "bg-white text-gray-800 border-gray-100";
  const fieldBg = darkMode
    ? "bg-gray-700 border-gray-600 placeholder-gray-300 text-white"
    : "bg-gray-50 border-gray-200 placeholder-gray-500 text-gray-800";
  const labelColor = darkMode ? "text-gray-300" : "text-gray-600";
  const accentColor = "blue";  
  
  // Updated error message component to match the screenshot design
  const renderValidationMessage = (errorMessage) => {
    if (!errorMessage) return null;
    
    return (
      <div className={`absolute ${darkMode ? 'bg-orange-900/90' : 'bg-orange-100'} ${darkMode ? 'text-orange-100' : 'text-orange-800'} px-3 py-1 rounded-md shadow-lg z-10 flex items-center right-0 -top-8`}>
        <div className="text-orange-500 mr-2">
          <FaExclamationTriangle />
        </div>
        <span className="text-sm">{errorMessage}</span>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
      <div className={`w-full max-w-md p-1 rounded-xl ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'} shadow-2xl`}>
        <form
          onSubmit={handleSubmit}
          className={`p-6 rounded-xl shadow-xl w-full ${formBg} transition-all duration-300`}
        >
          <h2 className={`text-2xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Create New Task
            <div className="mt-2 w-20 h-1 bg-blue-500 mx-auto rounded-full" />
          </h2>

          <div className="space-y-5">            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaProjectDiagram />
              </div>
              {/* Always show project dropdown regardless of user type */}
              <select
                name="project"
                value={formData.project}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldErrors.project ? "border-orange-500" : "border-" + (darkMode ? "gray-600" : "gray-200")} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${fieldErrors.project ? "orange" : accentColor}-500 focus:border-transparent transition-all`}
              >
                <option value="">Select a project</option>
                {userProjects.map(project => (
                  <option key={project.id} value={project.title}>
                    {project.title}
                  </option>
                ))}
              </select>
              <label className={`text-xs font-medium ${fieldErrors.project ? "text-orange-500" : labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>
                Project
                {fieldErrors.project && <span className="text-orange-500 ml-1">*</span>}
              </label>
              {renderValidationMessage(fieldErrors.project)}
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
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldErrors.name ? "border-orange-500" : "border-" + (darkMode ? "gray-600" : "gray-200")} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${fieldErrors.name ? "orange" : accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${fieldErrors.name ? "text-orange-500" : labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>
                Task Name
                {fieldErrors.name && <span className="text-orange-500 ml-1">*</span>}
              </label>
              {renderValidationMessage(fieldErrors.name)}
            </div>
            
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
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldErrors.description ? "border-orange-500" : "border-" + (darkMode ? "gray-600" : "gray-200")} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${fieldErrors.description ? "orange" : accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${fieldErrors.description ? "text-orange-500" : labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>
                Description
                {fieldErrors.description && <span className="text-orange-500 ml-1">*</span>}
              </label>
              {renderValidationMessage(fieldErrors.description)}
            </div>              
            
            <div className="relative">
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
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 border-${darkMode ? "gray-600" : "gray-200"} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all opacity-75`}
                />
              ) : (
                // If user is not a student, show dropdown of project students
                <select
                  name="student"
                  value={formData.assignedStudents[0] || ""}
                  onChange={handleChange}
                  disabled={!selectedProject}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldErrors.student ? "border-orange-500" : "border-" + (darkMode ? "gray-600" : "gray-200")} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${fieldErrors.student ? "orange" : accentColor}-500 focus:border-transparent transition-all`}
                >
                  <option value="">Select a student</option>
                  {projectStudents.map(student => (
                    <option key={student} value={student}>
                      {student}
                    </option>
                  ))}
                </select>
              )}
              <label className={`text-xs font-medium ${fieldErrors.student ? "text-orange-500" : labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>
                Assigned Student
                {fieldErrors.student && <span className="text-orange-500 ml-1">*</span>}
              </label>
              {!user?.isStudent && renderValidationMessage(fieldErrors.student)}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-500">
                <FaClock />
              </div>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 border-${darkMode ? "gray-600" : "gray-200"} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:border-transparent transition-all`}
              >
                <option>In Progress</option>
                <option>Completed</option>
                <option>Pending</option>
                <option>On Hold</option>
                <option>Cancelled</option>
              </select>
              <label className={`text-xs font-medium ${labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>Status</label>
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
                className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 ${fieldErrors.dueDate || dateError ? "border-orange-500" : "border-" + (darkMode ? "gray-600" : "gray-200")} ${fieldBg} focus:outline-none focus:ring-2 focus:ring-${fieldErrors.dueDate || dateError ? "orange" : accentColor}-500 focus:border-transparent transition-all`}
              />
              <label className={`text-xs font-medium ${fieldErrors.dueDate || dateError ? "text-orange-500" : labelColor} absolute -top-2 left-2 px-1 ${formBg}`}>
                Due Date
                {(fieldErrors.dueDate || dateError) && <span className="text-orange-500 ml-1">*</span>}
              </label>
              {renderValidationMessage(fieldErrors.dueDate || dateError)}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                darkMode 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors shadow-sm ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskForm;