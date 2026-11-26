const express = require("express");
const router = express.Router();
const {
  submitAttempt,
  runCode,
  getDashboardStats,
  getAttemptHistory,
} = require("../controllers/attemptController");
const { protect } = require("../middlewares/authMiddleware");

// Route maps to POST /api/attempts when mounted in server.js
// Run executes the code without saving; only POST / (submit) records an attempt.
router.post("/run", protect, runCode);
router.post("/", protect, submitAttempt);
router.get("/dashboard", protect, getDashboardStats);
router.get("/history", protect, getAttemptHistory);

module.exports = router;
