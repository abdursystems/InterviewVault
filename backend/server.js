require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// DB Connection
const connectDB = require("./config/db.js");

// Import Route Modules
const authRoutes = require("./routes/authRoutes.js");
const questionRoutes = require("./routes/questionRoutes.js");
const attemptRoutes = require("./routes/attemptRoutes.js");
const recoveryPlanRoutes = require("./routes/recoveryPlanRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");

const app = express();

// 1. Establish Database Connection
connectDB();

// 2. Global Middleware (SRS §3.1.4: restrict CORS to the front-end origin)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / server-to-server / Postman requests (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// 3. Static Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 4. Health Check
app.get("/", (req, res) => {
  res.send("InterviewVault Backend is running successfully 🚀");
});

// 5. Mounted InterviewVault API Routers
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/recovery-plan", recoveryPlanRoutes);
app.use("/api/admin", adminRoutes); // Admin only (protect + adminOnly inside the router)

// 6. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});

module.exports = app;
