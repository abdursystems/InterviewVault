const mongoose = require("mongoose");
const Attempt = require("../models/Attempt");
const Question = require("../models/Question");
const Subtopic = require("../models/Subtopic");
const Topic = require("../models/Topic");
const UserSubtopicStats = require("../models/UserSubtopicStats");
const RecoveryPlan = require("../models/RecoveryPlan");

const ACTIVE_QUESTION = { isArchived: { $ne: true } };
const PLAN_QUESTION_FIELDS =
  "statement difficulty type topicID subtopicIDs isArchived";

/**
 * Helper: Get all question IDs whose CURRENT (latest) status for the user is "Solved".
 * FR-8 Post-condition: A solved question is not repeated except in the Review slot.
 */
async function getCurrentlySolvedQuestionIds(userId) {
  const solvedDocs = await Attempt.aggregate([
    { $match: { userID: new mongoose.Types.ObjectId(userId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$questionID",
        latestStatus: { $first: "$status" },
      },
    },
    { $match: { latestStatus: "Solved" } },
  ]);
  return solvedDocs.map((doc) => doc._id);
}

/**
 * FR-7: Root-Cause Diagnosis Engine
 * Returns mode, rootCauseSubtopicId, subtopicName, missedCount, and missedQuestionIds.
 */
async function diagnoseRootCause(userId) {
  const totalAttempts = await Attempt.countDocuments({ userID: userId });
  if (totalAttempts < 5) {
    return {
      mode: "Onboarding",
      rootCauseSubtopicId: null,
      subtopicName: null,
      missedCount: 0,
      missedQuestionIds: [],
    };
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const diagnosis = await Attempt.aggregate([
    // STAGE 1: Filter attempts by user in the last 30 days
    {
      $match: {
        userID: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    // STAGE 2: Sort newest first
    { $sort: { createdAt: -1 } },
    // STAGE 3: Deduplicate by questionID, keeping latest status
    {
      $group: {
        _id: "$questionID",
        latestStatus: { $first: "$status" },
        lastAttemptDate: { $first: "$createdAt" },
      },
    },
    // STAGE 4: Keep only currently missed questions
    {
      $match: {
        latestStatus: { $in: ["Attempted", "Skipped"] },
      },
    },
    // STAGE 5: Join with questions collection
    {
      $lookup: {
        from: "questions",
        localField: "_id",
        foreignField: "_id",
        as: "questionDetails",
      },
    },
    // STAGE 6: Unpack questionDetails
    { $unwind: "$questionDetails" },
    // STAGE 7: Unpack subtopicIDs
    { $unwind: "$questionDetails.subtopicIDs" },
    // STAGE 8: Group by subtopicID, count misses, collect missed question IDs, and track latest miss
    {
      $group: {
        _id: "$questionDetails.subtopicIDs",
        missedCount: { $sum: 1 },
        missedQuestionIds: { $push: "$_id" },
        mostRecentMiss: { $max: "$lastAttemptDate" },
      },
    },
    // STAGE 9: Enforce FR-7 threshold (>= 2 missed questions)
    { $match: { missedCount: { $gte: 2 } } },
    // STAGE 10: Sort by highest count, then most recent miss tie-breaker
    { $sort: { missedCount: -1, mostRecentMiss: -1 } },
    { $limit: 1 },
  ]);

  if (diagnosis.length > 0) {
    const winner = diagnosis[0];
    const subtopicDoc = await Subtopic.findById(winner._id);
    return {
      mode: "RootCause",
      rootCauseSubtopicId: winner._id,
      subtopicName: subtopicDoc ? subtopicDoc.name : "Unknown Subtopic",
      missedCount: winner.missedCount,
      missedQuestionIds: winner.missedQuestionIds,
    };
  }

  return {
    mode: "GeneralPractice",
    rootCauseSubtopicId: null,
    subtopicName: null,
    missedCount: 0,
    missedQuestionIds: [],
  };
}

/**
 * FR-8 & FR-9: 5-Slot Recovery Plan Generator
 */
/**
 * An item counts as Completed only if the student has a Solved attempt on that question today.
 * Attempted and Skipped attempts never complete an item.
 */
async function syncPlanItemStates(plan, userId, today) {
  const questionIds = plan.items.map((item) => item.questionID);
  const solvedToday = await Attempt.find(
    {
      userID: userId,
      questionID: { $in: questionIds },
      status: "Solved",
      createdAt: { $gte: today },
    },
    "questionID",
  ).lean();
  const solvedSet = new Set(solvedToday.map((a) => String(a.questionID)));

  let changed = false;
  for (const item of plan.items) {
    const desired = solvedSet.has(String(item.questionID)) ? "Completed" : "Pending";
    if (item.state !== desired) {
      item.state = desired;
      changed = true;
    }
  }
  if (changed) await plan.save();
  return plan;
}

async function generateDailyPlan(userId) {
  // Normalize today's date to midnight UTC so there is 1 plan per calendar day
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Return existing plan if already generated today
  const storedPlan = await RecoveryPlan.findOne({ userID: userId, date: today });
  if (storedPlan) {
    // Re-derive item states from today's attempts so stale "Completed" flags (for example from
    // an earlier skip) are corrected for plans that already exist.
    await syncPlanItemStates(storedPlan, userId, today);
    return await RecoveryPlan.findById(storedPlan._id)
      .populate("diagnosedSubtopicID", "name")
      .populate("items.questionID", PLAN_QUESTION_FIELDS);
  }

  const diagnosis = await diagnoseRootCause(userId);
  const solvedIds = await getCurrentlySolvedQuestionIds(userId);
  const selectedIds = []; // Tracks picked questions so all 5 slots are distinct
  const items = [];

  // Helper to exclude already selected and (unless review) already solved questions
  const getExclusionList = (allowSolved = false) => {
    return allowSolved ? [...selectedIds] : [...selectedIds, ...solvedIds];
  };

  // ============================================================================
  // CASE 1: ONBOARDING MODE (< 5 total attempts)
  // FR-8 Pre-condition: 1 foundational (Easy) question per topic + 1 extra
  // ============================================================================
  if (diagnosis.mode === "Onboarding") {
    const topics = await Topic.find().limit(4);

    for (const topic of topics) {
      const q = await Question.findOne({
        ...ACTIVE_QUESTION,
        topicID: topic._id,
        difficulty: "Easy",
        _id: { $nin: getExclusionList(false) },
      });
      if (q) {
        selectedIds.push(q._id);
        items.push({
          questionID: q._id,
          role:
            items.length < 2
              ? "Focus"
              : items.length === 2
                ? "Retry"
                : "Review",
          reason: `Onboarding foundational question for ${topic.name} to establish your baseline.`,
          state: "Pending",
        });
      }
    }

    // 5th slot: 1 additional foundational question from any topic
    const extraQ = await Question.findOne({
      ...ACTIVE_QUESTION,
      _id: { $nin: getExclusionList(false) },
    }).sort({ difficulty: 1 });

    if (extraQ) {
      selectedIds.push(extraQ._id);
      items.push({
        questionID: extraQ._id,
        role: "Stretch",
        reason:
          "Onboarding question to complete your initial 5-question diagnostic baseline.",
        state: "Pending",
      });
    }
  } else {
    // ============================================================================
    // CASE 2: ROOT CAUSE OR GENERAL PRACTICE MODE
    // Slots: 2 Focus, 1 Retry, 1 Review, 1 Stretch
    // ============================================================================
    const {
      mode,
      rootCauseSubtopicId,
      subtopicName,
      missedCount,
      missedQuestionIds,
    } = diagnosis;

    // Determine target subtopics if in GeneralPractice mode (least recently practiced)
    let leastRecentSubtopic = null;
    if (mode === "GeneralPractice") {
      const oldestStat = await UserSubtopicStats.findOne({ userID: userId })
        .sort({ lastPracticed: 1 })
        .populate("subtopicID", "name");
      if (oldestStat && oldestStat.subtopicID) {
        leastRecentSubtopic = oldestStat.subtopicID;
      } else {
        leastRecentSubtopic = await Subtopic.findOne();
      }
    }

    const targetSubtopicId =
      mode === "RootCause" ? rootCauseSubtopicId : leastRecentSubtopic?._id;
    const targetSubtopicName =
      mode === "RootCause"
        ? subtopicName
        : leastRecentSubtopic?.name || "General";

    // --- SLOT 1: FOCUS 1 (Easy from Root Cause / Least Practiced) ---
    let focus1 = await Question.findOne({
      ...ACTIVE_QUESTION,
      subtopicIDs: targetSubtopicId,
      difficulty: "Easy",
      _id: { $nin: getExclusionList(false) },
    });
    let focus1Reason =
      mode === "RootCause"
        ? `Recommended because you missed ${missedCount} questions tagged ${targetSubtopicName}, your most frequent weak subtopic (Easy Focus).`
        : `Selected from ${targetSubtopicName}, one of your least recently practiced subtopics (General Practice).`;

    if (!focus1) {
      focus1 = await Question.findOne({
        ...ACTIVE_QUESTION,
        subtopicIDs: targetSubtopicId,
        _id: { $nin: getExclusionList(false) },
      });
      if (focus1) {
        focus1Reason = `Fallback Focus question for ${targetSubtopicName} (no Easy difficulty question was available).`;
      }
    }
    if (focus1) {
      selectedIds.push(focus1._id);
      items.push({
        questionID: focus1._id,
        role: "Focus",
        reason: focus1Reason,
        state: "Pending",
      });
    }

    // --- SLOT 2: FOCUS 2 (Medium from Root Cause / Least Practiced) ---
    let focus2 = await Question.findOne({
      ...ACTIVE_QUESTION,
      subtopicIDs: targetSubtopicId,
      difficulty: "Medium",
      _id: { $nin: getExclusionList(false) },
    });
    let focus2Reason =
      mode === "RootCause"
        ? `Recommended because you missed ${missedCount} questions tagged ${targetSubtopicName}, your most frequent weak subtopic (Medium Focus).`
        : `Selected to build proficiency in ${targetSubtopicName}, your least recently practiced subtopic.`;

    if (!focus2) {
      focus2 = await Question.findOne({
        ...ACTIVE_QUESTION,
        subtopicIDs: targetSubtopicId,
        _id: { $nin: getExclusionList(false) },
      });
      if (focus2) {
        focus2Reason = `Fallback Focus question for ${targetSubtopicName} (no Medium difficulty question was available).`;
      }
    }
    if (focus2) {
      selectedIds.push(focus2._id);
      items.push({
        questionID: focus2._id,
        role: "Focus",
        reason: focus2Reason,
        state: "Pending",
      });
    }

    // --- SLOT 3: RETRY (Previously missed question in Root Cause) ---
    let retryQ = null;
    let retryReason = "";

    if (mode === "RootCause" && missedQuestionIds.length > 0) {
      retryQ = await Question.findOne({
        ...ACTIVE_QUESTION,
        _id: { $in: missedQuestionIds, $nin: getExclusionList(false) },
      });
      if (retryQ) {
        retryReason = `Retry question: You previously attempted or skipped this ${targetSubtopicName} problem without solving it.`;
      }
    }

    // Fallback for Retry if in GeneralPractice or all missed questions were archived/picked
    if (!retryQ) {
      retryQ = await Question.findOne({
        ...ACTIVE_QUESTION,
        subtopicIDs: targetSubtopicId,
        _id: { $nin: getExclusionList(false) },
      });
      retryReason =
        mode === "RootCause"
          ? `Additional ${targetSubtopicName} practice selected to fill your Retry slot.`
          : `Selected from ${targetSubtopicName} for general practice retry.`;
    }
    if (retryQ) {
      selectedIds.push(retryQ._id);
      items.push({
        questionID: retryQ._id,
        role: "Retry",
        reason: retryReason,
        state: "Pending",
      });
    }

    // --- SLOT 4: REVIEW (Strong subtopic: >= 3 Solved, 0 missed, lastPracticed >= 7 days ago) ---
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const strongStat = await UserSubtopicStats.findOne({
      userID: userId,
      solved: { $gte: 3 },
      attempted: 0,
      skipped: 0,
      lastPracticed: { $lte: sevenDaysAgo },
    })
      .sort({ lastPracticed: 1 })
      .populate("subtopicID", "name");

    let reviewQ = null;
    let reviewReason = "";

    if (strongStat && strongStat.subtopicID) {
      // FR-8 Post-condition allows repeating a Solved question in the Review slot
      reviewQ = await Question.findOne({
        ...ACTIVE_QUESTION,
        subtopicIDs: strongStat.subtopicID._id,
        _id: { $nin: getExclusionList(true) },
      });
      if (reviewQ) {
        reviewReason = `Spaced repetition review for ${strongStat.subtopicID.name}: strong performance (≥3 solved, 0 missed) and not practiced in over 7 days.`;
      }
    }

    // FR-8 Exception Fallback
    if (!reviewQ) {
      reviewQ = await Question.findOne({
        ...ACTIVE_QUESTION,
        _id: { $nin: getExclusionList(false) },
      });
      reviewReason =
        "Fallback Review slot: No subtopic met the 7-day strong review threshold yet, so a fresh question was selected.";
    }
    if (reviewQ) {
      selectedIds.push(reviewQ._id);
      items.push({
        questionID: reviewQ._id,
        role: "Review",
        reason: reviewReason,
        state: "Pending",
      });
    }

    // --- SLOT 5: STRETCH (Hard question from a subtopic that is NOT the root cause) ---
    const stretchFilter = {
      ...ACTIVE_QUESTION,
      difficulty: "Hard",
      _id: { $nin: getExclusionList(false) },
    };
    if (rootCauseSubtopicId) {
      stretchFilter.subtopicIDs = { $ne: rootCauseSubtopicId };
    }

    let stretchQ = await Question.findOne(stretchFilter).populate(
      "subtopicIDs",
      "name",
    );
    let stretchReason = "";

    if (stretchQ) {
      const stretchSubName =
        stretchQ.subtopicIDs?.[0]?.name || "another subtopic";
      stretchReason = `Stretch challenge: Hard difficulty question in ${stretchSubName} (outside your root-cause subtopic) to push your interview readiness.`;
    } else {
      stretchQ = await Question.findOne({
        ...ACTIVE_QUESTION,
        _id: { $nin: getExclusionList(false) },
      });
      stretchReason =
        "Fallback Stretch slot: No eligible Hard question outside your root cause was found, so an alternative question was selected.";
    }

    if (stretchQ) {
      selectedIds.push(stretchQ._id);
      items.push({
        questionID: stretchQ._id,
        role: "Stretch",
        reason: stretchReason,
        state: "Pending",
      });
    }
  }

  // Save and return the daily plan
  const savedPlan = await RecoveryPlan.create({
    userID: userId,
    date: today,
    mode: diagnosis.mode,
    diagnosedSubtopicID: diagnosis.rootCauseSubtopicId,
    items,
  });

  return await RecoveryPlan.findById(savedPlan._id)
    .populate("diagnosedSubtopicID", "name")
    .populate("items.questionID", PLAN_QUESTION_FIELDS);
}

module.exports = {
  diagnoseRootCause,
  generateDailyPlan,
};
