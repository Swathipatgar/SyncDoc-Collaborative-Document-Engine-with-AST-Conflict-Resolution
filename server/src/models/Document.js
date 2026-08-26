const mongoose = require("mongoose");
const { validateAST } = require("../utils/ast");

const parseDocumentContent = (content) => {
  if (typeof content !== "string") {
    return content;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    contentFormat: {
      type: String,
      enum: ["plain-text", "ast-json"],
      default: "plain-text",
    },
    yjsState: {
      type: Buffer,
      default: null,
    },
    astVersion: {
      type: Number,
      default: 1,
    },
    lastPersistedAt: {
      type: Date,
      default: null,
    },
    persistenceStatus: {
      type: String,
      enum: ["clean", "pending", "degraded"],
      default: "clean",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        permission: {
          type: String,
          enum: ["read", "write"],
          default: "write",
        },
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    versionCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

documentSchema.pre("validate", function (next) {
  if (!this.content || this.content === "") {
    return next();
  }

  const parsedContent = parseDocumentContent(this.content);

  if (parsedContent == null || typeof parsedContent === "string") {
    return next();
  }

  if (!validateAST(parsedContent)) {
    return next(new Error("Document content must be a valid AST structure."));
  }

  next();
});

documentSchema.pre("save", function (next) {
  if (!this.content || this.content === "") {
    return next();
  }

  const parsedContent = parseDocumentContent(this.content);

  if (parsedContent == null || typeof parsedContent === "string") {
    return next();
  }

  if (!validateAST(parsedContent)) {
    return next(new Error("Document content must be a valid AST structure."));
  }

  next();
});

module.exports = mongoose.model("Document", documentSchema);
