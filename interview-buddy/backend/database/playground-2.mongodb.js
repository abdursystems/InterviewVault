use('interviewvault');

// Insert multiple dummy users
db.getCollection('users').insertMany([
  {
    name: "Ahmed Shayan",
    email: "ahmed.shayan@example.com",
    password: "$2b$10$dummyhashedpasswordstring1234567890",
    role: "candidate",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Sara Khan",
    email: "sara.khan@example.com",
    password: "$2b$10$dummyhashedpasswordstring0987654321",
    role: "candidate",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Bilal Raza",
    email: "bilal.raza@example.com",
    password: "$2b$10$dummyhashedpasswordstring1122334455",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Fetch all users to view and copy their generated _id strings
db.getCollection('users').find({});