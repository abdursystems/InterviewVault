const { generateDailyPlan } = require("../services/plannerService");

/**
 * GET /api/recovery-plan
 * Generates (or retrieves) today's 5-question recovery plan for the authenticated user.
 */
const getRecoveryPlan = async (req, res) => {
  try {
    // SEC-3: Always derive user identity from the verified JWT attached by protect
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Not authorized. A valid Bearer token is required.",
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
    const payload = { error: "Failed to generate recovery plan" };
    if (process.env.NODE_ENV !== "production") {
      payload.details = error.message;
    }
    return res.status(500).json(payload);
  }
};

module.exports = { getRecoveryPlan };
