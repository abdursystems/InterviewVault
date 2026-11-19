const express = require("express");
const router = express.Router();
const { getRecoveryPlan } = require("../controllers/recoveryPlanController");

// Maps to GET /api/recovery-plan
router.get("/", getRecoveryPlan);

module.exports = router;
