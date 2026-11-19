const mongoose = require("mongoose");

const recoveryPlanItemSchema = new mongoose.Schema(
  {
    questionID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    role: {
      type: String,
      enum: ["Focus", "Retry", "Review", "Stretch"],
      required: true,
    },
    reason: { type: String, required: true },
    state: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  },
  { _id: false },
); // No separate ID needed for embedded items

const recoveryPlanSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true }, // Calendar date (e.g., YYYY-MM-DD)
    mode: {
      type: String,
      enum: ["RootCause", "GeneralPractice", "Onboarding"],
      required: true,
    },
    diagnosedSubtopicID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subtopic",
    },
    items: [recoveryPlanItemSchema],
  },
  { timestamps: true },
);

// Maintain one daily recovery plan per user
recoveryPlanSchema.index({ userID: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("RecoveryPlan", recoveryPlanSchema);
