const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

// Middleware to protect authenticated routes
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not Authorized, No Token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Not Authorized, User Not Found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token Failed or Expired",
      error: error.message,
    });
  }
};

// FR-11: Restrict Admin-only routes
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied: Admin privileges required" });
};

module.exports = { protect, adminOnly };
