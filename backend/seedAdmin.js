// Creates the first Admin (or promotes an existing user to Admin).
// It never deletes anything, so it is safe to run more than once.
//
// 1. Add to backend/.env (remove ADMIN_PASSWORD afterwards):
//      ADMIN_NAME=Your Name
//      ADMIN_EMAIL=you@example.com
//      ADMIN_PASSWORD=a-strong-password-of-8-or-more-characters
// 2. Run:  node seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const run = async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.",
    );
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === "Admin") {
      console.log("This user is already an Admin. Nothing to do.");
    } else {
      existing.role = "Admin";
      await existing.save();
      console.log("Existing user promoted to Admin.");
    }
  } else {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(ADMIN_PASSWORD, salt);
    await User.create({
      name: (ADMIN_NAME || "Admin").trim(),
      email,
      password,
      role: "Admin",
    });
    console.log("Admin created.");
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Could not create the Admin:", error.message);
  process.exit(1);
});