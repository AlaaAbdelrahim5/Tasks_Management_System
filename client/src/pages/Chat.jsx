import React, { useContext, useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { ThemeContext } from "../App";
import { GET_ALL_USERS, GET_MESSAGES, SEND_MESSAGE, MESSAGE_RECEIVED } from "../graphql/queries";

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
  // Query to get all users
  const { loading: usersLoading } = useQuery(GET_ALL_USERS, {
    onCompleted: (data) => {
      const allUsers = data.getAllUsers || [];
      const filtered = allUsers.filter((u) => u.email !== user.email);
      setStudents(filtered);      // Initialize unread messages count
      const unreadInit = {};
      filtered.forEach(u => {
        // Create a unique key for each user combining username and email
        const uniqueKey = `${u.username}_${u.email}`;
        unreadInit[uniqueKey] = 0;
      });
      setUnreadMessages(unreadInit);
    },
    onError: (err) => {
      console.error("Failed to fetch users", err);
    }
  });  // Get messages when selected student changes
  const { loading: messagesLoading, refetch: refetchMessages } = useQuery(GET_MESSAGES, {
    variables: { 
      sender: user?.email || "", 
      receiver: selectedStudent?.email || "" 
    },
    skip: !selectedStudent,
    onCompleted: (data) => {
      if (data && data.getMessages) {
        setMessages(data.getMessages);        // Clear unread count when selecting a conversation
        setUnreadMessages(prev => ({
          ...prev,
          [`${selectedStudent.username}_${selectedStudent.email}`]: 0
        }));
      }
    },
    onError: (error) => {
      console.error("Error fetching messages:", error);
    },
    fetchPolicy: "network-only" // Always fetch from server
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();  }, [messages]);  
  
  // Subscribe to new messages  
  useEffect(() => {
    console.log("Setting up message subscription for user:", user?.email);
  }, []); // Log once on component mount
  const { data: subscriptionData, loading: subLoading, error: subError } = useSubscription(MESSAGE_RECEIVED, {
    variables: { receiver: user?.email || "" },
    skip: !user?.email,
    shouldResubscribe: user?.email ? true : false,
    onSubscriptionData: ({ subscriptionData }) => {
      console.log("Subscription data received:", subscriptionData);
      if (!subscriptionData?.data?.messageReceived) {
        console.log("No valid message data received");
        return;
      }
      
      const newMessage = subscriptionData.data.messageReceived;
        // Skip if this message was sent from this client - optimistic update already handled it
      const isOptimisticMessageUpdate = 
        newMessage.sender === user.email && 
        newMessage.content === inputMessage &&
        Date.now() - parseInt(newMessage.timestamp) < 2000; // Within 2 seconds
        
      if (isOptimisticMessageUpdate) {
        console.log("Skipping duplicate message from subscription (already handled locally)");
        return;
      }
      
      console.log("WebSocket received message:", newMessage);
        // If we're currently viewing this conversation - using email addresses
      if ((selectedStudent?.email === newMessage.sender && newMessage.receiver === user.email) || 
          (selectedStudent?.email === newMessage.receiver && newMessage.sender === user.email)) {
        console.log("Adding message to current conversation");
        setMessages(prevMessages => {
          // Check if message is already in the list (prevent duplicates)
          const messageExists = prevMessages.some(msg => 
            msg.id === newMessage.id || 
            (msg.content === newMessage.content && 
             msg.sender === newMessage.sender &&
             Math.abs(parseInt(msg.timestamp) - parseInt(newMessage.timestamp)) < 5000) // Within 5 seconds
          );
          
          if (messageExists) {
            console.log("Message already exists in chat, not adding duplicate");
            return prevMessages;
          }
          
          return [...prevMessages, newMessage];
        });
        // Immediately scroll to show new message
        setTimeout(scrollToBottom, 100);      } else if (newMessage.sender !== user.email) {
        // Message is from someone else but not in current conversation
        console.log("Message from other user:", newMessage.sender);
          // Find the user with this email to update unread count by username and email
        const senderUser = students.find(s => s.email === newMessage.sender);
        if (senderUser) {          const uniqueUserKey = `${senderUser.username}_${senderUser.email}`;
          setUnreadMessages(prev => ({
            ...prev,
            [uniqueUserKey]: (prev[uniqueUserKey] || 0) + 1
          }));
        }        // Show notification for new message using the username from previously found senderUser
        setNewMessageNotification({
          from: senderUser ? senderUser.username : newMessage.sender,
          count: 1
        });
        
        // Play sound
        playNotificationSound();
          // Move this sender to the top of the list - using email address
        // senderUser is already found earlier in this function
        if (senderUser) {
          setStudents(prevStudents => [
            senderUser,
            ...prevStudents.filter(s => s.email !== newMessage.sender)
          ]);
        }
        
        // Auto-dismiss notification after 5 seconds
        setTimeout(() => {
          setNewMessageNotification(null);
        }, 5000);
      }
    },
    onError: (error) => {
      console.error("WebSocket subscription error:", error);
    }
  });

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log("Audio play failed:", e));
  };  // Mutation to send a message
  const [sendMessageMutation, { loading: sendingMessage }] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) => {
      if (data && data.sendMessage) {
        console.log("Message sent successfully:", data.sendMessage);
        
        // Add the new message to the local state 
        // (may be redundant with subscription, but ensures UI updates)
        setMessages(prev => {
          // Check if the message is already in the list (from subscription)
          const messageExists = prev.some(msg => msg.id === data.sendMessage.id);
          if (messageExists) return prev;
          return [...prev, data.sendMessage];
        });
        
        setInputMessage("");
        scrollToBottom();        // Always move this conversation to the top of the list when sending a message
        if (selectedStudent) {
          console.log(`Moving ${selectedStudent.username} to top after sending message`);
          setStudents([
            selectedStudent,
            ...students.filter(s => s.email !== selectedStudent.email)
          ]);
        }
      }
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  });
    // Track last sent message to prevent duplicates
  const lastSentMessageRef = useRef(null);
  
  const handleSend = () => {
    if (!inputMessage.trim() || !selectedStudent) return;
    
    // Don't allow sending the same message twice in quick succession
    const currentTime = Date.now();
    const messageContent = inputMessage.trim();
    
    if (lastSentMessageRef.current && 
        lastSentMessageRef.current.content === messageContent &&
        currentTime - lastSentMessageRef.current.time < 2000) {
      console.log("Preventing duplicate message send");
      return;
    }
    
    // Remember this message to prevent duplicates
    lastSentMessageRef.current = {
      content: messageContent,
      time: currentTime
    };
    
    // Create an optimistic response (show message immediately)
    const optimisticId = `temp-${currentTime}`;    const optimisticMessage = {
      id: optimisticId,
      sender: user.email,
      receiver: selectedStudent.email,
      content: messageContent,
      timestamp: currentTime.toString()
    };
    
    // Add optimistic message to UI
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input field
    setInputMessage("");
      // Send mutation
    sendMessageMutation({
      variables: {
        sender: user.email,
        receiver: selectedStudent.email,
        content: messageContent
      },
      optimisticResponse: {
        sendMessage: optimisticMessage
      },
      update: (cache, { data }) => {
        if (data && data.sendMessage) {
          // Replace the temporary message with the real one
          setMessages(prev => 
            prev.map(msg => 
              msg.id === optimisticId ? data.sendMessage : msg
            )
          );
        }
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileLayout, setMobileLayout] = useState(true);

  // Track window resize for mobile view
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
      
      // Reset to showing the user list when switching to mobile
      if (isMobile && !mobileLayout) {
        setMobileLayout(true);
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileLayout]);
  
  // When selecting a student in mobile view, switch to chat
  useEffect(() => {
    if (selectedStudent && isMobileView) {
      setMobileLayout(false);
    }
  }, [selectedStudent, isMobileView]);

  return (
    <div className={`flex flex-col h-screen pt-16 ${darkMode ? "bg-gray-900 text-gray-200" : "bg-white text-gray-800"}`}>
      {/* Chat container with fixed height */}
      <div className="flex flex-col md:flex-row flex-1 p-4 md:p-6 gap-4 md:gap-6 overflow-hidden">
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
        )}        {/* Users sidebar - fixed height with scrolling */}          <div
          className={`w-full md:w-72 p-4 rounded-lg shadow-lg flex flex-col h-full ${
            darkMode 
              ? "bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700" 
              : "bg-gradient-to-b from-white to-blue-50 border border-gray-200"
          } ${isMobileView && selectedStudent ? 'hidden' : 'block'}`}
        >
          <h2
            className={`text-lg font-bold mb-4 flex items-center ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Users You Can Chat With
          </h2>
          <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
            {students.map((user, i) => (
              <div
                key={i}
                onClick={() => setSelectedStudent(user)}                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedStudent && selectedStudent.email === user.email ? 
                    (darkMode ? "bg-blue-900/40 border-l-4 border-blue-500 shadow-md" : "bg-blue-50 border-l-4 border-blue-500 shadow-md") : 
                    (darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600 hover:translate-x-1" : "bg-gray-50 text-gray-800 hover:bg-gray-100 hover:translate-x-1 border border-gray-100")
                }`}
              >
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm uppercase ${
                    darkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                  } relative`}
                >
                  {user.username.charAt(0)}                  {/* Unread message indicator */}
                  {unreadMessages[`${user.username}_${user.email}`] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadMessages[`${user.username}_${user.email}`] > 9 ? '9+' : unreadMessages[`${user.username}_${user.email}`]}
                    </span>
                  )}
                </div>                <div className="flex-1">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs opacity-70 block">
                    {user.isStudent ? "Student" : "Admin"}
                  </span>
                </div>
                {selectedStudent && selectedStudent.email === user.email && (
                  <div className="ml-auto md:hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        setSelectedStudent(null);
                      }}
                      className={`p-1 rounded-full ${
                        darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                      }`}
                      aria-label="Close chat"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>        {/* Chat main area - fixed height with flexible message area */}        <div
          className={`flex-1 flex flex-col rounded-lg shadow-xl overflow-hidden border-2 ${
            darkMode 
              ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700" 
              : "bg-gradient-to-br from-white to-blue-50 border-blue-200"
          } ${isMobileView && !selectedStudent ? 'hidden' : 'block'}`}
        >{/* Chat header - fixed */}
          <div
            className={`text-lg font-semibold px-4 py-3 border-b flex items-center justify-between ${
              darkMode
                ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700 text-white"
                : "border-gray-200 bg-gradient-to-r from-white to-blue-50 text-gray-800"
            }`}
          >            {selectedStudent ? (
              <>
                <div className="flex items-center">                {/* Removing the back button from this location as we're using the floating action button instead */}
                  <div className={`w-9 h-9 mr-3 rounded-full flex items-center justify-center shadow-md ${
                    darkMode ? "bg-blue-600 ring-2 ring-blue-400" : "bg-blue-500 ring-2 ring-blue-300"
                  } text-white`}>
                    {selectedStudent.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg">Chatting with {selectedStudent.username}</span>
                    <span className="text-xs opacity-70">
                      {selectedStudent.isStudent ? "Student" : "Admin"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`text-sm font-semibold py-1 px-3 rounded-full ${
                    darkMode ? "bg-blue-900/30 text-blue-100" : "bg-blue-100 text-blue-800"
                  }`}>
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </div>                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className={`p-2 rounded-full transition-all duration-200 hover:bg-opacity-80 close-chat-btn ${
                      darkMode 
                        ? "bg-gray-700 text-gray-200 hover:bg-gray-600" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    aria-label="Close chat"
                    title="Close chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>Select a user to start chatting</span>
              </div>
            )}
          </div>          {/* Messages area - scrollable */}          <div
            ref={messageContainerRef}
            className={`flex-1 p-4 overflow-y-auto custom-scrollbar chat-scrollbar ${
              darkMode
                ? "bg-gray-900 text-gray-200"
                : "bg-gray-50 text-gray-800"
            }`}
          >
            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className={`w-24 h-24 mb-4 flex items-center justify-center rounded-full ${
                  darkMode ? "bg-gray-800" : "bg-blue-50"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${
                    darkMode ? "text-blue-400" : "text-blue-500"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                  No conversation selected
                </h3>
                <p className="text-center text-sm opacity-70 max-w-sm">
                  Select a user from the list to start chatting or continue a previous conversation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">{messages.map((msg) => (                <div
                  key={msg.id}
                  className={`relative p-3 rounded-lg max-w-xs md:max-w-sm mb-2 chat-bubble ${
                    msg.sender === user.email
                      ? "ml-auto message-sent " +
                        (darkMode
                          ? "bg-blue-600 text-white border border-blue-700 shadow-md"
                          : "bg-blue-500 text-white border border-blue-400 shadow-md")
                      : "message-received " + (
                        darkMode
                          ? "bg-gray-700 border border-gray-600 shadow-sm"
                          : "bg-blue-100 border border-blue-200 shadow-sm"
                      )
                  }`}
                >
                  {/* Message pointer */}
                  <div 
                    className={`absolute top-2 ${
                      msg.sender === user.email 
                        ? "right-0 transform translate-x-1/2 rotate-45" +
                          (darkMode
                            ? " bg-blue-700"
                            : " bg-blue-400") 
                        : "left-0 transform -translate-x-1/2 rotate-45" +
                          (darkMode
                            ? " bg-gray-600"
                            : " bg-blue-200")
                    } h-3 w-3 border-t border-r ${
                      msg.sender === user.email
                        ? darkMode
                          ? "border-blue-700"
                          : "border-blue-400"
                        : darkMode
                          ? "border-gray-600"
                          : "border-blue-200"
                    }`}
                  ></div>
                  <div className="flex flex-col">
                    <div className="break-words">{msg.content}</div>
                    <span className="text-xs opacity-70 mt-1 text-right">
                      {new Date(parseInt(msg.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}              <div ref={messagesEndRef} />
            </div>
            )}
          </div>        {/* Message input - fixed at bottom */}
          <div
            className={`flex items-center border-t p-4 ${
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
                onKeyDown={handleKeyDown}                className={`w-full px-4 py-3 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
                    : "bg-white border border-gray-300 text-gray-800 focus:ring-blue-500"
                } ${!selectedStudent ? "opacity-60" : ""}`}
                disabled={!selectedStudent}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!selectedStudent}
              className={`px-5 py-3 rounded-lg transition-all duration-200 flex items-center ${
                !selectedStudent 
                  ? "bg-gray-500 text-white opacity-50 cursor-not-allowed" 
                  : darkMode
                  ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transform hover:-translate-y-0.5"
                  : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg transform hover:-translate-y-0.5"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              Send
            </button>
          </div>        </div>      </div>
        {/* Removed floating action button for mobile */}
    </div>
  );
};

export default Chat;