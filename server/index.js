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
  
  // Map to store user connections (userId -> Set of WebSocket connections)
  const userConnections = new Map();
  
  // Helper function to register a connection
  const registerConnection = (userId, ws) => {
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(ws);
    console.log(`User ${userId} has ${userConnections.get(userId).size} active connections`);
  };
  
  // Helper function to unregister a connection
  const unregisterConnection = (userId, ws) => {
    if (userConnections.has(userId)) {
      userConnections.get(userId).delete(ws);
      if (userConnections.get(userId).size === 0) {
        userConnections.delete(userId);
      }
      console.log(`User ${userId} disconnected. Connections left: ${userConnections.has(userId) ? userConnections.get(userId).size : 0}`);
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
            ws.userId = userId;
            ws.userEmail = data.userEmail;
            // Register this connection for the user
            registerConnection(userId, ws);
            console.log(`User identified as: ${userId} (${data.userEmail})`);
            break;          case "message":
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
                };
                  // Send to all sender's connections
                if (userConnections.has(data.senderUsername)) {
                  userConnections.get(data.senderUsername).forEach(conn => {
                    if (conn.readyState === WebSocket.OPEN) {
                      conn.send(JSON.stringify(tempMessageObj));
                    }
                  });
                }
                  // Send to all receiver's connections
                if (userConnections.has(data.receiverUsername)) {
                  userConnections.get(data.receiverUsername).forEach(conn => {
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
                
                const savedMessage = await newMessage.save();
                  // Create persistent message object
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
                };
                  // Update all sender's connections with the official ID and timestamp
                if (userConnections.has(data.senderUsername)) {
                  userConnections.get(data.senderUsername).forEach(conn => {
                    if (conn.readyState === WebSocket.OPEN) {
                      conn.send(JSON.stringify(persistentMessageObj));
                    }
                  });
                }
                  // Update all receiver's connections with the official ID and timestamp
                if (userConnections.has(data.receiverUsername)) {
                  userConnections.get(data.receiverUsername).forEach(conn => {
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
            if (userConnections.has(data.receiverUsername)) {
              const typingData = JSON.stringify({
                type: "typing",
                senderUsername: data.senderUsername,
                senderEmail: data.senderEmail,
                receiverUsername: data.receiverUsername,
                receiverEmail: data.receiverEmail,
                isTyping: data.isTyping
              });
              
              userConnections.get(data.receiverUsername).forEach(conn => {
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
      if (userId) {
        unregisterConnection(userId, ws);
      }
      console.log("Client disconnected from WebSocket");
    });
    
    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket connection error:", error);
      if (userId) {
        unregisterConnection(userId, ws);
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