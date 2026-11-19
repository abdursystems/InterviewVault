use("interviewvault");

db.getCollection("questions").insertOne({
  type: "Coding",
  title: "Add Two Numbers",
  subtopicIDs: [ObjectId("654c1a2b3c4d5e6f7a8b9c01")], // Valid 24-character hex string
  testCases: [
    { input: "print(add(1, 2))", expectedOutput: "3" },
    { input: "print(add(-1, 5))", expectedOutput: "4" },
  ],
});

// Fetch the generated Question ID
db.getCollection("questions").find({ title: "Add Two Numbers" });
