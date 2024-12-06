const mongoose = require("mongoose");
const recipe = new mongoose.Schema({
  title: String,
  publish: Date,
  description: String,
  photo: {
    data: Buffer,
    contentType: String,
  },
});
const recipeSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String,
  },
  recipes: [recipe],
});

module.exports = mongoose.model("Recipe", recipeSchema);
