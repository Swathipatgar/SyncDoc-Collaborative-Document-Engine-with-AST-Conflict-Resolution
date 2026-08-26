const Document = require("../models/Document");
const mongoose = require("mongoose");
const { getContentProjection } = require("../utils/ast");

const createDocument = async ({ title, ownerId, content = "" }) => {
  const document = await Document.create({
    title,
    content,
    owner: ownerId,
    collaborators: [],
  });

  return document;
};

const isValidDocumentId = (documentId) => mongoose.isValidObjectId(documentId);

const getDocumentAccess = async (documentId, userId) => {
  if (!isValidDocumentId(documentId) || !mongoose.isValidObjectId(userId)) {
    return { document: null, access: null, invalidId: true };
  }

  const document = await Document.findById(documentId);
  if (!document) return { document: null, access: null, invalidId: false };

  if (document.owner.toString() === String(userId)) {
    return { document, access: { role: "owner", canRead: true, canWrite: true, canManage: true } };
  }

  // ObjectId entries are supported for documents created before permission
  // metadata existed; they retain the previous write-collaborator behavior.
  const member = document.collaborators.find((entry) => {
    const memberId = entry && (entry.user || entry);
    return memberId && memberId.toString() === String(userId);
  });
  if (member) {
    const permission = member.permission || "write";
    return {
      document,
      access: { role: "collaborator", canRead: true, canWrite: permission === "write", canManage: false },
    };
  }

  if (document.isPublic) {
    return { document, access: { role: "viewer", canRead: true, canWrite: false, canManage: false } };
  }

  return { document, access: null, invalidId: false };
};

const getDocumentById = async (documentId, userId) => {
  const { document, access } = await getDocumentAccess(documentId, userId);
  if (!document || !access?.canRead) return null;
  return document.populate([
    { path: "owner", select: "name email" },
    { path: "collaborators.user", select: "name email" },
  ]);
};

const getUserDocuments = async (userId) => {
  return Document.find({
    $or: [{ owner: userId }, { collaborators: userId }, { "collaborators.user": userId }],
  }).populate("owner", "name email").populate("collaborators.user", "name email");
};

const updateDocument = async (documentId, updates) => {
  const document = await Document.findById(documentId);

  if (!document) {
    return null;
  }

  Object.assign(document, updates);
  await document.save();

  return document;
};

const getDocumentPersistenceState = async (documentId) => {
  const document = await Document.findById(documentId).select("content contentFormat yjsState").lean();
  if (!document) return null;

  return document;
};

const persistDocumentState = async ({ documentId, yjsState, content, userId }) => {
  if (!Buffer.isBuffer(yjsState) && !(yjsState instanceof Uint8Array)) {
    throw new Error("A binary Yjs state is required for persistence.");
  }

  const projection = getContentProjection(content);
  const updates = {
    content: projection.content,
    contentFormat: projection.contentFormat,
    astVersion: 1,
    yjsState: Buffer.from(yjsState),
    lastPersistedAt: new Date(),
    persistenceStatus: "clean",
  };

  if (userId) updates.lastEditedBy = userId;

  const document = await Document.findByIdAndUpdate(documentId, updates, {
    new: true,
    runValidators: true,
  });

  return document ? { document, ...projection } : null;
};

module.exports = {
  createDocument,
  isValidDocumentId,
  getDocumentAccess,
  getDocumentById,
  getUserDocuments,
  updateDocument,
  getDocumentPersistenceState,
  persistDocumentState,
};
