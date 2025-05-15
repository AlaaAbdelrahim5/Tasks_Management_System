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
  const [latestMessageTimestamps, setLatestMessageTimestamps] = useState({}); // Add state for timestamps
  const [wsReady, setWsReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const messageContainerRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Track current chat via ref to avoid stale closures
  const selectedChatEmailRef = useRef(null);

  // Sync ref when chat selection changes
  useEffect(() => {
    selectedChatEmailRef.current = selectedStudent?.email || null;
  }, [selectedStudent]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Get all users for the sidebar and set up WebSocket connection
  useEffect(() => {
    fetchUsers();
    setupWebSocket();

    // Create heartbeat mechanism to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          // Less verbose logging to prevent console spam
          if (Math.random() < 0.1) {
            // Only log 10% of pings for debugging
            console.log("Sending ping to keep connection alive");
          }

          wsRef.current.send(JSON.stringify({ type: "ping" }));
        } catch (err) {
          console.error("Error sending heartbeat ping:", err);
          // Connection might be dead but not detected yet
          // Don't force close here, let the connection naturally fail
          // This prevents aggressive reconnection cycles
        }
      }
    }, 30000); // Send heartbeat every 30 seconds instead of 15 (less aggressive)

    return () => {
      // Clean up WebSocket connection - use normal closure code
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log("Component unmounting - cleaning up WebSocket connection");
        wsRef.current.close(1000, "Component unmounting");
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear the heartbeat interval
      clearInterval(heartbeatInterval);

      console.log("All intervals and timeouts cleared");
    };
  }, []);

  // Re-bind WS listener on chat change (ensures fresh selectedStudent)
  useEffect(() => {
    if (!wsRef.current) return; 
    const ws = wsRef.current; 
    const listener = (evt) => { 
      const data = JSON.parse(evt.data); 
      if (data.type === "message") handleIncomingMessage(data.message); 
    }; 
    ws.addEventListener("message", listener); 
    return () => ws.removeEventListener("message", listener); 
  }, [selectedStudent, students]); 

  // Set up WebSocket connection  // Function to fetch latest message timestamp for a user
  const fetchLatestMessageTimestamp = async (otherUser) => {
    try {
      const res = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetMessages($senderEmail: String!, $receiverEmail: String!) {
              getMessages(senderEmail: $senderEmail, receiverEmail: $receiverEmail) {
                id
                senderEmail
                receiverEmail
                content
                timestamp
              }
            }`,
          variables: {
            senderEmail: user.email,
            receiverEmail: otherUser.email,
          },
        }),
      });

      const data = await res.json();
      const messagesData = data.data.getMessages || [];

      if (messagesData.length > 0) {
        try {
          // Sort messages by timestamp descending and get the latest one
          messagesData.sort((a, b) => {
            const dateA = new Date(b.timestamp);
            const dateB = new Date(a.timestamp);

            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0; // Invalid dates should not change the order
            }

            return dateA - dateB;
          });

          const latestTimestamp = messagesData[0].timestamp;

          // Make sure it's a valid date before updating state
          const testDate = new Date(latestTimestamp);
          if (!isNaN(testDate.getTime())) {
            // Update the state with this timestamp
            setLatestMessageTimestamps((prev) => ({
              ...prev,
              [otherUser.email]: latestTimestamp,
            }));
          }
        } catch (parseError) {
          console.error("Error parsing message timestamps:", parseError);
        }
      }
    } catch (error) {
      console.error("Error fetching latest message timestamp:", error);
    }
  };

  const setupWebSocket = () => {
    // Don't attempt to reconnect if already connecting
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log("Already trying to connect, skipping reconnection attempt");
      return;
    }

    // Close any existing connection before creating a new one
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log("Closing existing WebSocket connection before reconnecting");
      wsRef.current.close();
    }

    // Update reconnection state
    setIsReconnecting(true);

    // Attempt to create a new connection
    try {
      wsRef.current = new WebSocket("ws://localhost:4000");
      console.log(
        `Setting up new WebSocket connection... (Attempt ${
          reconnectAttempts + 1
        })`
      );

      // Set a timeout to detect if connection is taking too long
      const connectionTimeout = setTimeout(() => {
        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.CONNECTING
        ) {
          console.log("Connection attempt timed out");
          // Don't close here, let the onclose handler deal with reconnection
        }
      }, 5000);

      wsRef.current.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("WebSocket connection established successfully");

        // Reset connection state
        setWsReady(true);
        setIsReconnecting(false);
        setReconnectAttempts(0);

        // Send identification message
        wsRef.current.send(
          JSON.stringify({
            type: "identify",
            userEmail: user.email,
          })
        );

        // When connection is re-established, refresh messages if in a conversation
        if (selectedStudent) {
          console.log(
            "WebSocket reconnected - refreshing current conversation"
          );
          fetchMessages();
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Don't log ping/pong messages to reduce console noise
          if (data.type !== "ping" && data.type !== "pong") {
            console.log("WebSocket message received:", data);
          }

          switch (data.type) {
            case "message":
              handleIncomingMessage(data.message);
              break;

            case "typing":
              if (
                selectedStudent &&
                data.senderEmail === selectedStudent.email &&
                data.receiverEmail === user.email
              ) {
                setIsTyping(data.isTyping);
                // look up their username for display
                const u = students.find((s) => s.email === data.senderEmail);
                setTypingUser(u?.username || data.senderEmail);

                // Clear any existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                // Set a fallback timeout to clear typing indicator
                if (data.isTyping) {
                  typingTimeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                  }, 5000);
                }
              }
              break;

            case "error":
              console.error("WebSocket error from server:", data.message);
              break;

            case "pong":
              // Server responded to our ping, connection is alive
              // Don't log every ping/pong to reduce console noise
              break;

            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log("WebSocket connection closed with code:", event.code);
        setWsReady(false);

        // Don't attempt to reconnect if the component is unmounting (code 1000 = normal closure)
        if (event.code === 1000 && event.reason === "Component unmounting") {
          console.log(
            "Normal closure due to component unmounting, not reconnecting"
          );
          setIsReconnecting(false);
          return;
        }

        // Handle reconnection
        handleReconnection();
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error occurred:", error);
        // Error handling done in onclose
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      handleReconnection();
    }
  };

  // Separate function to handle reconnection logic
  const handleReconnection = () => {
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Only attempt reconnect if we're not already reconnecting
    if (isReconnecting) {
      console.log("Already in reconnecting state, not starting a new attempt");
      return;
    }

    // Calculate reconnect delay with exponential backoff (5s, 10s, 20s up to 60s max)
    const attempts = reconnectAttempts;
    const maxDelay = 60000; // 60 seconds maximum delay
    const baseDelay = 5000; // 5 seconds base delay (increased from 3)
    let reconnectDelay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);

    // Add some randomness to prevent all clients reconnecting simultaneously
    reconnectDelay += Math.random() * 2000; // More randomness (up to 2 seconds)

    console.log(
      `Attempting to reconnect in ${(reconnectDelay / 1000).toFixed(
        1
      )}s... (Attempt ${attempts + 1})`
    );

    // Increment the reconnection attempt counter
    setReconnectAttempts((prev) => prev + 1);
    setIsReconnecting(true);

    // Try to reconnect after the calculated delay
    reconnectTimeoutRef.current = setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        // Check if we're already connected before attempting to reconnect
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log("Already connected, cancelling reconnection attempt");
          setIsReconnecting(false);
          return;
        }

        // Attempt to reconnect
        setupWebSocket();
      } else {
        console.log(
          "Page not visible, delaying reconnection until user returns"
        );
        // We'll reconnect when the user returns to the page
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            console.log("User returned to page, attempting reconnection");
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange
            );

            // Double-check connection state again after visibility change
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              console.log(
                "Already connected after tab focus, cancelling reconnection"
              );
              setIsReconnecting(false);
              return;
            }

            setupWebSocket();
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
      }
    }, reconnectDelay);
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
        unreadInit[u.email] = 0;
        timestampInit[u.email] = null;
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
  }; // Get messages when selected student changes and set up message refresh
  useEffect(() => {
    if (!selectedStudent) return;

    console.log("Selected student changed to:", selectedStudent.username);

    // Initial fetch
    fetchMessages();

    // Clear unread count when selecting a conversation
    setUnreadMessages((prev) => ({
      ...prev,
      [selectedStudent.email]: 0,
    }));

    // clear unread count
    setUnreadMessages((prev) => ({
      ...prev,
      [selectedStudent.email]: 0,
    }));
  }, [selectedStudent]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchMessages = async () => {
    if (!selectedStudent) return;

    console.log(
      "Fetching messages for conversation with:",
      selectedStudent.email
    );

    try {
      // Add a random query parameter to prevent browser caching
      const timestamp = new Date().getTime();
      const res = await fetch(
        `http://localhost:4000/graphql?nocache=${timestamp}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          body: JSON.stringify({
            query: `
            query GetMessages($senderEmail: String!, $receiverEmail: String!) {
              getMessages(senderEmail: $senderEmail, receiverEmail: $receiverEmail) {
                id
                senderEmail
                receiverEmail
                content
                timestamp
              }
            }`,
            variables: {
              senderEmail: user.email,
              receiverEmail: selectedStudent.email,
            },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Network error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const messagesData = data.data?.getMessages || [];

      // Don't log every fetch
      if (messagesData.length > 0) {
        console.log("Retrieved", messagesData.length, "messages");
      }

      // Make sure we're still in the same conversation before updating messages
      if (selectedStudent) {
        // Preserve any temporary messages that haven't been confirmed yet
        setMessages((prevMessages) => {
          // Extract any temp messages in the current conversation
          const tempMessages = prevMessages.filter(
            (m) =>
              m.id.startsWith("temp-") &&
              m.senderEmail === user.email &&
              m.receiverEmail === selectedStudent.email
          );

          // If we have temp messages, we need to be careful not to create duplicates
          if (tempMessages.length > 0) {
            // For each temp message, check if there's a real message with matching content
            const mergedMessages = [...messagesData];

            tempMessages.forEach((tempMsg) => {
              // Check if this temp message has a corresponding real message
              const hasRealVersion = messagesData.some(
                (realMsg) =>
                  realMsg.content === tempMsg.content &&
                  realMsg.senderEmail === tempMsg.senderEmail &&
                  realMsg.receiverEmail === tempMsg.receiverEmail &&
                  Math.abs(
                    new Date(realMsg.timestamp).getTime() -
                      new Date(tempMsg.timestamp).getTime()
                  ) < 10000
              );

              // If no real version exists yet, keep the temp message
              if (!hasRealVersion) {
                mergedMessages.push(tempMsg);
              }
            });

            return mergedMessages;
          }

          // If no temp messages, just use the fetched messages
          return messagesData;
        });

        // If there are messages, update the latest timestamp for this user
        if (messagesData.length > 0) {
          const userKey = selectedStudent.email;

          // Find the latest message by timestamp
          const latestMessage = messagesData.reduce((latest, message) => {
            const dateLatest = new Date(latest.timestamp);
            const dateCurrent = new Date(message.timestamp);

            // Handle invalid dates
            if (isNaN(dateLatest.getTime())) return message;
            if (isNaN(dateCurrent.getTime())) return latest;

            return dateCurrent > dateLatest ? message : latest;
          }, messagesData[0]);

          if (latestMessage) {
            setLatestMessageTimestamps((prev) => ({
              ...prev,
              [userKey]: latestMessage.timestamp,
            }));
          }

          // Always scroll to bottom when messages are updated
          setTimeout(scrollToBottom, 100);
        }
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
  }; // Handle incoming WebSocket messages

    // Incoming message handler using selectedChatEmailRef
const handleIncomingMessage = (message) => {
    const otherEmail =
      message.senderEmail === user.email ? message.receiverEmail : message.senderEmail;

    // Update sidebar timestamp
    setLatestMessageTimestamps(prev => ({ ...prev, [otherEmail]: message.timestamp }));

    // Bump unread if not current chat
    if (message.senderEmail !== user.email && selectedChatEmailRef.current !== otherEmail) {
      setUnreadMessages(u => ({ ...u, [otherEmail]: (u[otherEmail] || 0) + 1 }));
      playNotificationSound();
      
      // Find the sender in the students list to get their username
      const sender = students.find(s => s.email === message.senderEmail);
      if (sender) {
        // Show notification with the sender's name and message content
        showNotification(sender.username, message.content);
      }
    }

    // If message is for current chat, append immediately with dedupe of temp
    if (selectedChatEmailRef.current === otherEmail) {
      setMessages(prev => {
        // remove any temp message matching content
        const cleaned = prev.filter(m => !(m.id.startsWith("temp-") && m.content === message.content));
        // remove any existing same-id message
        const withoutDup = cleaned.filter(m => m.id !== message.id);
        return [...withoutDup, message]; 
      });
      scrollToBottom();
    }
  };

  // Handle the notification click to switch to conversation
  const handleNotificationClick = (email) => {
    // Find the student with this email
    const student = students.find(s => s.email === email);
    if (student) {
      // Select this student to open the conversation
      setSelectedStudent({
        username: student.username,
        email: student.email,
      });
      // Clear the notification
      setNewMessageNotification(null);
      // Reset unread count
      setUnreadMessages(prev => ({
        ...prev,
        [email]: 0
      }));
    }
  };

  // Show a notification with proper message preview
  const showNotification = (sender, message, unreadCount = 1) => {
    // Truncate message if it's too long
    const preview = message.length > 50 ? message.substring(0, 47) + '...' : message;
    
    // Set notification state
    setNewMessageNotification({
      sender,
      preview,
      timestamp: new Date(),
      unreadCount,
      senderEmail: students.find(s => s.username === sender)?.email || ''
    });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNewMessageNotification(null);
    }, 5000);
  };

  const handleSend = () => {
    if (!inputMessage.trim() || !selectedStudent) return;

    const content = inputMessage.trim();
    const now = new Date().toISOString();
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 5)}`;

    // 1) show the UI immediately
    const tempMessage = {
      id: tempId,
      senderEmail: user.email,
      receiverEmail: selectedStudent.email,
      content,
      timestamp: now,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInputMessage("");
    scrollToBottom();

    // 2) try WS first
    let wsSent = false;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const wsPayload = {
        type: "message",
        senderEmail: user.email,
        receiverEmail: selectedStudent.email,
        content,
        tempId, // we include this in case you want to match it on the server
      };
      wsRef.current.send(JSON.stringify(wsPayload));
      wsSent = true;
    }

    // 3) ONLY fall back to HTTP if WS wasn’t open
    if (!wsSent) {
      fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
          mutation SendMessage($senderEmail: String!, $receiverEmail: String!, $content: String!) {
            sendMessage(senderEmail: $senderEmail, receiverEmail: $receiverEmail, content: $content) {
              id senderEmail receiverEmail content timestamp
            }
          }`,
          variables: {
            senderEmail: user.email,
            receiverEmail: selectedStudent.email,
            content,
          },
        }),
      })
        .then((r) => r.json())
        .then(({ data }) => {
          if (data?.sendMessage) {
            // replace our temp message with the real one
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? data.sendMessage : m))
            );
            scrollToBottom();
          }
        })
        .catch(console.error);
    }
  };

  // Send typing status
  const handleTyping = () => {
    if (!selectedStudent || !wsReady) return;

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        senderEmail: user.email,
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
            senderEmail: user.email,
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

  // WebSocket connection status
  const renderConnectionStatus = () => {
    if (wsReady) return null;

    return (
      <div
        className={`px-4 py-2 text-xs flex items-center justify-between ${
          darkMode
            ? "bg-gray-800 text-amber-300"
            : "bg-gray-100 text-amber-600"
        } border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex items-center">
          <span className="mr-2">
            {isReconnecting
              ? `Reconnecting to chat server (Attempt ${reconnectAttempts})...`
              : "Connection to chat server lost"}
          </span>
          <span className="animate-spin h-3 w-3 text-amber-500">⟳</span>
        </div>

        <button
          onClick={() => {
            console.log("Manual reconnection attempt");
            setupWebSocket();
          }}
          className={`px-2 py-1 rounded text-xs ${
            darkMode
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-amber-500 hover:bg-amber-400 text-white"
          } transition-colors`}
        >
          Reconnect Now
        </button>
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col h-screen pt-16 ${
        darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      {/* Chat container with fixed height */}
      <div className="flex flex-col md:flex-row flex-1 p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
        {/* New message notification */}{" "}
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
                const tA = latestMessageTimestamps[a.email]
                  ? new Date(latestMessageTimestamps[a.email])
                  : 0;
                const tB = latestMessageTimestamps[b.email]
                  ? new Date(latestMessageTimestamps[b.email])
                  : 0;
                return tB - tA;
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
                    {unreadMessages[user.email] > 0 && (
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
                        const rawDate = latestMessageTimestamps[user.email];

                        if (!rawDate) return "No activity yet";

                        try {
                          const date = new Date(rawDate);
                          if (isNaN(date.getTime()))
                            throw new Error("Invalid date");

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
                        } catch (err) {
                          console.error("Date parsing error:", err, rawDate);
                          return "Recent activity";
                        }
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
                    c
                    className={`relative p-3 rounded-lg max-w-xs md:max-w-sm mb-2 chat-bubble ${
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
                        msg.senderEmail === user.email
                          ? "right-0 transform translate-x-1/2 rotate-45" +
                            (darkMode ? " bg-blue-700" : " bg-blue-400")
                          : "left-0 transform -translate-x-1/2 rotate-45" +
                            (darkMode ? " bg-gray-600" : " bg-blue-200")
                      } h-3 w-3 border-t border-r ${
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
                        {(() => {
                          if (!msg.timestamp) return "";

                          try {
                            const date = new Date(msg.timestamp);
                            if (isNaN(date.getTime()))
                              throw new Error("Invalid date");

                            return (
                              date.toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              }) +
                              " " +
                              date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            );
                          } catch (err) {
                            console.error(
                              "Message date parsing error:",
                              err,
                              msg.timestamp
                            );
                            return "Just now";
                          }
                        })()}
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
          {!wsReady && selectedStudent && renderConnectionStatus()}

          {/* Message input - fixed at bottom */}
          <div
            className={`flex flex-col border-t-2 ${
              darkMode ? "border-gray-700" : "border-blue-200"
            }`}
          >
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
          </div>        </div>
      </div>      {/* New message notification popup */}
      {newMessageNotification && (
        <div 
          onClick={() => handleNotificationClick(newMessageNotification.senderEmail)}
          className={`fixed top-20 right-5 p-4 rounded-lg shadow-lg cursor-pointer transform transition-all duration-300 animate-bounce-once ${
            darkMode 
              ? 'bg-gray-800 text-white border border-blue-600 shadow-blue-600/20' 
              : 'bg-white text-gray-800 border border-blue-300 shadow-blue-300/20'
          } max-w-xs hover:scale-105 transition-transform`}
          style={{
            zIndex: 1000,
            animation: `notificationAppear 1s cubic-bezier(0.22, 1, 0.36, 1) forwards, gentle-pulse 2s infinite`
          }}
        >
          <div className="flex items-start">
            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              darkMode ? 'bg-blue-600' : 'bg-blue-100'
            }`}>
              {/* Notification icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-blue-600'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              
              {/* Small dot indicating new message */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                !              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <p className="font-bold">{newMessageNotification.sender}</p>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  New message
                </span>
              </div>
              <p className="text-sm opacity-80">{newMessageNotification.preview}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(newMessageNotification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setNewMessageNotification(null);
              }}
              className={`ml-3 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
