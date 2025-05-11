const mongoose = require("mongoose");
const Counter = require("./Counter");

const taskSchema = new mongoose.Schema({
  id: Number,
  project: String,
  name: String,
  description: String,
  assignedStudent: String,
  status: String,
  dueDate: String,
});

taskSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "taskId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.id = counter.seq;
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
