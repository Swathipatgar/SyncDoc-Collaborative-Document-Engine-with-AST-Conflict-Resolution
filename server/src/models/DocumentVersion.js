const mongoose = require("mongoose");

const documentVersionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    changeSummary: {
      type: String,
      default: "",
    },
    diff: {
      type: String,
      default: "",
    },
    revision: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentVersion", documentVersionSchema);
