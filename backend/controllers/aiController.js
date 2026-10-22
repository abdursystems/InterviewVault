const OpenAI = require("openai")
const { conceptExplainPrompt, questionAnswerPrompt } = require("../utils/prompts.js")

const ai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
})

// @desc  generate interview questions and answers using groq
// @route  POST /api/ai/generate-questions
// @access  private
const generateInterviewQuestions = async (req, res) => {
    try {
        const { role, experience, topicsToFocus, numberOfQuestions } = req.body

        if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
            return res.status(400).json({
                message: "Missing Required Fields"
            })
        }

        const prompt = questionAnswerPrompt(role, experience, topicsToFocus, numberOfQuestions)

        const response = await ai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
        })

        let rawText = response.choices[0].message.content

        const cleanedText = rawText
            .replace(/^```json\s*/, "")
            .replace(/```$/, "")
            .trim()

        const data = JSON.parse(cleanedText)

        res.status(200).json(data)

    } catch (error) {
        res.status(500).json({
            message: "Failed to Generate Questions",
            error: error.message
        })
    }
}

// @desc  generate explains a interview question
// @route  POST /api/ai/generate-explanation
// @access  private
const generateConceptExplanation = async (req, res) => {
    try {
        const { question } = req.body

        if (!question) {
            return res.status(400).json({
                message: "Missing Required Fields"
            })
        }

        const prompt = conceptExplainPrompt(question)

        const response = await ai.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
        })

        let rawText = response.choices[0].message.content

        const cleanedText = rawText
            .replace(/^```json\s*/, "")
            .replace(/```$/, "")
            .trim()

        const data = JSON.parse(cleanedText)

        res.status(200).json(data)

    } catch (error) {
        res.status(500).json({
            message: "Failed to Generate Questions",
            error: error.message
        })
    }
}

module.exports = { generateInterviewQuestions, generateConceptExplanation }