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
                onClick={() => setSelectedStudent(user)}                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                  selectedStudent && selectedStudent.email === user.email ? 
                    (darkMode ? "bg-blue-900/40 border-l-4 border-blue-500" : "bg-blue-50 border-l-4 border-blue-500") : 
                    (darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-100")
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
                <div className="flex items-center">                  <div className={`w-8 h-8 mr-2 rounded-full flex items-center justify-center ${
                    darkMode ? "bg-blue-600" : "bg-blue-500"
                  } text-white`}>
                    {selectedStudent.username.charAt(0).toUpperCase()}
                  </div>
                  <span>Chatting with {selectedStudent.username}</span>
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
                  key={msg.id}                  className={`p-3 rounded-lg max-w-xs ${
                    msg.sender === user.email
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