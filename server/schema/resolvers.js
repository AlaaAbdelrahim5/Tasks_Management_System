const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");

module.exports = {
  Query: {
    getProjects: async () => await Project.find(),
    getStudents: async () => await User.find({ isStudent: true }),
    getAllUsers: async () => await User.find(),
    getTasks: async () => await Task.find(),
    getStudentTasks: async (_, { username }) => {
      return await Task.find({ assignedStudent: username });
    },
    getMessages: async (
      _,
      { senderUsername, senderEmail, receiverUsername, receiverEmail }
    ) => {
      const messages = await Message.find({
        $or: [
          { senderUsername, senderEmail, receiverUsername, receiverEmail },
          {
            senderUsername: receiverUsername,
            senderEmail: receiverEmail,
            receiverUsername: senderUsername,
            receiverEmail: senderEmail,
          },
        ],
      }).sort({ timestamp: 1 });

      // Format timestamps as ISO strings
      return messages.map((msg) => ({
        id: msg._id,
        senderUsername: msg.senderUsername,
        senderEmail: msg.senderEmail,
        receiverUsername: msg.receiverUsername,
        receiverEmail: msg.receiverEmail,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }));
    },
    getLatestMessageCount: async (
      _,
      { senderUsername, senderEmail, receiverUsername, receiverEmail }
    ) => {
      // Count all messages between the two users
      const count = await Message.countDocuments({
        $or: [
          { senderUsername, senderEmail, receiverUsername, receiverEmail },
          {
            senderUsername: receiverUsername,
            senderEmail: receiverEmail,
            receiverUsername: senderUsername,
            receiverEmail: senderEmail,
          },
        ],
      });
      return count;
    },
  },

  Mutation: {
    addTask: async (_, { taskInput }) => {
      const task = new Task(taskInput);
      return await task.save();
    },

    updateTask: async (_, { id, taskInput }) => {
      const updatedTask = await Task.findOneAndUpdate(
        { id: Number(id) },
        taskInput,
        {
          new: true,
        }
      );
      if (!updatedTask) throw new Error("Task not found");
      return updatedTask;
    },

    deleteTask: async (_, { id }) => {
      const deletedTask = await Task.findOneAndDelete({ id: Number(id) });
      if (!deletedTask) throw new Error("Task not found");
      return deletedTask;
    },

    updateTaskStatus: async (_, { id, status }) => {
      const updatedTask = await Task.findOneAndUpdate(
        { id: Number(id) },
        { status },
        { new: true }
      );
      if (!updatedTask) throw new Error("Task not found");
      return updatedTask;
    },

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

    addProject: async (_, { projectInput }) => {
      const existing = await Project.findOne({ title: projectInput.title });
      if (existing) {
        throw new Error("Project title already exists");
      }

      const project = new Project(projectInput);
      return await project.save();
    },

    deleteProject: async (_, { id }) => {
      const project = await Project.findOne({ id: Number(id) });
      if (!project) throw new Error("Project not found");

      await Task.deleteMany({ project: project.title });
      await Project.findOneAndDelete({ id: Number(id) });

      return "Project and related tasks deleted.";
    },
    sendMessage: async (
      _,
      { senderUsername, senderEmail, receiverUsername, receiverEmail, content }
    ) => {
      const message = new Message({
        senderUsername,
        senderEmail,
        receiverUsername,
        receiverEmail,
        content,
      });
      return await message.save();
    },
  },
};
