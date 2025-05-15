const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const http = require("http");
const WebSocket = require("ws"); // Import WebSocket for constants
const { WebSocketServer } = WebSocket;
const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");
const Message = require("./models/Message");

const startServer = async () => {
  const app = express();

  // Allow CORS
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

  const httpServer = http.createServer(app);
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer });
    // Map to store user connections (userIdentifier -> Set of WebSocket connections)
  const userConnections = new Map();
  
  // Helper function to create a unique identifier from username and email
  const createUserIdentifier = (username, email) => {
    return `${username}|${email}`;
  };
  
  // Helper function to register a connection
  const registerConnection = (userId, userEmail, ws) => {
    const userIdentifier = createUserIdentifier(userId, userEmail);
    if (!userConnections.has(userIdentifier)) {
      userConnections.set(userIdentifier, new Set());
    }
    userConnections.get(userIdentifier).add(ws);
    console.log(`User ${userId} (${userEmail}) has ${userConnections.get(userIdentifier).size} active connections`);
  };
  
  // Helper function to unregister a connection
  const unregisterConnection = (userId, userEmail, ws) => {
    const userIdentifier = createUserIdentifier(userId, userEmail);
    if (userConnections.has(userIdentifier)) {
      userConnections.get(userIdentifier).delete(ws);
      if (userConnections.get(userIdentifier).size === 0) {
        userConnections.delete(userIdentifier);
      }
      console.log(`User ${userId} (${userEmail}) disconnected. Connections left: ${userConnections.has(userIdentifier) ? userConnections.get(userIdentifier).size : 0}`);
    }
  };

  // WebSocket connection handler
  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");

    // Keep track of user identity
    let userId = null;

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        console.log("Received WebSocket message:", data);

        switch (data.type) {          case "identify":
            // Store the user identifier
            userId = data.userId;
            userEmail = data.userEmail;
            ws.userId = userId;
            ws.userEmail = userEmail;
            // Register this connection for the user
            registerConnection(userId, userEmail, ws);
            console.log(`User identified as: ${userId} (${userEmail})`);
            break;case "message":
            // Save message to database
            if (data.senderUsername && data.senderEmail && data.receiverUsername && data.receiverEmail && data.content) {
              try {
                // First, immediately broadcast to reduce perceived latency
                const tempMessageId = `temp-${Date.now()}`;
                const tempTimestamp = Date.now().toString();
                  // Create temporary message object
                const tempMessageObj = {
                  type: "message",
                  message: {
                    id: tempMessageId,
                    senderUsername: data.senderUsername,
                    senderEmail: data.senderEmail,
                    receiverUsername: data.receiverUsername,
                    receiverEmail: data.receiverEmail,
                    content: data.content,
                    timestamp: tempTimestamp
                  }
                };                  // Send to all sender's connections
                const senderIdentifier = createUserIdentifier(data.senderUsername, data.senderEmail);
                if (userConnections.has(senderIdentifier)) {
                  userConnections.get(senderIdentifier).forEach(conn => {
                    if (conn.readyState === WebSocket.OPEN) {
                      conn.send(JSON.stringify(tempMessageObj));
                    }
                  });
                }
                  // Send to all receiver's connections
                const receiverIdentifier = createUserIdentifier(data.receiverUsername, data.receiverEmail);
                if (userConnections.has(receiverIdentifier)) {
                  userConnections.get(receiverIdentifier).forEach(conn => {
                    if (conn.readyState === WebSocket.OPEN) {
                      conn.send(JSON.stringify(tempMessageObj));
                    }
                  });
                }
                  // Then save to database for persistence
                const newMessage = new Message({
                  senderUsername: data.senderUsername,
                  senderEmail: data.senderEmail,
                  receiverUsername: data.receiverUsername,
                  receiverEmail: data.receiverEmail,
                  content: data.content
                });
                
                const savedMessage = await newMessage.save();                // Create persistent message object
                const persistentMessageObj = {
                  type: "message",
                  message: {
                    id: savedMessage._id,
                    senderUsername: savedMessage.senderUsername,
                    senderEmail: savedMessage.senderEmail,
                    receiverUsername: savedMessage.receiverUsername,
                    receiverEmail: savedMessage.receiverEmail,
                    content: savedMessage.content,
                    timestamp: savedMessage.timestamp
                  }
                };                  // Update all sender's connections with the official ID and timestamp
                // Reuse the existing senderIdentifier variable
                if (userConnections.has(senderIdentifier)) {
                  userConnections.get(senderIdentifier).forEach(conn => {
                    if (conn.readyState === WebSocket.OPEN) {
                      conn.send(JSON.stringify(persistentMessageObj));
                    }
                  });                }
                  // Update all receiver's connections with the official ID and timestamp
                // Reuse the existing receiverIdentifier variable
                if (userConnections.has(receiverIdentifier)) {
                  userConnections.get(receiverIdentifier).forEach(conn => {
                    if (conn.readyState === WebSocket.OPEN) {
                      conn.send(JSON.stringify(persistentMessageObj));
                    }
                  });
                }
                
                console.log(`Message sent from ${data.senderUsername} (${data.senderEmail}) to ${data.receiverUsername} (${data.receiverEmail}): "${data.content}"`);
              } catch (error) {
                console.error("Error handling message:", error);
              }
            }
            break;          case "typing":
            // Forward typing status to all recipient's connections
            const receiverIdentifier = createUserIdentifier(data.receiverUsername, data.receiverEmail);
            if (userConnections.has(receiverIdentifier)) {
              const typingData = JSON.stringify({
                type: "typing",
                senderUsername: data.senderUsername,
                senderEmail: data.senderEmail,
                receiverUsername: data.receiverUsername,
                receiverEmail: data.receiverEmail,
                isTyping: data.isTyping
              });
              
              userConnections.get(receiverIdentifier).forEach(conn => {
                if (conn.readyState === WebSocket.OPEN) {
                  conn.send(typingData);
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });    ws.on("close", () => {
      if (userId && ws.userEmail) {
        unregisterConnection(userId, ws.userEmail, ws);
      }
      console.log("Client disconnected from WebSocket");
    });
      // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket connection error:", error);
      if (userId && ws.userEmail) {
        unregisterConnection(userId, ws.userEmail, ws);
      }
    });
  });

  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  mongoose
    .connect("mongodb+srv://abdullah:123@adweb.ms9wqqy.mongodb.net/?retryWrites=true&w=majority&appName=adweb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

  httpServer.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`);
    console.log(`🔌 WebSocket server running at ws://localhost:4000`);
  });
};

startServer();