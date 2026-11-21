const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// FR-1: Track failed logins per email (5 failed attempts in 10 minutes -> temporary block)
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Generate JWT token using .env expiry (defaults to 60m)
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "60m",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImageUrl } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // FR-1 Exception: Reject weak passwords
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      profileImageUrl,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error Occured",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const record = failedLoginAttempts.get(normalizedEmail);

    // Check FR-1 temporary lockout
    if (record) {
      if (now - record.firstAttemptAt > LOCK_WINDOW_MS) {
        failedLoginAttempts.delete(normalizedEmail);
      } else if (record.count >= MAX_FAILED_ATTEMPTS) {
        const retryMinutes = Math.ceil(
          (LOCK_WINDOW_MS - (now - record.firstAttemptAt)) / 60000,
        );
        return res.status(429).json({
          message: `Too many failed login attempts. Try again in ${retryMinutes} minute(s).`,
        });
      }
    }

    const recordFailure = () => {
      const current = failedLoginAttempts.get(normalizedEmail);
      if (!current || now - current.firstAttemptAt > LOCK_WINDOW_MS) {
        failedLoginAttempts.set(normalizedEmail, {
          count: 1,
          firstAttemptAt: now,
        });
      } else {
        current.count += 1;
      }
    };

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      recordFailure();
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailure();
      return res.status(401).json({ message: "Invalid Email or Password" });
    }

    // FR-11: an Admin has disabled this account
    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: "Account Disabled. Contact an administrator." });
    }

    // Clear failed attempts on successful login
    failedLoginAttempts.delete(normalizedEmail);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error Occured",
      error: error.message,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (Requires JWT)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Server Error Occured",
      error: error.message,
    });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };