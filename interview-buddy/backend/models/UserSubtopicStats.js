const mongoose = require("mongoose");

const userSubtopicStatsSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subtopicID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtopic",
      required: true,
    },
    solved: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    lastPracticed: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Maintain one statistics document per user-subtopic pair
userSubtopicStatsSchema.index({ userID: 1, subtopicID: 1 }, { unique: true });

module.exports = mongoose.model("UserSubtopicStats", userSubtopicStatsSchema);
