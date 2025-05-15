import React, { useContext, useEffect, useState, useRef } from "react";
import { ThemeContext } from "../App";

const Chat = () => {
  const { darkMode } = useContext(ThemeContext);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null); // Will store {username, email}
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [newMessageNotification, setNewMessageNotification] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [latestMessageTimestamps, setLatestMessageTimestamps] = useState({}); // Add state for timestamps
  const [wsReady, setWsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const messageContainerRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Get all users for the sidebar and set up WebSocket connection
  useEffect(() => {
    fetchUsers();
    setupWebSocket();

    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Set up WebSocket connection  // Function to fetch latest message timestamp for a user
  const fetchLatestMessageTimestamp = async (otherUser) => {
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetMessages($senderUsername: String!, $senderEmail: String!, $receiverUsername: String!, $receiverEmail: String!) {
              getMessages(senderUsername: $senderUsername, senderEmail: $senderEmail, receiverUsername: $receiverUsername, receiverEmail: $receiverEmail) {
                timestamp
              }
            }
          `,
          variables: {
            senderUsername: user.username,
            senderEmail: user.email,
            receiverUsername: otherUser.username,
            receiverEmail: otherUser.email,
          },
        }),
      });

      const data = await res.json();
      const messagesData = data.data.getMessages || [];

      if (messagesData.length > 0) {
        // Sort messages by timestamp descending and get the latest one
        messagesData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        const latestTimestamp = messagesData[0].timestamp;

        // Update the state with this timestamp
        setLatestMessageTimestamps((prev) => ({
          ...prev,
          [`${otherUser.username}-${otherUser.email}`]: latestTimestamp,
        }));
      }
    } catch (error) {
      console.error("Error fetching latest message timestamp:", error);
    }
  };

  const setupWebSocket = () => {
    wsRef.current = new WebSocket("ws://localhost:4000");

    wsRef.current.onopen = () => {
      console.log("WebSocket connection established");
      setWsReady(true);
      // Identify the user to the server
      if (user && user.username && user.email) {
        wsRef.current.send(
          JSON.stringify({
            type: "identify",
            userId: user.username,
            userEmail: user.email,
          })
        );
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);

        switch (data.type) {
          case "message":
            handleIncomingMessage(data.message);
            break;

          case "typing":
            if (
              selectedStudent &&
              data.senderUsername === selectedStudent.username &&
              data.senderEmail === selectedStudent.email &&
              data.isTyping
            ) {
              setIsTyping(true);
              setTypingUser(data.senderUsername);

              // Clear typing indicator after 3 seconds
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
              }, 3000);
            } else if (
              selectedStudent &&
              data.senderUsername === selectedStudent.username &&
              data.senderEmail === selectedStudent.email &&
              !data.isTyping
            ) {
              setIsTyping(false);
            }
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      setWsReady(false);

      // Try to reconnect after 5 seconds
      setTimeout(setupWebSocket, 5000);
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

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
                email
                isStudent
              }
            }
          `,
        }),
      });
      const data = await res.json();
      const allUsers = data.data.getAllUsers || [];
      const filtered = allUsers.filter(
        (u) => !(u.username === user.username && u.email === user.email)
      );
      setStudents(filtered);

      // Initialize unread messages count with composite keys
      const unreadInit = {};
      const timestampInit = {};
      filtered.forEach((u) => {
        const userKey = `${u.username}-${u.email}`;
        unreadInit[userKey] = 0;
        timestampInit[userKey] = null; // Initialize with null timestamp
      });
      setUnreadMessages(unreadInit);
      setLatestMessageTimestamps(timestampInit);

      // After setting the users, fetch the latest message timestamp for each one
      filtered.forEach(async (u) => {
        fetchLatestMessageTimestamp(u);
      });
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  // Get messages when selected student changes
  useEffect(() => {
    if (!selectedStudent) return;
    fetchMessages();

    // Clear unread count when selecting a conversation
    setUnreadMessages((prev) => ({
      ...prev,
      [`${selectedStudent.username}-${selectedStudent.email}`]: 0,
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
            query GetMessages($senderUsername: String!, $senderEmail: String!, $receiverUsername: String!, $receiverEmail: String!) {
              getMessages(senderUsername: $senderUsername, senderEmail: $senderEmail, receiverUsername: $receiverUsername, receiverEmail: $receiverEmail) {
                id
                senderUsername
                senderEmail
                receiverUsername
                receiverEmail
                content
                timestamp
              }
            }
          `,
          variables: {
            senderUsername: user.username,
            senderEmail: user.email,
            receiverUsername: selectedStudent.username,
            receiverEmail: selectedStudent.email,
          },
        }),
      });
      const data = await res.json();
      const messagesData = data.data.getMessages || [];
      setMessages(messagesData);

      // If there are messages, update the latest timestamp for this user
      if (messagesData.length > 0) {
        const userKey = `${selectedStudent.username}-${selectedStudent.email}`;
        // Find the latest message by timestamp
        const latestMessage = messagesData.reduce((latest, message) => {
          return new Date(message.timestamp) > new Date(latest.timestamp)
            ? message
            : latest;
        }, messagesData[0]);

        setLatestMessageTimestamps((prev) => ({
          ...prev,
          [userKey]: latestMessage.timestamp,
        }));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play().catch((e) => console.log("Audio play failed:", e));
  };

  // Handle incoming WebSocket messages
  const handleIncomingMessage = (message) => {
    setMessages((prev) => {
      const isReal = !message.id.startsWith("temp-");
      const timeWindow = 3000;
      const msgTime = new Date(message.timestamp).getTime();

      // Remove matching temp messages if real version comes in
      const filtered = prev.filter((m) => {
        if (m.id.startsWith("temp-") && isReal) {
          const mTime = new Date(m.timestamp).getTime();
          return !(
            m.content === message.content &&
            m.senderUsername === message.senderUsername &&
            m.receiverUsername === message.receiverUsername &&
            Math.abs(mTime - msgTime) < timeWindow
          );
        }
        // Remove exact duplicates by ID
        return m.id !== message.id;
      });

      return [...filtered, message];
    });

    // Update the timestamp for latest message from this user
    const userKey =
      message.senderUsername === user.username &&
      message.senderEmail === user.email
        ? `${message.receiverUsername}-${message.receiverEmail}`
        : `${message.senderUsername}-${message.senderEmail}`;

    setLatestMessageTimestamps((prev) => ({
      ...prev,
      [userKey]: message.timestamp,
    }));

    scrollToBottom();

    // Notify only if it's from someone else
    if (
      message.senderUsername !== user.username ||
      message.senderEmail !== user.email
    ) {
      if (
        !selectedStudent ||
        message.senderUsername !== selectedStudent.username ||
        message.senderEmail !== selectedStudent.email
      ) {
        const userKey = `${message.senderUsername}-${message.senderEmail}`;
        setUnreadMessages((prev) => ({
          ...prev,
          [userKey]: (prev[userKey] || 0) + 1,
        }));
        playNotificationSound();
        setNewMessageNotification({
          from: message.senderUsername,
          count: 1,
        });
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 5000);
      }
    }
  };

  const handleSend = () => {
    if (!inputMessage.trim() || !selectedStudent || !wsReady) return;

    const messageContent = inputMessage.trim();

    // Only send via WebSocket (do not add to UI yourself)
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        senderUsername: user.username,
        senderEmail: user.email,
        receiverUsername: selectedStudent.username,
        receiverEmail: selectedStudent.email,
        content: messageContent,
      })
    );

    setInputMessage("");
    scrollToBottom();
  };

  // Send typing status
  const handleTyping = () => {
    if (!selectedStudent || !wsReady) return;

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        senderUsername: user.username,
        senderEmail: user.email,
        receiverUsername: selectedStudent.username,
        receiverEmail: selectedStudent.email,
        isTyping: true,
      })
    );

    // Stop typing status after 2 seconds
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "typing",
            senderUsername: user.username,
            senderEmail: user.email,
            receiverUsername: selectedStudent.username,
            receiverEmail: selectedStudent.email,
            isTyping: false,
          })
        );
      }
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTyping();
    }
  };

  return (
    <div
      className={`flex flex-col h-screen pt-16 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      {/* Chat container with fixed height */}
      <div className="flex flex-col md:flex-row flex-1 p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
        {/* New message notification */}
        {newMessageNotification && (
          <div
            className={`fixed top-24 right-4 p-4 rounded-lg shadow-lg z-50 animate-bounce 
            ${darkMode ? "bg-blue-900 text-white" : "bg-blue-500 text-white"}`}
          >
            <div className="flex items-center">
              <div className="mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  New message{newMessageNotification.count > 1 ? "s" : ""}
                </p>
                <p className="text-sm opacity-90">
                  From {newMessageNotification.from}
                  {newMessageNotification.count > 1
                    ? ` (${newMessageNotification.count})`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users sidebar - fixed height with scrolling */}
        <div
          className={`w-full md:w-72 p-4 rounded-lg shadow-lg flex flex-col h-full ${
            darkMode
              ? "bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700"
              : "bg-gradient-to-b from-white to-blue-50 border border-gray-200"
          } ${isMobileView && selectedStudent ? "hidden" : "block"}`}
        >
          <h2
            className={`text-lg font-bold mb-4 flex items-center ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Users You Can Chat With
          </h2>
          <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
            {students
              .slice() // Create a copy to avoid mutating the original array
              .sort((a, b) => {
                const keyA = `${a.username}-${a.email}`;
                const keyB = `${b.username}-${b.email}`;
                const timeA = latestMessageTimestamps[keyA]
                  ? new Date(latestMessageTimestamps[keyA])
                  : new Date(0);
                const timeB = latestMessageTimestamps[keyB]
                  ? new Date(latestMessageTimestamps[keyB])
                  : new Date(0);
                return timeB - timeA; // Sort in descending order (newest first)
              })
              .map((user, i) => (
                <div
                  key={i}
                  onClick={() =>
                    setSelectedStudent({
                      username: user.username,
                      email: user.email,
                    })
                  }
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedStudent &&
                    selectedStudent.username === user.username &&
                    selectedStudent.email === user.email
                      ? darkMode
                        ? "bg-blue-900/40 border-l-4 border-blue-500 shadow-md"
                        : "bg-blue-50 border-l-4 border-blue-500 shadow-md"
                      : darkMode
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600 hover:translate-x-1"
                      : "bg-gray-50 text-gray-800 hover:bg-gray-100 hover:translate-x-1 border border-gray-100"
                  }`}
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm uppercase ${
                      darkMode
                        ? "bg-blue-600 text-white"
                        : "bg-blue-100 text-blue-800"
                    } relative`}
                  >
                    {user.username.charAt(0)}
                    {/* Unread message indicator - using composite key */}
                    {unreadMessages[`${user.username}-${user.email}`] > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"></span>
                    )}
                  </div>{" "}
                  <div className="flex-1">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs opacity-70 block">
                      {user.email}
                    </span>
                    <span className="text-xs opacity-70 block">
                      {user.isStudent ? "Student" : "Admin"}
                    </span>{" "}
                    <span className="text-xs opacity-70 block mt-1">
                      {(() => {
                        const key = `${user.username}-${user.email}`;
                        const rawDate = latestMessageTimestamps[key];

                        if (!rawDate) return "No activity yet";

                        const date = new Date(rawDate);
                        if (isNaN(date.getTime())) return "Invalid timestamp";

                        return (
                          <span title={date.toISOString()}>
                            {date.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                            ,{" "}
                            {date.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                  {selectedStudent &&
                    selectedStudent.username === user.username &&
                    selectedStudent.email === user.email && (
                      <div className="ml-auto md:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent onClick
                            setSelectedStudent(null);
                          }}
                          className={`p-1 rounded-full ${
                            darkMode
                              ? "text-gray-400 hover:text-white"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                          aria-label="Close chat"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                </div>
              ))}
          </div>
        </div>

        {/* Chat main area - fixed height with flexible message area */}
        <div
          className={`flex-1 flex flex-col rounded-lg shadow-xl overflow-hidden border-2 ${
            darkMode
              ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
              : "bg-gradient-to-br from-white to-blue-50 border-blue-200"
          } ${isMobileView && !selectedStudent ? "hidden" : "block"}`}
        >
          {/* Chat header - fixed */}
          <div
            className={`text-lg font-semibold px-4 py-3 border-b flex items-center justify-between ${
              darkMode
                ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 text-white"
                : "border-gray-200 bg-gradient-to-r from-white to-blue-50 text-gray-800"
            }`}
          >
            {selectedStudent ? (
              <>
                <div className="flex items-center">
                  <div
                    className={`w-9 h-9 mr-3 rounded-full flex items-center justify-center shadow-md ${
                      darkMode
                        ? "bg-blue-600 ring-2 ring-blue-400"
                        : "bg-blue-500 ring-2 ring-blue-300"
                    } text-white`}
                  >
                    {selectedStudent.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg">
                      Chatting with {selectedStudent.username}
                    </span>
                    <span className="text-xs opacity-70">
                      {selectedStudent.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div
                    className={`text-sm font-semibold py-1 px-3 rounded-full ${
                      darkMode
                        ? "bg-blue-900/30 text-blue-100"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className={`p-2 rounded-full transition-all duration-200 hover:bg-opacity-80 close-chat-btn ${
                      darkMode
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-label="Close chat"
                    title="Close chat"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>Select a user to start chatting</span>
              </div>
            )}
          </div>

          {/* Messages area - scrollable */}
          <div
            ref={messageContainerRef}
            className={`flex-1 p-4 overflow-y-auto custom-scrollbar chat-scrollbar ${
              darkMode
                ? "bg-gray-900 text-gray-200"
                : "bg-gray-50 text-gray-800"
            }`}
          >
            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div
                  className={`w-24 h-24 mb-4 flex items-center justify-center rounded-full ${
                    darkMode ? "bg-gray-800" : "bg-blue-50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-12 w-12 ${
                      darkMode ? "text-blue-400" : "text-blue-500"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3
                  className={`text-xl font-semibold mb-2 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  No conversation selected
                </h3>
                <p className="text-center text-sm opacity-70 max-w-sm">
                  Select a user from the list to start chatting or continue a
                  previous conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`relative p-3 rounded-lg max-w-xs md:max-w-sm mb-2 chat-bubble ${
                      msg.senderUsername === user.username &&
                      msg.senderEmail === user.email
                        ? "ml-auto message-sent " +
                          (darkMode
                            ? "bg-blue-600 text-white border border-blue-700 shadow-md"
                            : "bg-blue-500 text-white border border-blue-400 shadow-md")
                        : "message-received " +
                          (darkMode
                            ? "bg-gray-700 border border-gray-600 shadow-sm"
                            : "bg-blue-100 border border-blue-200 shadow-sm")
                    }`}
                  >
                    {/* Message pointer */}
                    <div
                      className={`absolute top-2 ${
                        msg.senderUsername === user.username &&
                        msg.senderEmail === user.email
                          ? "right-0 transform translate-x-1/2 rotate-45" +
                            (darkMode ? " bg-blue-700" : " bg-blue-400")
                          : "left-0 transform -translate-x-1/2 rotate-45" +
                            (darkMode ? " bg-gray-600" : " bg-blue-200")
                      } h-3 w-3 border-t border-r ${
                        msg.senderUsername === user.username &&
                        msg.senderEmail === user.email
                          ? darkMode
                            ? "border-blue-700"
                            : "border-blue-400"
                          : darkMode
                          ? "border-gray-600"
                          : "border-blue-200"
                      }`}
                    ></div>
                    <div className="flex flex-col">
                      <div className="break-words">{msg.content}</div>{" "}
                      <span className="text-xs opacity-70 mt-1 text-right">
                        {msg.timestamp && !isNaN(new Date(msg.timestamp))
                          ? new Date(msg.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            }) +
                            " " +
                            new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Invalid time"}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Typing indicator */}
          {isTyping && selectedStudent && (
            <div
              className={`px-4 py-1 text-xs ${
                darkMode ? "text-blue-300" : "text-blue-600"
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">{typingUser} is typing</span>
                <span className="flex">
                  <span className="animate-bounce mx-0.5 w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span
                    className="animate-bounce mx-0.5 w-1.5 h-1.5 rounded-full bg-current"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                  <span
                    className="animate-bounce mx-0.5 w-1.5 h-1.5 rounded-full bg-current"
                    style={{ animationDelay: "0.4s" }}
                  ></span>
                </span>
              </div>
            </div>
          )}

          {/* WebSocket connection status */}
          {!wsReady && selectedStudent && (
            <div
              className={`px-4 py-1 text-xs ${
                darkMode ? "text-amber-300" : "text-amber-600"
              }`}
            >
              <div className="flex items-center">
                <span className="mr-2">Reconnecting to chat server...</span>
                <span className="animate-spin h-3 w-3">⟳</span>
              </div>
            </div>
          )}

          {/* Message input - fixed at bottom */}
          <div className={`flex flex-col border-t-2 ${
                darkMode ? "border-gray-700" : "border-blue-200"
              }`}>
            <div
              className={`flex items-center p-4 ${
                darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="relative flex-1 mr-3">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-3 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                      : "bg-white border border-gray-300 text-gray-800 focus:ring-blue-500"
                  } ${!selectedStudent || !wsReady ? "opacity-60" : ""}`}
                  disabled={!selectedStudent || !wsReady}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!selectedStudent || !wsReady}
                className={`px-5 py-3 rounded-lg transition-all duration-200 flex items-center ${
                  !selectedStudent || !wsReady
                    ? "bg-gray-500 text-white opacity-50 cursor-not-allowed"
                    : darkMode
                    ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transform hover:-translate-y-0.5"
                    : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
