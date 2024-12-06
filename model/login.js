const mongoose = require("mongoose");
const dataSchema = new mongoose.Schema({
  firstname: {
    required: true,
    type: String,
  },
  lastname: {
    required: true,
    type: String,
  },
  username: {
    required: true,
    type: String,
  },
  hashedpassword: {
    required: true,
    type: String,
  },
  salt: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("Login", dataSchema);
