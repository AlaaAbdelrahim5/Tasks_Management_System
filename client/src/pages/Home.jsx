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
        const myProjects = data.getProjects.filter((p) =>
          p.students?.includes(currentUser)
        );
        const myTasks = data.getTasks.filter(
          (t) => t.assignedStudent === currentUser
        );
        const myFinishedProjects = myProjects.filter((p) =>
          ["finished", "completed"].includes(p.status.toLowerCase())
        );

        setProjectCount(myProjects.length);
        setTaskCount(myTasks.length);
        setFinishedProjectCount(myFinishedProjects.length);
        setStudentCount(0); // hide for student
      } else {
        const finished = data.getProjects.filter((p) =>
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
    fetchDashboardStats();
    setDateTime(formatDateTime());
    const interval = setInterval(() => {
      setDateTime(formatDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div
      className={`p-4 min-h-screen pt-16 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mt-6 mb-10 flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center sm:text-left">
          <span
            className={`bg-clip-text text-transparent ${
              darkMode
                ? "bg-gradient-to-r from-blue-400 to-indigo-500"
                : "bg-gradient-to-r from-blue-600 to-cyan-400"
            }`}
          >
            Welcome to the Task Management System
          </span>
        </h2>
        <p
          className={`text-lg mt-4 sm:mt-0 text-center sm:text-right ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {dateTime}
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 mb-10 ${
          isStudent ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {[
          {
            label: "Projects",
            value: projectCount,
          },
          !isStudent && {
            label: "Students",
            value: studentCount,
          },
          {
            label: "Tasks",
            value: taskCount,
          },
          {
            label: "Finished Projects",
            value: finishedProjectCount,
          },
        ]
          .filter(Boolean)
          .map((card, i) => (
            <div
              key={i}
              className={`relative p-6 rounded-2xl shadow-2xl flex flex-col justify-center items-center text-center transition-transform duration-300 hover:-translate-y-1 border-1 ${
                darkMode
                  ? "bg-gray-800/60 border-blue-500 backdrop-blur-lg"
                  : "bg-white/80 border-blue-400 backdrop-blur-md"
              }`}
            >
              <div className="mb-4">
                <b className="block text-lg sm:text-xl">
                  Number of <br /> {card.label}
                </b>
              </div>
              <span className="text-3xl sm:text-4xl font-extrabold">
                {card.value}
              </span>
            </div>
          ))}
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
