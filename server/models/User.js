const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  isStudent: { type: Boolean, default: false },
  universityId: { type: String, default: null },
});

module.exports = mongoose.model("User", userSchema);
