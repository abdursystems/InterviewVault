const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "DSA", "OOP", "DBMS", "OS"
  },
  { timestamps: true },
);

module.exports = mongoose.model("Topic", topicSchema);
