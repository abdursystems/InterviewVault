require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Topic = require("./models/Topic");
const Subtopic = require("./models/Subtopic");
const Question = require("./models/Question");
const Attempt = require("./models/Attempt");
const { diagnoseRootCause } = require("./services/plannerService");

const seedAndTestDiagnosis = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // 1. Create a fresh test user
    const user = await User.create({
      name: "Diagnosis Tester",
      email: `diag_${Date.now()}@example.com`,
      password: "hashedpassword123",
      role: "Student",
    });

    // 2. Ensure core Topic and Subtopics exist
    const topic = await Topic.findOneAndUpdate(
      { name: "DSA" },
      { name: "DSA" },
      { upsert: true, new: true },
    );

    const recSubtopic = await Subtopic.findOneAndUpdate(
      { topicID: topic._id, name: "Recursion" },
      { topicID: topic._id, name: "Recursion" },
      { upsert: true, new: true },
    );

    const concSubtopic = await Subtopic.findOneAndUpdate(
      { topicID: topic._id, name: "Concurrency" },
      { topicID: topic._id, name: "Concurrency" },
      { upsert: true, new: true },
    );

    const joinsSubtopic = await Subtopic.findOneAndUpdate(
      { topicID: topic._id, name: "Joins" },
      { topicID: topic._id, name: "Joins" },
      { upsert: true, new: true },
    );

    // 3. Create 5 distinct questions across the subtopics
    const [qRec1, qRec2, qConc1, qConc2, qJoins1] = await Question.insertMany([
      {
        statement: "Recursion Q1: Factorial",
        topicID: topic._id,
        subtopicIDs: [recSubtopic._id],
        difficulty: "Easy",
        type: "Coding",
      },
      {
        statement: "Recursion Q2: Fibonacci",
        topicID: topic._id,
        subtopicIDs: [recSubtopic._id],
        difficulty: "Medium",
        type: "Coding",
      },
      {
        statement: "Concurrency Q1: Deadlocks",
        topicID: topic._id,
        subtopicIDs: [concSubtopic._id],
        difficulty: "Medium",
        type: "Theory",
      },
      {
        statement: "Concurrency Q2: Semaphores",
        topicID: topic._id,
        subtopicIDs: [concSubtopic._id],
        difficulty: "Hard",
        type: "Theory",
      },
      {
        statement: "Joins Q1: Inner vs Left Join",
        topicID: topic._id,
        subtopicIDs: [joinsSubtopic._id],
        difficulty: "Easy",
        type: "Theory",
      },
    ]);

    // Helper to generate timestamps relative to right now
    const hoursAgo = (hrs) => new Date(Date.now() - hrs * 60 * 60 * 1000);

    // 4. Insert 6 historical attempts to test FR-7 rules
    await Attempt.insertMany([
      // Joins Q1: Failed 72 hours ago, but SOLVED 24 hours ago (Should NOT count as missed!)
      {
        userID: user._id,
        questionID: qJoins1._id,
        status: "Attempted",
        createdAt: hoursAgo(72),
      },
      {
        userID: user._id,
        questionID: qJoins1._id,
        status: "Solved",
        createdAt: hoursAgo(24),
      },

      // Concurrency: 2 Missed questions (48 hours ago and 12 hours ago)
      {
        userID: user._id,
        questionID: qConc1._id,
        status: "Attempted",
        createdAt: hoursAgo(48),
      },
      {
        userID: user._id,
        questionID: qConc2._id,
        status: "Skipped",
        createdAt: hoursAgo(12),
      },

      // Recursion: 2 Missed questions (36 hours ago and 2 hours ago -> Most recent miss!)
      {
        userID: user._id,
        questionID: qRec1._id,
        status: "Attempted",
        createdAt: hoursAgo(36),
      },
      {
        userID: user._id,
        questionID: qRec2._id,
        status: "Skipped",
        createdAt: hoursAgo(2),
      },
    ]);

    console.log("\n✅ Seeded 6 mock attempts across 5 questions.");
    console.log(
      "Expected Winner: Recursion (Tied at 2 misses with Concurrency, but missed more recently)",
    );
    console.log(`Expected Subtopic ID: ${recSubtopic._id}\n`);

    // 5. Run the Diagnosis Engine
    const result = await diagnoseRootCause(user._id);
    console.log("🔍 Diagnosis Engine Output:", result);

    if (
      result.rootCauseSubtopicId &&
      result.rootCauseSubtopicId.toString() === recSubtopic._id.toString()
    ) {
      console.log(
        "🎉 SUCCESS! The pipeline accurately diagnosed the root-cause subtopic.",
      );
    } else {
      console.log("❌ MISMATCH! Check pipeline stages.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error running diagnosis seed:", error);
    process.exit(1);
  }
};

seedAndTestDiagnosis();
