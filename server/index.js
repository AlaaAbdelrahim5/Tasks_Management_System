const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require("http");
const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const mongoose = require("mongoose");
const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");

const startServer = async () => {
  // Create Express app
  const app = express();
  
  // Allow CORS
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    next();
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create schema from typeDefs and resolvers
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  
  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return {
          async drainServer() {
            subscriptionServer.close();
          },
        };
      },
    }],
  });
    // Create subscription server
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: (connectionParams, webSocket, context) => {
        console.log('🔌 Client connected to WebSocket');
        return { connectionParams };
      },
      onDisconnect: (webSocket, context) => {
        console.log('🔌 Client disconnected from WebSocket');
      },
      onOperation: (message, params, webSocket) => {
        console.log(`🔄 WebSocket operation: ${message.type}`, 
          message.type === 'start' ? message.payload.query.substring(0, 50) + '...' : '');
        return params;
      }
    },
    {
      server: httpServer,
      path: '/graphql',
    }
  );
  
  // Start Apollo Server
  await server.start();
  server.applyMiddleware({ app });

  // Connect to MongoDB
  mongoose
    .connect("mongodb+srv://abdullah:123@adweb.ms9wqqy.mongodb.net/?retryWrites=true&w=majority&appName=adweb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

  // Start the HTTP server that accepts both HTTP and WebSocket connections
  httpServer.listen(4000, () => {
    console.log(`🚀 HTTP Server ready at http://localhost:4000${server.graphqlPath}`);
    console.log(`🚀 WebSocket Server ready at ws://localhost:4000${server.graphqlPath}`);
  });
};

startServer();
