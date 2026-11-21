const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Stores the passwordHash
    role: { type: String, enum: ["Student", "Admin"], default: "Student" },
    isActive: { type: Boolean, default: true }, // an Admin can disable an account (FR-11)
    profileImageUrl: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);