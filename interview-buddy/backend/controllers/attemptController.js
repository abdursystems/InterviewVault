const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");
const UserSubtopicStats = require("../models/UserSubtopicStats");
const { runPythonCode } = require("../utils/sandbox");

const submitAttempt = async (req, res) => {
  const {
    userID,
    questionID,
    submittedCodeOrText,
    timeTakenSeconds,
    type,
    status: clientStatus,
  } = req.body;

  // 1. Evaluate Code if it's a coding question
  let finalStatus = clientStatus;
  let testDetails = null;

  const question = await Question.findById(questionID);
  if (!question) return res.status(404).json({ error: "Question not found" });

  if (type === "Coding" && clientStatus !== "Skipped") {
    try {
      const runnerResult = await runPythonCode(
        submittedCodeOrText,
        question.testCases,
      );
      finalStatus = runnerResult.success ? "Solved" : "Attempted";
      testDetails = runnerResult.details;
    } catch (error) {
      // ADD THIS CONSOLE.LOG:
      console.error("Sandbox Error:", error);
      return res
        .status(400)
        .json({ error: "Code execution failed or timed out." });
    }
  }

  // 2. Start the Atomic Database Transaction (Requirement S-3)
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check user's PREVIOUS latest status on this question to prevent double-counting
    const previousAttempt = await Attempt.findOne({ userID, questionID })
      .sort({ createdAt: -1 })
      .session(session);
    const previousStatus = previousAttempt ? previousAttempt.status : null;

    // Insert new Attempt record
    const newAttempt = await Attempt.create(
      [
        {
          userID,
          questionID,
          status: finalStatus,
          submittedCodeOrText,
          timeTakenSeconds,
        },
      ],
      { session },
    );

    // Update Subtopic Statistics Atomically
    for (const subtopicID of question.subtopicIDs) {
      // Determine increment/decrement logic
      const incFields = {};
      if (previousStatus !== finalStatus) {
        incFields[finalStatus.toLowerCase()] = 1; // e.g., solved: 1
        if (previousStatus) {
          incFields[previousStatus.toLowerCase()] = -1; // e.g., attempted: -1
        }
      }

      await UserSubtopicStats.updateOne(
        { userID, subtopicID },
        {
          $inc: incFields,
          $set: { lastPracticed: new Date() },
        },
        { upsert: true, session },
      );
    }

    // Commit transaction
    await session.commitTransaction();
    res
      .status(201)
      .json({ message: "Attempt recorded", status: finalStatus, testDetails });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ error: "Transaction failed", details: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { submitAttempt };
