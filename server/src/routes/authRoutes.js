const express = require("express");

const {
  register,
  login,
  getMe,
  getAllUsers,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Current user
router.get("/me", protect, getMe);

// List users for sharing
router.get("/users", protect, getAllUsers);

module.exports = router;
