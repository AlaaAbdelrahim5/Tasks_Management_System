const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");

module.exports = {
  Query: {
    getProjects: async () => await Project.find(),
    getStudents: async () => await User.find({ isStudent: true }),
    getTasks: async () => await Task.find(),
    getStudentTasks: async (_, { username }) => {
      return await Task.find({ assignedStudent: username });
    },
  },

  Mutation: {
    // ✅ Add new Task
    addTask: async (_, { taskInput }) => {
      const task = new Task(taskInput);
      return await task.save();
    },

    // ✅ Update existing Task
    updateTask: async (_, { id, taskInput }) => {
      const updatedTask = await Task.findByIdAndUpdate(id, taskInput, { new: true });
      if (!updatedTask) throw new Error("Task not found");
      return updatedTask;
    },

    // ✅ Delete Task
    deleteTask: async (_, { id }) => {
      const deletedTask = await Task.findByIdAndDelete(id);
      if (!deletedTask) throw new Error("Task not found");
      return deletedTask;
    },

    // ✅ Update only the status field
    updateTaskStatus: async (_, { id, status }) => {
      const updatedTask = await Task.findByIdAndUpdate(id, { status }, { new: true });
      if (!updatedTask) throw new Error("Task not found");
      return updatedTask;
    },

    // ✅ User Sign Up
    signUp: async (_, { userInput }) => {
      const { email, username, password, isStudent, universityId } = userInput;
      const existingUser = await User.findOne({ email });
      if (existingUser) throw new Error("Email already registered");

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        email,
        username,
        password: hashedPassword,
        isStudent,
        universityId: isStudent ? universityId : null,
      });

      const savedUser = await newUser.save();
      return {
        id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        isStudent: savedUser.isStudent,
        universityId: savedUser.universityId,
      };
    },

    // ✅ User Login
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error("User not found");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error("Invalid password");

      return {
        id: user._id,
        email: user.email,
        username: user.username,
        isStudent: user.isStudent,
        universityId: user.universityId,
      };
    },

    // ✅ Add new Project
    addProject: async (_, { projectInput }) => {
      const project = new Project(projectInput);
      return await project.save();
    },
  },
};
