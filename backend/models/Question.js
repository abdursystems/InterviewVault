const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    statement: { type: String, required: true },
    topicID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    subtopicIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtopic" }],
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    type: { type: String, enum: ["Theory", "Coding"], required: true },
    modelAnswer: { type: String },
    testCases: [
      {
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
      },
    ],
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Support question filtering by topic, difficulty, type, and subtopic
questionSchema.index({ topicID: 1, difficulty: 1, type: 1 });
questionSchema.index({ subtopicIDs: 1 });

module.exports = mongoose.model("Question", questionSchema);
