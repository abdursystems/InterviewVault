const mongoose = require("mongoose");

const subtopicSchema = new mongoose.Schema(
  {
    topicID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    name: { type: String, required: true }, // e.g., "Recursion", "Joins"
  },
  { timestamps: true },
);

// Prevent duplicate names within a single topic
subtopicSchema.index({ topicID: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Subtopic", subtopicSchema);
