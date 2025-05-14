const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");
const { PubSub } = require("graphql-subscriptions");

// Create a new PubSub instance
const pubsub = new PubSub();
const MESSAGE_RECEIVED = 'MESSAGE_RECEIVED';

module.exports = {
  Query: {
    getProjects: async () => await Project.find(),
    getStudents: async () => await User.find({ isStudent: true }),
    getAllUsers: async () => await User.find(),
    getTasks: async () => await Task.find(),
    getStudentTasks: async (_, { username }) => {
      return await Task.find({ assignedStudent: username });
    },    getMessages: async (_, { sender, receiver }) => {
      // Updated to use email addresses for sender and receiver
      return await Message.find({
        $or: [
          { sender, receiver },
          { sender: receiver, receiver: sender },
        ],
      }).sort({ timestamp: 1 });
    },
    getLatestMessageCount: async (_, { sender, receiver }) => {
      // This query counts unread messages from a specific sender (email) to the receiver (email)
      // In a real app, you might use a "read" flag, but for simplicity
      // we're just counting all messages from the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const count = await Message.countDocuments({
        sender,
        receiver,
        timestamp: { $gte: thirtyMinutesAgo }
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
      const updatedTask = await Task.findOneAndUpdate({ id: Number(id) }, taskInput, {
        new: true,
      });
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
    },    sendMessage: async (_, { sender, receiver, content }) => {
      // Create and save the message - now using email addresses
      const message = new Message({ sender, receiver, content });
      const savedMessage = await message.save();
      
      // Convert MongoDB document to plain object for publishing
      const messageObject = {
        id: savedMessage._id.toString(),
        sender: savedMessage.sender,
        receiver: savedMessage.receiver,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp.toString()
      };
      
      console.log(`Publishing message: ${sender} -> ${receiver}: ${content.substring(0, 20)}...`);
      
      // Only publish once with a single payload that contains both email addresses
      // This allows our subscription resolver to filter appropriately
      pubsub.publish(MESSAGE_RECEIVED, {
        messageReceived: messageObject,
        senderEmail: sender,
        receiverEmail: receiver
      });
      
      return savedMessage;
    },},
    Subscription: {    messageReceived: {
      subscribe: (_, { receiver }, context) => {
        console.log(`New subscription for email: ${receiver}`);
        return pubsub.asyncIterator([MESSAGE_RECEIVED]);
      },
      resolve: (payload, variables, context) => {
        const subscriberEmail = variables.receiver;
        const msgSender = payload.messageReceived.sender;
        const msgReceiver = payload.messageReceived.receiver;
        
        console.log(`Filtering message - Subscriber: ${subscriberEmail}, Message: ${msgSender} -> ${msgReceiver}`);
        
        // A user should receive a message if they are either the sender or receiver (by email)
        if (subscriberEmail === msgSender || subscriberEmail === msgReceiver) {
          console.log(`✅ Delivering message to ${subscriberEmail}`);
          return payload.messageReceived;
        }
        
        console.log(`❌ Message filtered out for ${subscriberEmail}`);
        return null;
      }
    },
  },
};
