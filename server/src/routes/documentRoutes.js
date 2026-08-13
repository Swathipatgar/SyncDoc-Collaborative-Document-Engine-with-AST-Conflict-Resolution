const express = require("express");
const {
  createNewDocument,
  getAllDocuments,
  getDocument,
  updateDocumentContent,
  shareDocument,
} = require("../controllers/documentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(protect, getAllDocuments).post(protect, createNewDocument);
router.route("/:id").get(protect, getDocument).put(protect, updateDocumentContent);
router.post("/:id/share", protect, shareDocument);

module.exports = router;
