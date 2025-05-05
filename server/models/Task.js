const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  taskId: String,
  project: String,
  name: String,
  description: String,
  assignedStudent: String, // only 1 student
  status: String,
  dueDate: String,
});

module.exports = mongoose.model("Task", taskSchema);