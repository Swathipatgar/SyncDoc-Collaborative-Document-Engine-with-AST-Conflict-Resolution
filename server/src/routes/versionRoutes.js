const express = require("express");
const { getVersions } = require("../controllers/versionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/documents/:id/versions", protect, getVersions);

module.exports = router;
