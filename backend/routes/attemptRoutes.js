const express = require("express");
const router = express.Router();
const {
  submitAttempt,
  getDashboardStats,
  getAttemptHistory,
} = require("../controllers/attemptController");
const { protect } = require("../middlewares/authMiddleware");

// Route maps to POST /api/attempts when mounted in server.js
router.post("/", protect, submitAttempt);
router.get("/dashboard", protect, getDashboardStats);
router.get("/history", protect, getAttemptHistory);

module.exports = router;
