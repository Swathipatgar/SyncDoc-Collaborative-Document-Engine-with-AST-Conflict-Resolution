const Document = require("../models/Document");

const createDocument = async ({ title, ownerId, content = "" }) => {
  const document = await Document.create({
    title,
    content,
    owner: ownerId,
    collaborators: [ownerId],
  });

  return document;
};

const getDocumentById = async (documentId, userId) => {
  const document = await Document.findOne({
    _id: documentId,
    $or: [{ owner: userId }, { collaborators: userId }, { isPublic: true }],
  }).populate("owner", "name email").populate("collaborators", "name email");

  return document;
};

const getUserDocuments = async (userId) => {
  return Document.find({
    $or: [{ owner: userId }, { collaborators: userId }],
  }).populate("owner", "name email");
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

module.exports = {
  createDocument,
  getDocumentById,
  getUserDocuments,
  updateDocument,
};
