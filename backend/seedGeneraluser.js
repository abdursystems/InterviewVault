require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Subtopic = require("./models/Subtopic");
const Question = require("./models/Question");
const Attempt = require("./models/Attempt");
const UserSubtopicStats = require("./models/UserSubtopicStats");
const RecoveryPlan = require("./models/RecoveryPlan");

const seedGeneralPracticeUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // 1. Recreate or reset only this test user (safe to re-run)
    const email = "general@interviewvault.com";
    let user = await User.findOne({ email });

    if (user) {
      await Promise.all([
        Attempt.deleteMany({ userID: user._id }),
        UserSubtopicStats.deleteMany({ userID: user._id }),
        RecoveryPlan.deleteMany({ userID: user._id }),
      ]);
      console.log("Cleared previous data for existing General Practice user.");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Student@123", salt);

      user = await User.create({
        name: "Zainab Tariq",
        email,
        password: hashedPassword,
        role: "Student",
        isActive: true,
      });
      console.log("Created General Practice student user.");
    }

    // 2. Fetch existing Subtopics & Questions seeded by seedFresh.js
    const subtopics = await Subtopic.find();
    const S = Object.fromEntries(subtopics.map((s) => [s.name, s._id]));

    const questions = await Question.find({ isArchived: { $ne: true } });
    const findQ = (keyword) => {
      const q = questions.find((item) => item.statement.includes(keyword));
      if (!q) {
        throw new Error(
          `Could not find question matching "${keyword}". Make sure seedFresh.js has been run.`,
        );
      }
      return q;
    };

    const qRecEasy = findQ("factorial(n)");
    const qJoin1 = findQ("INNER JOIN");
    const qJoin2 = findQ("Self Join");
    const qJoin3 = findQ("CROSS JOIN");
    const qPoly = findQ("compile-time polymorphism");
    const qConc = findQ("process and a thread");

    const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    // 3. Seed 6 Attempts:
    //    - >= 5 total attempts (exits Onboarding)
    //    - At most 1 missed question in any subtopic (stays in GeneralPractice)
    await Attempt.insertMany([
      // 1 Solved in Recursion 12 days ago -> Least recently practiced subtopic (Focus + Retry target)
      {
        userID: user._id,
        questionID: qRecEasy._id,
        status: "Solved",
        submittedCodeOrText:
          "def factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)",
        timeTakenSeconds: 110,
        createdAt: daysAgo(12),
      },
      // 3 Solved in Joins 9 days ago -> Qualifies Joins for the Review slot
      {
        userID: user._id,
        questionID: qJoin1._id,
        status: "Solved",
        submittedCodeOrText:
          "INNER JOIN returns matched rows; LEFT keeps all left rows; FULL keeps all rows from both.",
        timeTakenSeconds: 85,
        createdAt: daysAgo(9),
      },
      {
        userID: user._id,
        questionID: qJoin2._id,
        status: "Solved",
        submittedCodeOrText:
          "A self join joins a table to itself using aliases, e.g., employees and managers.",
        timeTakenSeconds: 65,
        createdAt: daysAgo(9),
      },
      {
        userID: user._id,
        questionID: qJoin3._id,
        status: "Solved",
        submittedCodeOrText:
          "CROSS JOIN is Cartesian product; NATURAL JOIN auto-joins on same-named columns.",
        timeTakenSeconds: 95,
        createdAt: daysAgo(9),
      },
      // 1 Solved in Polymorphism 4 days ago
      {
        userID: user._id,
        questionID: qPoly._id,
        status: "Solved",
        submittedCodeOrText:
          "Overloading resolves at compile time; overriding resolves dynamically at runtime.",
        timeTakenSeconds: 75,
        createdAt: daysAgo(4),
      },
      // 1 Single Miss in Concurrency 2 days ago (< 2 misses, so no RootCause triggered)
      {
        userID: user._id,
        questionID: qConc._id,
        status: "Attempted",
        submittedCodeOrText:
          "Processes have separate memory spaces; threads share memory.",
        timeTakenSeconds: 130,
        createdAt: daysAgo(2),
      },
    ]);

    // 4. Seed matching UserSubtopicStats
    await UserSubtopicStats.insertMany([
      {
        userID: user._id,
        subtopicID: S["Recursion"],
        solved: 1,
        attempted: 0,
        skipped: 0,
        lastPracticed: daysAgo(12),
      },
      {
        userID: user._id,
        subtopicID: S["Joins"],
        solved: 3,
        attempted: 0,
        skipped: 0,
        lastPracticed: daysAgo(9),
      },
      {
        userID: user._id,
        subtopicID: S["Polymorphism"],
        solved: 1,
        attempted: 0,
        skipped: 0,
        lastPracticed: daysAgo(4),
      },
      {
        userID: user._id,
        subtopicID: S["Concurrency"],
        solved: 0,
        attempted: 1,
        skipped: 0,
        lastPracticed: daysAgo(2),
      },
    ]);

    console.log("\n========================================================");
    console.log("GENERAL PRACTICE USER SEEDED SUCCESSFULLY!");
    console.log("========================================================");
    console.log("Login:  general@interviewvault.com / Student@123");
    console.log("Mode:   GeneralPractice (6 attempts, max 1 miss/subtopic)");
    console.log("Target: Recursion (least recently practiced, 12 days ago)");
    console.log("Review: Joins (3 solved, 0 missed, 9 days ago)");
    console.log("========================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding General Practice user:", error);
    process.exit(1);
  }
};

seedGeneralPracticeUser();
