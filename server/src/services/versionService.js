const DocumentVersion = require("../models/DocumentVersion");
const Document = require("../models/Document");

const createVersion = async ({ documentId, userId, content, changeSummary, diff }) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  const revision = (document.versionCount || 0) + 1;

  const version = await DocumentVersion.create({
    document: documentId,
    createdBy: userId,
    content,
    changeSummary: changeSummary || "Updated document",
    diff: diff || "",
    revision,
  });

  document.versionCount = revision;
  document.content = content;
  document.lastEditedBy = userId;
  await document.save();

  return version;
};

const getDocumentVersions = async (documentId) => {
  return DocumentVersion.find({ document: documentId }).sort({ createdAt: -1 });
};

module.exports = {
  createVersion,
  getDocumentVersions,
};
