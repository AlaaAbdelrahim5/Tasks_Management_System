const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const typeDefs = require("./schema/typeDefs");
const resolvers = require("./schema/resolvers");

const startServer = async () => {
  const app = express();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  mongoose
    .connect("mongodb+srv://abdullah:123@adweb.ms9wqqy.mongodb.net/?retryWrites=true&w=majority&appName=adweb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

  app.listen(4000, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
