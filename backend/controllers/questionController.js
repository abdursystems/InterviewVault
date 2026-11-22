const mongoose = require("mongoose");
const Question = require("../models/Question");
const Topic = require("../models/Topic");
const Subtopic = require("../models/Subtopic");

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const TYPES = ["Theory", "Coding"];

const isId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sendServerError = (res, message, error) => {
  const payload = { message };
  if (process.env.NODE_ENV !== "production") {
    payload.error = error.message;
  }
  return res.status(500).json(payload);
};

// @desc    Get all questions with optional filters (Topic, Subtopic, Difficulty, Type, Keyword)
// @route   GET /api/questions
// @access  Private (FR-2)
const getQuestions = async (req, res) => {
  try {
    const { topicID, subtopicID, difficulty, type, search } = req.query;
    const filter = { isArchived: { $ne: true } };

    if (topicID) {
      if (!isId(topicID)) {
        return res.status(400).json({ message: "Invalid topicID" });
      }
      filter.topicID = topicID;
    }

    if (subtopicID) {
      if (!isId(subtopicID)) {
        return res.status(400).json({ message: "Invalid subtopicID" });
      }
      filter.subtopicIDs = subtopicID;
    }

    if (difficulty && DIFFICULTIES.includes(difficulty)) {
      filter.difficulty = difficulty;
    }

    if (type && TYPES.includes(type)) {
      filter.type = type;
    }

    if (typeof search === "string" && search.trim()) {
      filter.statement = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    const questions = await Question.find(filter)
      .select("-testCases -modelAnswer")
      .populate("topicID", "name")
      .populate("subtopicIDs", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(questions);
  } catch (error) {
    return sendServerError(res, "Failed to fetch questions", error);
  }
};

// @desc    Get a single question by ID for the workspace (Sequence Diagram Step 2)
// @route   GET /api/questions/:id
// @access  Private (FR-3)
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isId(id)) {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await Question.findById(id)
      .populate("topicID", "name")
      .populate("subtopicIDs", "name")
      .lean();

    if (!question || question.isArchived === true) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Never expose hidden test-case inputs/outputs to students
    const allTestCases = Array.isArray(question.testCases)
      ? question.testCases
      : [];
    const visibleTestCases = allTestCases.filter((tc) => !tc.isHidden);
    const hiddenTestCount = allTestCases.length - visibleTestCases.length;

    res.status(200).json({
      ...question,
      testCases: visibleTestCases,
      hiddenTestCount,
    });
  } catch (error) {
    return sendServerError(res, "Failed to fetch question", error);
  }
};

// @desc    Get all topics and subtopics for filter dropdowns
// @route   GET /api/questions/taxonomy
// @access  Private
const getTaxonomy = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ name: 1 });
    const subtopics = await Subtopic.find()
      .populate("topicID", "name")
      .sort({ name: 1 });
    res.status(200).json({ topics, subtopics });
  } catch (error) {
    return sendServerError(res, "Failed to fetch taxonomy", error);
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  getTaxonomy,
};
