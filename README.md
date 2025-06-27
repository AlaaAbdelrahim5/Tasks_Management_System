# Tasks Management System

[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white)](https://graphql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern Single Page Application (SPA) for task management, featuring a React frontend, Node.js backend, and GraphQL API.

## Table of Contents
- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
  - [GraphQL API](#graphql-api)
  - [Chat System](#chat-system)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Features](#features)
- [Project Phases](#project-phases)

## Project Overview

This Tasks Management System is a comprehensive application that allows users to manage projects and tasks efficiently. It includes features like real-time chat, task assignment, project tracking, and detailed analytics.

## Project Structure

### Frontend (client)
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── AddTaskForm.jsx
│   │   ├── DashboardChart.jsx
│   │   ├── Header.jsx
│   │   ├── ProjectCard.jsx
│   │   ├── ProjectSidebar.jsx
│   │   ├── Sidebar.jsx
│   │   └── TaskForm.jsx
│   ├── pages/          # Main application views
│   │   ├── Chat.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Projects.jsx
│   │   ├── SignUp.jsx
│   │   └── Tasks.jsx
│   ├── assets/         # Static assets
│   ├── App.jsx         # Main application component
│   ├── main.jsx        # Application entry point
│   └── styles.css      # Global styles
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

### Backend (server)
```
server/
├── models/             # Database models
│   ├── Counter.js      # For auto-incrementing IDs
│   ├── Message.js      # Chat message schema
│   ├── Project.js      # Project schema
│   ├── Task.js         # Task schema
│   └── User.js         # User schema
├── schema/             # GraphQL schema
│   ├── resolvers.js    # Query/mutation implementations
│   └── typeDefs.js     # GraphQL type definitions
├── index.js            # Server entry point
└── package.json        # Dependencies and scripts
```

## Technology Stack

### Frontend
- **React**: JavaScript library for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vite**: Next-generation frontend tooling for React
- **Apollo Client**: State management library for GraphQL

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for Node.js
- **Apollo Server**: GraphQL server for Node.js

### Database
The application uses **MongoDB** as the primary database:
- Document-based storage ideal for flexible, JSON-like data structures
- Schema-less design allowing for agile development
- Efficient querying for complex task management operations
- Scalable architecture for growing data needs

### GraphQL API
The GraphQL implementation provides a robust interface between frontend and backend:
- **Schema Definition**: Defines types, queries, mutations, and subscriptions
- **Resolvers**: Implements the logic for data operations
- **Benefits**:
  - Single endpoint for all data operations
  - Client-specified data retrieval to minimize over-fetching
  - Strong typing for data validation
  - Real-time data with subscriptions

### Chat System
The application includes a real-time chat feature implemented via:
- **GraphQL Subscriptions**: For real-time message updates
- **Message Persistence**: All messages stored in MongoDB
- **User-to-User Communication**: Direct messaging
- **Project-Based Channels**: Team communication within projects

## Getting Started

### Prerequisites
- Node.js (v14.0.0 or higher)
- MongoDB (local installation or cloud instance)
- npm (v6.0.0 or higher)

### Backend Setup
1. Navigate to the server directory:
   ```powershell
   cd server
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the server:
   ```powershell
   node index.js

Note: Be sure to update the MongoDB connection URL in `index.js` with your own database URI.

The GraphQL playground will be available at http://localhost:4000/graphql

### Frontend Setup
1. Navigate to the client directory:
   ```powershell
   cd client
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```
   The application will be available at http://localhost:5173

## Features
- **User Authentication & Authorization**: Secure login and role-based access
- **Project Management**: Create, update, and delete projects
- **Task Tracking**: Assign, prioritize, and track tasks
- **Real-time Chat**: Communicate with team members
- **Dashboard Analytics**: Visual representation of project progress
- **Responsive Design**: Works on desktop and mobile devices

## Project Phases

### Frontend Phase: React + Tailwind CSS
- Refactor the front-end code to use React for building the user interface
- Integrate Tailwind CSS for styling to enhance the visual appeal and responsiveness
- Implement state management to handle project data dynamically
- Create reusable components for projects cards, modals, forms, etc.
- Ensure full functionality with the new React architecture

### Backend Phase: Node.js Backend and Integration
- Develop a Node.js backend to handle data storage and retrieval
- Set up GraphQL to manage project data
- Integrate the front-end with the backend to fetch and display real data
- Implement user authentication and authorization
- Ensure proper error handling and validation for all API endpoints
- Conduct comprehensive testing across the full stack
