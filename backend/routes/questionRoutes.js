const express = require("express");
const {
  getQuestions,
  getQuestionById,
  getTaxonomy,
} = require("../controllers/questionController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Browse & filter questions (FR-2) and fetch taxonomy dropdowns
router.get("/", protect, getQuestions);
router.get("/taxonomy", protect, getTaxonomy);

// Fetch single question for the workspace (Sequence Diagram Step 2 / FR-3)
router.get("/:id", protect, getQuestionById);

module.exports = router;
