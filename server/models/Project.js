const mongoose = require("mongoose");
const Counter = require("./Counter");

const projectSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  students: [String],
  category: String,
  startDate: String,
  endDate: String,
  status: String,
});

projectSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "projectId" },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    this.id = counter.seq;
  }
  next();
});

module.exports = mongoose.model("Project", projectSchema);
