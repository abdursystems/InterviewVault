const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware.js");
const admin = require("../controllers/adminController.js");

const router = express.Router();

// Every route in this file needs a valid login AND the Admin role (SEC-3 / FR-11)
router.use(protect, adminOnly);

// Topics (read only, for the admin forms)
router.get("/topics", admin.listTopics);

// Subtopics (FR-5)
router.get("/subtopics", admin.listSubtopics);
router.post("/subtopics", admin.createSubtopic);
router.put("/subtopics/:id", admin.updateSubtopic);
router.delete("/subtopics/:id", admin.deleteSubtopic);

// Questions (FR-11)
router.get("/questions", admin.listQuestions);
router.get("/questions/:id", admin.getQuestion);
router.post("/questions", admin.createQuestion);
router.put("/questions/:id", admin.updateQuestion);
router.delete("/questions/:id", admin.deleteQuestion);
router.post("/questions/:id/restore", admin.restoreQuestion);

// Users (FR-11)
router.get("/users", admin.listUsers);
router.put("/users/:id/role", admin.updateUserRole);
router.put("/users/:id/active", admin.setUserActive);
router.delete("/users/:id", admin.deleteUser);

module.exports = router;
