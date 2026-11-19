const { generateDailyPlan } = require("../services/plannerService");

/**
 * GET /api/recovery-plan
 * Generates (or retrieves) today's 5-question recovery plan for the user.
 */
const getRecoveryPlan = async (req, res) => {
  try {
    // Support both JWT middleware (req.user) and query param (?userID=...) for easy Postman testing
    const userId =
      req.user?._id || req.user?.id || req.query.userID || req.body.userID;

    if (!userId) {
      return res.status(400).json({
        error:
          "userID is required (pass ?userID=<id> in the URL or authenticate with a Bearer token).",
      });
    }

    const plan = await generateDailyPlan(userId);

    // FR-8 Exception: If fewer than 5 questions are eligible, attach a notice
    const notice =
      plan.items.length < 5
        ? `Notice: Only ${plan.items.length} eligible questions were found in the question bank for today's plan.`
        : null;

    return res.status(200).json({
      message: "Daily recovery plan retrieved successfully",
      notice,
      plan,
    });
  } catch (error) {
    console.error("Error generating recovery plan:", error);
    return res.status(500).json({
      error: "Failed to generate recovery plan",
      details: error.message,
    });
  }
};

module.exports = { getRecoveryPlan };
