const {
  createDocument,
  getDocumentById,
  getUserDocuments,
  getDocumentPersistenceState,
  persistDocumentState,
  getDocumentAccess,
  isValidDocumentId,
} = require("../services/documentService");
const User = require("../models/User");
const mongoose = require("mongoose");
const { createCheckpointVersion } = require("../services/versionService");
const yjsService = require("../services/yjsService");
const { buildDiffSummary, getContentProjection } = require("../utils/ast");

const createNewDocument = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Document title is required" });
    }
    if (content !== undefined && typeof content !== "string") {
      return res.status(400).json({ message: "Document content must be a string" });
    }

    const document = await createDocument({
      title: title.trim(),
      content: content || "",
      ownerId: req.user.userId,
    });

    const documentId = document._id.toString();
    yjsService.updateText(documentId, document.content);
    await persistDocumentState({
      documentId,
      yjsState: yjsService.encodeState(documentId),
      content: document.content,
      userId: req.user._id,
    });

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

const getAllDocuments = async (req, res, next) => {
  try {
    const documents = await getUserDocuments(req.user.userId);
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    if (!isValidDocumentId(req.params.id)) return res.status(400).json({ message: "Invalid document id" });
    const { document, access } = await getDocumentAccess(req.params.id, req.user.userId);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (!access?.canRead) return res.status(403).json({ message: "You do not have access to this document" });

    await document.populate([
      { path: "owner", select: "name email" },
      { path: "collaborators.user", select: "name email" },
    ]);
    res.json(document);
  } catch (error) {
    next(error);
  }
};

const updateDocumentContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!isValidDocumentId(req.params.id)) return res.status(400).json({ message: "Invalid document id" });
    if (typeof content !== "string") return res.status(400).json({ message: "Document content must be a string" });
    const { document, access } = await getDocumentAccess(req.params.id, req.user.userId);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (!access?.canWrite) return res.status(403).json({ message: "You do not have permission to edit this document" });

    const nextContent = content;
    getContentProjection(nextContent);
    const previousContent = document.content || "";

    await yjsService.ensureLoaded(req.params.id, () => getDocumentPersistenceState(req.params.id));
    yjsService.updateText(req.params.id, nextContent);
    const persisted = await persistDocumentState({
      documentId: req.params.id,
      yjsState: yjsService.encodeState(req.params.id),
      content: nextContent,
      userId: req.user._id,
    });

    if (!persisted) {
      return res.status(404).json({ message: "Document not found" });
    }

    await createCheckpointVersion({
      documentId: req.params.id,
      userId: req.user._id,
      content: persisted.content,
      contentFormat: persisted.contentFormat,
      changeSummary: "Live document update",
      diff: buildDiffSummary(previousContent, persisted.content),
    });

    res.json(persisted.document);
  } catch (error) {
    next(error);
  }
};

const shareDocument = async (req, res, next) => {
  try {
    const { collaboratorId, permission = "write" } = req.body || {};
    if (!isValidDocumentId(req.params.id) || !mongoose.isValidObjectId(collaboratorId)) {
      return res.status(400).json({ message: "A valid document and collaborator id are required" });
    }
    if (!(await User.exists({ _id: collaboratorId }))) return res.status(400).json({ message: "Collaborator not found" });
    if (!["read", "write"].includes(permission)) return res.status(400).json({ message: "Permission must be read or write" });
    const { document, access } = await getDocumentAccess(req.params.id, req.user.userId);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (!access?.canManage) return res.status(403).json({ message: "You do not have permission to manage collaborators" });
    if (document.owner.toString() === collaboratorId) return res.status(400).json({ message: "The owner is already a document member" });
    const existing = document.collaborators.find((entry) => (entry.user || entry).toString() === collaboratorId);
    if (existing) existing.permission = permission;
    else document.collaborators.push({ user: collaboratorId, permission });
    await document.save();

    res.json({ message: "Collaborator added successfully", document });
  } catch (error) {
    next(error);
  }
};

const removeCollaborator = async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    if (!isValidDocumentId(id) || !mongoose.isValidObjectId(collaboratorId)) return res.status(400).json({ message: "Invalid document or collaborator id" });
    const { document, access } = await getDocumentAccess(id, req.user.userId);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (!access?.canManage) return res.status(403).json({ message: "You do not have permission to manage collaborators" });
    document.collaborators = document.collaborators.filter((entry) => (entry.user || entry).toString() !== collaboratorId);
    await document.save();
    res.json({ message: "Collaborator removed successfully", document });
  } catch (error) { next(error); }
};

module.exports = {
  createNewDocument,
  getAllDocuments,
  getDocument,
  updateDocumentContent,
  shareDocument,
  removeCollaborator,
};
