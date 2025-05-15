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

  // Helper function to create a unique identifier from email
  const createUserIdentifier = (email) => email;

  // Helper function to register a connection
  const registerConnection = (email, ws) => {
    const id = createUserIdentifier(email);
    if (!userConnections.has(id)) userConnections.set(id, new Set());
    userConnections.get(id).add(ws);
  };

  // Helper function to unregister a connection
  const unregisterConnection = (email, ws) => {
    const id = createUserIdentifier(email);
    if (userConnections.has(id)) {
      const conns = userConnections.get(id);
      conns.delete(ws);
      if (conns.size === 0) userConnections.delete(id);
    }
  };

  // WebSocket connection handler
  wss.on("connection", (ws) => {
    ws.on("message", async (msg) => {
      const data = JSON.parse(msg);
      switch (data.type) {
        case "identify":
          ws.userEmail = data.userEmail;
          registerConnection(data.userEmail, ws);
          break;

        case "message":
          if (data.senderEmail && data.receiverEmail && data.content) {
            const saved = await new Message({
              senderEmail: data.senderEmail,
              receiverEmail: data.receiverEmail,
              content: data.content,
            }).save();
            const out = {
              type: "message",
              message: {
                id: saved._id,
                senderEmail: saved.senderEmail,
                receiverEmail: saved.receiverEmail,
                content: saved.content,
                timestamp: saved.timestamp.toISOString(),
              },
            };
            const ids = [
              createUserIdentifier(saved.senderEmail),
              createUserIdentifier(saved.receiverEmail),
            ];
            ids.forEach((id) => {
              const set = userConnections.get(id);
              if (set)
                set.forEach(
                  (c) =>
                    c.readyState === WebSocket.OPEN &&
                    c.send(JSON.stringify(out))
                );
            });
          }
          break;

        case "typing":
          if (data.senderEmail && data.receiverEmail) {
            const out = {
              type: "typing",
              senderEmail: data.senderEmail,
              receiverEmail: data.receiverEmail,
              isTyping: data.isTyping,
            };
            const set = userConnections.get(
              createUserIdentifier(data.receiverEmail)
            );
            if (set)
              set.forEach(
                (c) =>
                  c.readyState === WebSocket.OPEN && c.send(JSON.stringify(out))
              );
          }
          break;
      }
    });

    ws.on("close", () => {
      if (ws.userEmail) unregisterConnection(ws.userEmail, ws);
    });

    ws.on("error", () => {
      if (ws.userEmail) unregisterConnection(ws.userEmail, ws);
    });
  });

  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  mongoose
    .connect(
      "mongodb+srv://abdullah:123@adweb.ms9wqqy.mongodb.net/?retryWrites=true&w=majority&appName=adweb",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

  httpServer.listen(4000, () => {
    console.log(
      `🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`
    );
    console.log(`🔌 WebSocket server running at ws://localhost:4000`);
  });
};

startServer();
