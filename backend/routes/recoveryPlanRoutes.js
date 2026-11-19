const express = require("express");
const router = express.Router();
const { getRecoveryPlan } = require("../controllers/recoveryPlanController");
const { protect } = require("../middlewares/authMiddleware");

// Maps to GET /api/recovery-plan
router.get("/", protect, getRecoveryPlan);

module.exports = router;
