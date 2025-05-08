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
    id: ID!
    title: String!
    description: String!
    students: [String]
    category: String!
    startDate: String!
    endDate: String!
    status: String!
  }

  type Task {
    id: ID!
    taskId: String!
    project: String!
    name: String!
    description: String!
    assignedStudent: String! # updated to single student as per frontend
    status: String!
    dueDate: String!
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
    taskId: String!
    project: String!
    name: String!
    description: String!
    assignedStudent: String! # updated to single student input
    status: String!
    dueDate: String!
  }

  type Query {
    getProjects: [Project]
    getStudents: [User]
    getTasks: [Task]
    getStudentTasks(username: String!): [Task]
  }

  type Mutation {
    signUp(userInput: SignUpInput): User
    login(email: String!, password: String!): User
    addProject(projectInput: ProjectInput): Project
    addTask(taskInput: TaskInput): Task
    updateTask(id: ID!, taskInput: TaskInput!): Task
  deleteTask(id: ID!): Task
      updateTaskStatus(id: ID!, status: String!): Task

  }
`;