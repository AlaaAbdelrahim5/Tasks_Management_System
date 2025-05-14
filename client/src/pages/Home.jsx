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
  const [username, setUsername] = useState("");

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

  const fetchDashboardStats = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const currentUser = user.username || "";
    const student = user.isStudent || false;
  
    setIsStudent(student);
    setUsername(currentUser);
  
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query {
              getProjects { status students }
              getStudents { id }
              getTasks { assignedStudent }
            }
          `,
        }),
      });
  
      const { data } = await res.json();
  
      if (student) {
        const myProjects = data.getProjects.filter(p =>
          p.students?.includes(currentUser)
        );
        const myTasks = data.getTasks.filter(t =>
          t.assignedStudent === currentUser
        );
        const myFinishedProjects = myProjects.filter(p =>
          ["finished", "completed"].includes(p.status.toLowerCase())
        );
  
        setProjectCount(myProjects.length);
        setTaskCount(myTasks.length);
        setFinishedProjectCount(myFinishedProjects.length);
        setStudentCount(0); // hide for student
      } else {
        const finished = data.getProjects.filter(p =>
          ["finished", "completed"].includes(p.status.toLowerCase())
        );
  
        setProjectCount(data.getProjects.length);
        setTaskCount(data.getTasks.length);
        setFinishedProjectCount(finished.length);
        setStudentCount(data.getStudents.length);
      }
    } catch (error) {
      console.error("❌ Failed to fetch dashboard stats:", error);
    }
  };
  

  useEffect(() => {
    fetchDashboardStats(); // ✅ this must be called here
    setDateTime(formatDateTime());
    const interval = setInterval(() => {
      setDateTime(formatDateTime());
    }, 1000);
    return () => clearInterval(interval);  }, []);  return (
    <div className={`p-4 min-h-screen pt-16 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="mt-4 mb-8 flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
          <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Welcome to the Task Management System</span>
        </h2>
        <p className={`text-lg mt-4 sm:mt-0 text-center sm:text-right ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {dateTime}
        </p>
      </div><div className={`grid grid-cols-1 ${isStudent ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-6 mb-8`}>
        <div className={`p-4 rounded-xl shadow-md text-center h-full flex flex-col justify-center items-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
          <b className="block mb-3 text-lg">Number of <br /> Projects</b>
          <span className="text-2xl font-bold">{projectCount}</span>
        </div>

        {!isStudent && (
          <div className={`p-4 rounded-xl shadow-md text-center h-full flex flex-col justify-center items-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <b className="block mb-3 text-lg">Number of <br /> Students</b>
            <span className="text-2xl font-bold">{studentCount}</span>
          </div>
        )}

        <div className={`p-4 rounded-xl shadow-md text-center h-full flex flex-col justify-center items-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
          <b className="block mb-3 text-lg">Number of <br /> Tasks</b>
          <span className="text-2xl font-bold">{taskCount}</span>
        </div>

        <div className={`p-4 rounded-xl shadow-md text-center h-full flex flex-col justify-center items-center ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
          <b className="block mb-3 text-lg">Number of <br /> Finished Projects</b>
          <span className="text-2xl font-bold">{finishedProjectCount}</span>
        </div>
      </div>

      <div className="mt-8">
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
