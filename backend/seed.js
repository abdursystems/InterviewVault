require("dotenv").config();
const mongoose = require("mongoose");

// Import your defined Mongoose models
const Topic = require("./models/Topic");
const Subtopic = require("./models/Subtopic");
const Question = require("./models/Question");

const seedDatabase = async () => {
  try {
    // 1. Connect to Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // 2. Clear out existing data to prevent duplicate key errors on multiple runs
    await Topic.deleteMany();
    await Subtopic.deleteMany();
    await Question.deleteMany();
    console.log("Cleared old data.");

    // 3. Insert the 4 core Topics defined in your SRS
    const topicsData = await Topic.insertMany([
      { name: "DSA" },
      { name: "OOP" },
      { name: "DBMS" },
      { name: "OS" },
    ]);
    console.log("Topics seeded!");

    // Helper function to dynamically grab the generated ObjectIds
    const getTopicId = (name) => topicsData.find((t) => t.name === name)._id;

    // 4. Insert Sample Subtopics
    const subtopicsData = await Subtopic.insertMany([
      { topicID: getTopicId("DSA"), name: "Recursion" },
      { topicID: getTopicId("OOP"), name: "Polymorphism" },
      { topicID: getTopicId("DBMS"), name: "Joins" },
      { topicID: getTopicId("OS"), name: "Concurrency" },
    ]);
    console.log("Subtopics seeded!");

    const getSubtopicId = (name) =>
      subtopicsData.find((s) => s.name === name)._id;

    // 5. Insert Sample Questions (One Coding, One Theory)
    await Question.insertMany([
      {
        statement:
          "Write a function to return the nth Fibonacci number using recursion.",
        topicID: getTopicId("DSA"),
        subtopicIDs: [getSubtopicId("Recursion")],
        difficulty: "Medium",
        type: "Coding",
        testCases: [
          { input: "5", expectedOutput: "5", isHidden: false },
          { input: "10", expectedOutput: "55", isHidden: true },
        ],
      },
      {
        statement:
          "Explain the difference between an Inner Join and a Left Outer Join.",
        topicID: getTopicId("DBMS"),
        subtopicIDs: [getSubtopicId("Joins")],
        difficulty: "Easy",
        type: "Theory",
        modelAnswer:
          "An inner join returns only rows with a match in both tables. A left join returns all rows from the left table, plus matched rows.",
      },
    ]);
    console.log("Questions seeded successfully!");

    process.exit();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
