const mongoose = require("mongoose");

const collaborationSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    socketId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "idle", "disconnected"],
      default: "active",
    },
    cursor: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Collaboration", collaborationSchema);
