const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  students: [String],
  category: String,
  startDate: String,
  endDate: String,
  status: String,
});

module.exports = mongoose.model("Project", projectSchema);
