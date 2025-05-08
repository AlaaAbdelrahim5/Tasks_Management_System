import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../App";

const Chat = () => {
  const { darkMode } = useContext(ThemeContext);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
            getAllUsers {
              username
              isStudent
            }
          }
        `,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const allUsers = data.data.getAllUsers || [];
        const filtered = allUsers.filter((u) => u.username !== user.username);
        setStudents(filtered);
      })
      .catch((err) => console.error("Failed to fetch users", err));
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query GetMessages($sender: String!, $receiver: String!) {
            getMessages(sender: $sender, receiver: $receiver) {
              id
              sender
              content
              timestamp
            }
          }
        `,
        variables: {
          sender: user.username,
          receiver: selectedStudent,
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.data.getMessages || []));
  }, [selectedStudent]);

  const handleSend = () => {
    if (!inputMessage || !selectedStudent) return;
    fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation SendMessage($sender: String!, $receiver: String!, $content: String!) {
            sendMessage(sender: $sender, receiver: $receiver, content: $content) {
              id
              sender
              content
              timestamp
            }
          }
        `,
        variables: {
          sender: user.username,
          receiver: selectedStudent,
          content: inputMessage,
        },
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, data.data.sendMessage]);
        setInputMessage("");
      });
  };

  return (
    <div className={`flex flex-col md:flex-row min-h-screen pt-20 gap-6 p-4 ${
      darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
    }`}>
      <div
        className={`w-full md:w-64 p-4 rounded-lg shadow-lg ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border border-gray-200"
        }`}
      >
        <h2 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
          Users You Can Chat With
        </h2>
        <div className="space-y-2">
          {students.map((user, i) => (
            <div
              key={i}
              onClick={() => setSelectedStudent(user.username)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                darkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm uppercase ${
                  darkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                }`}
              >
                {user.username.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{user.username}</span>
                <span className="text-xs opacity-70">{user.isStudent ? "Student" : "Admin"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`flex-1 flex flex-col rounded-lg shadow-lg overflow-hidden ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border border-gray-200"
        }`}
      >
        <div
          className={`text-lg font-semibold px-4 py-3 border-b ${
            darkMode ? "border-gray-700 text-white" : "border-gray-200 text-gray-800"
          }`}
        >
          Chatting with {selectedStudent || "(Name)"}...
        </div>

        <div
          className={`flex-1 p-4 overflow-y-auto space-y-3 ${
            darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-50 text-gray-800"
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg max-w-xs ${
                msg.sender === user.username
                  ? "ml-auto " + (darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white")
                  : darkMode
                  ? "bg-gray-700"
                  : "bg-blue-100"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        <div
          className={`flex items-center border-t p-3 ${
            darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
          }`}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className={`flex-1 px-4 py-2 rounded-lg mr-3 text-sm focus:outline-none focus:ring-2 ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                : "bg-white border border-gray-300 text-gray-800 focus:ring-blue-500"
            }`}
          />
          <button
            onClick={handleSend}
            className={`px-5 py-2 rounded-lg transition ${
              darkMode ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
