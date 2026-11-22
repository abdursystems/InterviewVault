const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");
const UserSubtopicStats = require("../models/UserSubtopicStats");
const RecoveryPlan = require("../models/RecoveryPlan");
const { runPythonCode } = require("../utils/sandbox");

const sendServerError = (res, message, error) => {
  const payload = { error: message };
  if (process.env.NODE_ENV !== "production") {
    payload.details = error.message;
  }
  return res.status(500).json(payload);
};

const submitAttempt = async (req, res) => {
  try {
    // SEC-3: Always derive user identity from the verified JWT attached by protect
    const userID = req.user?._id || req.user?.id;
    const {
      questionID,
      submittedCodeOrText,
      timeTakenSeconds,
      status: clientStatus,
    } = req.body || {};

    if (!userID) {
      return res
        .status(401)
        .json({ error: "User authentication is required." });
    }

    if (!questionID || !mongoose.Types.ObjectId.isValid(questionID)) {
      return res.status(400).json({ error: "A valid questionID is required." });
    }

    const question = await Question.findById(questionID);
    if (!question || question.isArchived === true) {
      return res.status(404).json({ error: "Question not found" });
    }

    // FR-3 / FR-4 Exception: Reject empty or non-string submissions unless Skipped
    const isSkipped = clientStatus === "Skipped";
    if (
      !isSkipped &&
      (typeof submittedCodeOrText !== "string" || !submittedCodeOrText.trim())
    ) {
      return res.status(400).json({
        error: "Submission cannot be empty unless the question is skipped.",
      });
    }

    // 2. Evaluate Code if the DB question is a Coding question (do not trust req.body.type)
    let finalStatus = clientStatus;
    let testDetails = null;

    if (question.type === "Coding" && !isSkipped) {
      try {
        const runnerResult = await runPythonCode(
          submittedCodeOrText,
          question.testCases,
        );
        finalStatus = runnerResult.success ? "Solved" : "Attempted";
        testDetails = runnerResult.details;
      } catch (error) {
        console.error("Sandbox Error:", error);
        return res
          .status(400)
          .json({ error: "Code execution failed or timed out." });
      }
    }

    // Validate finalStatus before opening a DB transaction
    if (!["Solved", "Attempted", "Skipped"].includes(finalStatus)) {
      return res.status(400).json({
        error:
          "Valid status ('Solved', 'Attempted', or 'Skipped') is required.",
      });
    }

    // 3. Start the Atomic Database Transaction (Requirement S-3)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const previousAttempt = await Attempt.findOne({ userID, questionID })
        .sort({ createdAt: -1 })
        .session(session);
      const previousStatus = previousAttempt ? previousAttempt.status : null;

      await Attempt.create(
        [
          {
            userID,
            questionID,
            status: finalStatus,
            submittedCodeOrText:
              typeof submittedCodeOrText === "string"
                ? submittedCodeOrText
                : "",
            timeTakenSeconds,
          },
        ],
        { session },
      );

      // Update Subtopic Statistics Atomically (Guard against empty $inc)
      for (const subtopicID of question.subtopicIDs) {
        const incFields = {};
        if (previousStatus !== finalStatus) {
          incFields[finalStatus.toLowerCase()] = 1;
          if (previousStatus) {
            incFields[previousStatus.toLowerCase()] = -1;
          }
        }

        const updateQuery = { $set: { lastPracticed: new Date() } };
        if (Object.keys(incFields).length > 0) {
          updateQuery.$inc = incFields;
        }

        await UserSubtopicStats.updateOne({ userID, subtopicID }, updateQuery, {
          upsert: true,
          session,
        });
      }

      // FR-8 Post-condition: Mark today's Recovery Plan item "Completed"
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      await RecoveryPlan.updateOne(
        {
          userID,
          date: today,
          "items.questionID": questionID,
        },
        {
          $set: { "items.$.state": "Completed" },
        },
        { session },
      );

      await session.commitTransaction();
      return res.status(201).json({
        message: "Attempt recorded",
        status: finalStatus,
        testDetails,
      });
    } catch (error) {
      await session.abortTransaction();
      return sendServerError(res, "Transaction failed", error);
    } finally {
      session.endSession();
    }
  } catch (error) {
    return sendServerError(res, "Failed to process attempt", error);
  }
};

// @desc    Get per-topic and per-subtopic stats + accuracy for Dashboard (FR-10)
// @route   GET /api/attempts/dashboard
// @access  Private (JWT)
const getDashboardStats = async (req, res) => {
  try {
    const userID = req.user?._id || req.user?.id;
    if (!userID) {
      return res
        .status(401)
        .json({ error: "User authentication is required." });
    }

    const rawStats = await UserSubtopicStats.find({ userID }).populate({
      path: "subtopicID",
      select: "name topicID",
      populate: { path: "topicID", select: "name" },
    });

    const subtopicStats = rawStats
      .filter((s) => s.subtopicID)
      .map((s) => {
        const total = s.solved + s.attempted + s.skipped;
        return {
          subtopicID: s.subtopicID._id,
          subtopicName: s.subtopicID.name,
          topicID: s.subtopicID.topicID?._id || null,
          topicName: s.subtopicID.topicID?.name || "Uncategorized",
          solved: s.solved,
          attempted: s.attempted,
          skipped: s.skipped,
          accuracy: total > 0 ? Math.round((s.solved / total) * 100) : 0,
          lastPracticed: s.lastPracticed,
        };
      });

    // Aggregate per-topic totals from distinct-question UserSubtopicStats
    const topicMap = {};
    for (const item of subtopicStats) {
      const key = item.topicName;
      if (!topicMap[key]) {
        topicMap[key] = { topicName: key, solved: 0, attempted: 0, skipped: 0 };
      }
      topicMap[key].solved += item.solved;
      topicMap[key].attempted += item.attempted;
      topicMap[key].skipped += item.skipped;
    }

    const topicStats = Object.values(topicMap).map((t) => {
      const total = t.solved + t.attempted + t.skipped;
      return {
        ...t,
        accuracy: total > 0 ? Math.round((t.solved / total) * 100) : 0,
      };
    });

    return res.status(200).json({ topicStats, subtopicStats });
  } catch (error) {
    return sendServerError(res, "Failed to load dashboard stats", error);
  }
};

// @desc    Get chronological attempt history for History screen (FR-10)
// @route   GET /api/attempts/history
// @access  Private (JWT)
const getAttemptHistory = async (req, res) => {
  try {
    const userID = req.user?._id || req.user?.id;
    if (!userID) {
      return res
        .status(401)
        .json({ error: "User authentication is required." });
    }

    const attempts = await Attempt.find({ userID })
      .populate({
        path: "questionID",
        select: "statement difficulty type topicID subtopicIDs isArchived",
        populate: [
          { path: "topicID", select: "name" },
          { path: "subtopicIDs", select: "name" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json(attempts);
  } catch (error) {
    return sendServerError(res, "Failed to load attempt history", error);
  }
};

module.exports = { submitAttempt, getDashboardStats, getAttemptHistory };
