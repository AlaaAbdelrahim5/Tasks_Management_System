import React, { useEffect, useState, useContext } from "react";
import DashboardChart from "../components/DashboardChart";
import { ThemeContext } from "../App";

const Home = () => {
  const { darkMode } = useContext(ThemeContext);
  const [dateTime, setDateTime] = useState(new Date().toLocaleString());
  const [projectCount, setProjectCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [finishedProjectCount, setFinishedProjectCount] = useState(0);
  const [isStudent, setIsStudent] = useState(false);

  const getStudentCount = () => {
    const signUpData = JSON.parse(localStorage.getItem("signUpData")) || [];
    return signUpData.filter((user) => user.isStudent).length;
  };

  const getNumberOfProjects = () => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    return projects.length;
  };

  const getNumberOfTasks = () => {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    return tasks.length;
  };

  const getNumberOfFinishedProjects = () => {
    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    return projects.filter((project) => project.progress === 100).length;
  };

  const getCurrentUserRole = () => {
    const loginData =
      JSON.parse(localStorage.getItem("loginData")) ||
      JSON.parse(sessionStorage.getItem("loginSession"));
    const users = JSON.parse(localStorage.getItem("signUpData")) || [];
    const currentUser = users.find((user) => user.email === loginData?.email);
    return currentUser?.isStudent || false;
  };

  const formatDateTime = () => {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return now.toLocaleString("en-US", options);
  };

  useEffect(() => {
    const updateData = () => {
      setStudentCount(getStudentCount());
      setProjectCount(getNumberOfProjects());
      setTaskCount(getNumberOfTasks());
      setFinishedProjectCount(getNumberOfFinishedProjects());
      setIsStudent(getCurrentUserRole());
      setDateTime(formatDateTime());
    };

    updateData();

    const interval = setInterval(() => {
      setDateTime(formatDateTime());
    }, 1000);

    const dataCheckInterval = setInterval(updateData, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(dataCheckInterval);
    };
  }, []);

  return (
    <div className={`p-4 min-h-screen mt-16 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div id="welcome-home" className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <h2 id="welcome-msg" className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
          Welcome to the Task Management System
        </h2>
        <p id="datetime" className={`text-lg mt-4 sm:mt-0 text-center sm:text-right ${
          darkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {dateTime}
        </p>
      </div>

      <div
        id="cards"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <div className={`p-4 rounded shadow text-center ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <b className="block mb-2">
            Number of <br /> Projects
          </b>
          <span>{projectCount}</span>
        </div>
        <div
          id="number-of-students-card"
          className={`p-4 rounded shadow text-center ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <b className="block mb-2">
            Number of <br /> Students
          </b>
          <span id="student-count">{studentCount}</span>
        </div>
        <div className={`p-4 rounded shadow text-center ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <b className="block mb-2">
            Number of <br /> Tasks
          </b>
          <span>{taskCount}</span>
        </div>
        <div className={`p-4 rounded shadow text-center ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <b className="block mb-2">
            Number of <br /> Finished Projects
          </b>
          <span>{finishedProjectCount}</span>
        </div>
      </div>

      <div id="dashboard-overview" className="mt-8">
        <DashboardChart
          projectCount={projectCount}
          studentCount={studentCount}
          taskCount={taskCount}
          finishedProjectCount={finishedProjectCount}
          isStudent={isStudent}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default Home;