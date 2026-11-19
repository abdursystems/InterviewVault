const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Stores the passwordHash
    role: { type: String, enum: ["Student", "Admin"], default: "Student" },
    isActive: { type: Boolean, default: true },
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    profileImageUrl: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);