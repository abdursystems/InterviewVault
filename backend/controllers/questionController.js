const Question = require("../models/Question");
const Topic = require("../models/Topic");
const Subtopic = require("../models/Subtopic");

// @desc    Get all questions with optional filters (Topic, Subtopic, Difficulty, Type, Keyword)
// @route   GET /api/questions
// @access  Private (FR-2)
const getQuestions = async (req, res) => {
  try {
    const { topicID, subtopicID, difficulty, type, search } = req.query;
    const filter = { isArchived: false };

    if (topicID) filter.topicID = topicID;
    if (subtopicID) filter.subtopicIDs = subtopicID;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    if (search) {
      filter.statement = { $regex: search, $options: "i" };
    }

    const questions = await Question.find(filter)
      .select("-testCases.isHidden")
      .populate("topicID", "name")
      .populate("subtopicIDs", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(questions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch questions", error: error.message });
  }
};

// @desc    Get a single question by ID for the workspace (Sequence Diagram Step 2)
// @route   GET /api/questions/:id
// @access  Private (FR-3)
const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate("topicID", "name")
      .populate("subtopicIDs", "name");

    if (!question || question.isArchived) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json(question);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch question", error: error.message });
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
    res
      .status(500)
      .json({ message: "Failed to fetch taxonomy", error: error.message });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  getTaxonomy,
};
