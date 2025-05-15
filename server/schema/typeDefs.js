const { gql } = require("apollo-server-express");

module.exports = gql`
  type User {
    id: ID!
    email: String!
    username: String!
    isStudent: Boolean!
    universityId: String
  }

  type Project {
    id: Int!
    title: String!
    description: String!
    students: [String]
    category: String!
    startDate: String!
    endDate: String!
    status: String!
  }

  type Task {
    id: Int!
    project: String!
    name: String!
    description: String!
    assignedStudent: String!
    status: String!
    dueDate: String!
  }
  
  type Message {
    id: ID!
    senderUsername: String!
    senderEmail: String!
    receiverUsername: String!
    receiverEmail: String!
    content: String!
    timestamp: String!
  }

  input SignUpInput {
    email: String!
    username: String!
    password: String!
    isStudent: Boolean!
    universityId: String
  }

  input ProjectInput {
    title: String!
    description: String!
    students: [String]
    category: String!
    startDate: String!
    endDate: String!
    status: String!
  }

  input TaskInput {
    project: String!
    name: String!
    description: String!
    assignedStudent: String!
    status: String!
    dueDate: String!
  }
  type Query {
    getProjects: [Project]
    getStudents: [User]
    getAllUsers: [User]
    getTasks: [Task]
    getStudentTasks(username: String!): [Task]
    getMessages(senderUsername: String!, senderEmail: String!, receiverUsername: String!, receiverEmail: String!): [Message]
    getLatestMessageCount(senderUsername: String!, senderEmail: String!, receiverUsername: String!, receiverEmail: String!): Int
  }

  type Mutation {
    signUp(userInput: SignUpInput): User
    login(email: String!, password: String!): User
    addProject(projectInput: ProjectInput): Project
    addTask(taskInput: TaskInput): Task
    updateTask(id: ID!, taskInput: TaskInput!): Task
    deleteTask(id: ID!): Task
    updateTaskStatus(id: ID!, status: String!): Task
    deleteProject(id: ID!): String
    sendMessage(senderUsername: String!, senderEmail: String!, receiverUsername: String!, receiverEmail: String!, content: String!): Message
  }

  type Subscription {
    messageReceived(receiverUsername: String!, receiverEmail: String!): Message
  }
`;
