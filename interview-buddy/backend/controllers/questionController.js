const Question = require("../models/Question.js");

// @desc  add additional questions
// @route  POST /api/questions/add
// @access  private
exports.addQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        message: "Invalid Input Data",
      });
    }

    // create new questions
    const createdQuestions = await Question.insertMany(
      questions.map((q) => ({
        question: q.question,
        answer: q.answer,
      })),
    );

    res.status(201).json(createdQuestions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc  pin or unpin a question
// @route  POST /api/questions/:id/pin
// @access  private
exports.togglePinQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question Not Found",
      });
    }

    question.isPinned = !question.isPinned;
    await question.save();

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc  update a note for a question
// @route  POST /api/questions/:id/note
// @access  private
exports.updateQuestionNote = async (req, res) => {
  try {
    const { note } = req.body;
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question Not Found",
      });
    }

    question.note = note || "";
    await question.save();

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
