const { getDocumentVersions } = require("../services/versionService");
const { getDocumentAccess, isValidDocumentId } = require("../services/documentService");

const getVersions = async (req, res, next) => {
  try {
    if (!isValidDocumentId(req.params.id)) return res.status(400).json({ message: "Invalid document id" });
    const { document, access } = await getDocumentAccess(req.params.id, req.user.userId);
    if (!document) return res.status(404).json({ message: "Document not found" });
    if (!access?.canRead) return res.status(403).json({ message: "You do not have access to this document" });
    const versions = await getDocumentVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    next(error);
  }
};

module.exports = { getVersions };
