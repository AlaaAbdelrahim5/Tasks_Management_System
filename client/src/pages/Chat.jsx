import React, { useContext, useEffect, useState, useRef } from "react";
import { ThemeContext } from "../App";

const Chat = () => {
  const { darkMode } = useContext(ThemeContext);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const messageContainerRef = useRef(null);

  // Get all users for the sidebar
  useEffect(() => {
    fetchUsers();
    
    // Set up global polling for new messages every 3 seconds
    const intervalId = setInterval(checkAllNewMessages, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:4000/graphql", {
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
      });
      
      const data = await res.json();
      const allUsers = data.data.getAllUsers || [];
      const filtered = allUsers.filter((u) => u.username !== user.username);
      setStudents(filtered);
      
      // Initialize unread messages count
      const unreadInit = {};
      filtered.forEach(u => {
        unreadInit[u.username] = 0;
      });
      setUnreadMessages(unreadInit);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  // Get messages when selected student changes
  useEffect(() => {
    if (!selectedStudent) return;
    fetchMessages();
    
    // Clear unread count when selecting a conversation
    setUnreadMessages(prev => ({
      ...prev,
      [selectedStudent]: 0
    }));
  }, [selectedStudent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetMessages($sender: String!, $receiver: String!) {
              getMessages(sender: $sender, receiver: $receiver) {
                id
                sender
                receiver
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
      });
      const data = await res.json();
      setMessages(data.data.getMessages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  
  // Check for new messages from ALL users (not just selected)
  const checkAllNewMessages = async () => {
    try {
      // Create a copy of students for potential reordering
      let updatedStudents = [...students];
      let hasNewMessages = false;
      
      // For each student, check if there are new messages
      for (const student of students) {
        const username = student.username;
        
        const res = await fetch("http://localhost:4000/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query GetLatestMessageCount($sender: String!, $receiver: String!) {
                getLatestMessageCount(sender: $sender, receiver: $receiver)
              }
            `,
            variables: {
              sender: username,
              receiver: user.username,
            },
          }),
        });
        
        const data = await res.json();
        const newMessageCount = data.data.getLatestMessageCount || 0;
        
        console.log(`Checking messages from ${username}: Count ${newMessageCount}`);
        
        // If there are new messages and this is not the currently selected chat
        if (newMessageCount > 0 && username !== selectedStudent) {
          hasNewMessages = true;
          
          // Update unread count
          setUnreadMessages(prev => ({
            ...prev,
            [username]: (prev[username] || 0) + newMessageCount
          }));
          
          // Move this student to the top of the list
          updatedStudents = [
            student,
            ...updatedStudents.filter(s => s.username !== username)
          ];
          
          // Show notification
          setNewMessageNotification({
            from: username,
            count: newMessageCount
          });
          
          // Play sound
          playNotificationSound();
        }
        
        // If this is the selected chat, update messages
        if (username === selectedStudent) {
          fetchMessages();
        }
      }
      
      // Only update student list if order has changed
      if (hasNewMessages) {
        console.log("Reordering student list");
        setStudents(updatedStudents);
        
        // Auto-dismiss notification after 5 seconds
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Error checking for new messages:", error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const handleSend = () => {
    if (!inputMessage.trim() || !selectedStudent) return;
    
    fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation SendMessage($sender: String!, $receiver: String!, $content: String!) {
            sendMessage(sender: $sender, receiver: $receiver, content: $content) {
              id
              sender
              receiver
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
        // Check if the response contains message data
        if (data.data && data.data.sendMessage) {
          setMessages((prev) => [...prev, data.data.sendMessage]);
          setInputMessage("");
          scrollToBottom();
          
          // Always move this conversation to the top of the list when sending a message
          const currentStudent = students.find(s => s.username === selectedStudent);
          if (currentStudent) {
            console.log(`Moving ${selectedStudent} to top after sending message`);
            setStudents([
              currentStudent,
              ...students.filter(s => s.username !== selectedStudent)
            ]);
          }
        } else {
          console.error("Invalid response from server:", data);
        }
      })
      .catch(err => console.error("Failed to send message:", err));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-screen pt-16 ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}>
      {/* Chat container with fixed height */}
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-6 overflow-hidden">
        {/* New message notification */}
        {newMessageNotification && (
          <div className={`fixed top-24 right-4 p-4 rounded-lg shadow-lg z-50 animate-bounce 
            ${darkMode ? "bg-blue-900 text-white" : "bg-blue-500 text-white"}`}>
            <div className="flex items-center">
              <div className="mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">New message{newMessageNotification.count > 1 ? 's' : ''}</p>
                <p className="text-sm opacity-90">
                  From {newMessageNotification.from} 
                  {newMessageNotification.count > 1 ? ` (${newMessageNotification.count})` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users sidebar - fixed height with scrolling */}
        <div
          className={`w-full md:w-64 p-4 rounded-lg shadow-lg flex flex-col h-full ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-bold mb-4 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Users You Can Chat With
          </h2>
          <div className="space-y-2 overflow-y-auto flex-1">
            {students.map((user, i) => (
              <div
                key={i}
                onClick={() => setSelectedStudent(user.username)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                  selectedStudent === user.username ? 
                    (darkMode ? "bg-blue-900/40 border-l-4 border-blue-500" : "bg-blue-50 border-l-4 border-blue-500") : 
                    (darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-100")
                }`}
              >
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm uppercase ${
                    darkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                  } relative`}
                >
                  {user.username.charAt(0)}
                  {/* Unread message indicator */}
                  {unreadMessages[user.username] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages[user.username] > 9 ? '9+' : unreadMessages[user.username]}
                    </span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs opacity-70">
                    {user.isStudent ? "Student" : "Admin"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat main area - fixed height with flexible message area */}
        <div
          className={`flex-1 flex flex-col rounded-lg shadow-lg overflow-hidden ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border border-gray-200"
          }`}
        >
          {/* Chat header - fixed */}
          <div
            className={`text-lg font-semibold px-4 py-3 border-b flex items-center justify-between ${
              darkMode
                ? "border-gray-700 text-white"
                : "border-gray-200 text-gray-800"
            }`}
          >
            {selectedStudent ? (
              <>
                <div className="flex items-center">
                  <div className={`w-8 h-8 mr-2 rounded-full flex items-center justify-center ${
                    darkMode ? "bg-blue-600" : "bg-blue-500"
                  } text-white`}>
                    {selectedStudent.charAt(0).toUpperCase()}
                  </div>
                  <span>Chatting with {selectedStudent}</span>
                </div>
                <div className="text-sm font-normal opacity-70">
                  {messages.length} messages
                </div>
              </>
            ) : (
              <span>Select a user to start chatting</span>
            )}
          </div>

          {/* Messages area - scrollable */}
          <div
            ref={messageContainerRef}
            className={`flex-1 p-4 overflow-y-auto ${
              darkMode
                ? "bg-gray-900 text-gray-200"
                : "bg-gray-50 text-gray-800"
            }`}
          >
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg max-w-xs ${
                    msg.sender === user.username
                      ? "ml-auto " +
                        (darkMode
                          ? "bg-blue-600 text-white"
                          : "bg-blue-500 text-white")
                      : darkMode
                      ? "bg-gray-700"
                      : "bg-blue-100"
                  }`}
                >
                  <div className="flex flex-col">
                    {msg.content}
                    <span className="text-xs opacity-70 mt-1 text-right">
                      {new Date(parseInt(msg.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input - fixed at bottom */}
          <div
            className={`flex items-center border-t p-3 ${
              darkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            }`}
          >
            <input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`flex-1 px-4 py-2 rounded-lg mr-3 text-sm focus:outline-none focus:ring-2 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                  : "bg-white border border-gray-300 text-gray-800 focus:ring-blue-500"
              }`}
              disabled={!selectedStudent}
            />
            <button
              onClick={handleSend}
              disabled={!selectedStudent}
              className={`px-5 py-2 rounded-lg transition ${
                !selectedStudent 
                  ? "bg-gray-500 text-white opacity-50 cursor-not-allowed" 
                  : darkMode
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-blue-600 text-white hover:bg-blue-500"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;