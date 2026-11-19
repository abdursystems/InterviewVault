require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// DB Connection
const connectDB = require("./config/db.js");

// Middleware
const { protect } = require("./middlewares/authMiddleware.js");

// Controllers
const {
  generateInterviewQuestions,
  generateConceptExplanation,
} = require("./controllers/aiController.js");

// Import Route Modules
const attemptRoutes = require("./routes/attemptRoutes");
const authRoutes = require("./routes/authRoutes.js");
// const sessionRoutes = require("./routes/sessionRoutes.js");
const questionRoutes = require("./routes/questionRoutes.js");

const app = express();

// 1. Establish Database Connection (Once)
connectDB();

// 2. Global Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// 3. Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. Routes
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// Mounted Routers
app.use("/api/auth", authRoutes);
// app.use("/api/sessions", sessionRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);

// Specific Endpoints (Changed from app.use to app.post)
app.post("/api/ai/generate-questions", protect, generateInterviewQuestions);
app.post("/api/ai/generate-explanation", protect, generateConceptExplanation);

// 5. Start Server (Once)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

module.exports = app;
