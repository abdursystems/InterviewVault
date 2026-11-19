const express = require("express");
const router = express.Router();
const { submitAttempt } = require("../controllers/attemptController");

// Route maps to POST /api/attempts when mounted in server.js
router.post("/", submitAttempt);

module.exports = router;
