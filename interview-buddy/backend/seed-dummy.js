require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Topic = require("./models/Topic");
const Subtopic = require("./models/Subtopic");
const Question = require("./models/Question");

const seedDummyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Create a dummy User
    const user = await User.create({
      name: "Test Interviewee",
      email: `test${Date.now()}@example.com`, // Unique email per run
      password: "hashedpassword123",
      role: "Student",
    });

    // 2. Create Topic & Subtopic (Using Date.now() to avoid unique index collisions)
    const topic = await Topic.create({ name: `Python Alg ${Date.now()}` });
    const subtopic = await Subtopic.create({
      topicID: topic._id,
      name: `Recursion ${Date.now()}`,
    });

    // 3. Create the Fibonacci Coding Question
    const question = await Question.create({
      statement: "Write a function fib(n) to return the nth Fibonacci number.",
      topicID: topic._id,
      subtopicIDs: [subtopic._id],
      difficulty: "Easy",
      type: "Coding",
      testCases: [
        { input: "print(fib(5))", expectedOutput: "5", isHidden: "False" },
        { input: "print(fib(10))", expectedOutput: "55", isHidden: "True" },
      ],
    });

    console.log("\n✅ DUMMY DATA SEEDED SUCCESSFULLY!");
    console.log("=========================================");
    console.log(`userID: "${user._id}"`);
    console.log(`questionID: "${question._id}"`);
    console.log("=========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding dummy data:", error);
    process.exit(1);
  }
};

seedDummyData();
