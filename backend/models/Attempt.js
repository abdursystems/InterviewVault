const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    status: {
      type: String,
      enum: ["Solved", "Attempted", "Skipped"],
      required: true,
    },
    submittedCodeOrText: { type: String },
    timeTakenSeconds: { type: Number },
  },
  { timestamps: true },
); // createdAt serves as the attempt timestamp

// Optimize fetching recent history and latest status
attemptSchema.index({ userID: 1, createdAt: -1 });
attemptSchema.index({ userID: 1, questionID: 1, createdAt: -1 });

module.exports = mongoose.model("Attempt", attemptSchema);
