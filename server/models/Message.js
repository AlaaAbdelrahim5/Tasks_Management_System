const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderUsername: String,
  senderEmail: String,
  receiverUsername: String,
  receiverEmail: String,
  content: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);
