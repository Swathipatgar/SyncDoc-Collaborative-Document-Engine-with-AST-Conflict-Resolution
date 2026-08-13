const { createDocument, getDocumentById, getUserDocuments, updateDocument } = require("../services/documentService");
const { createVersion } = require("../services/versionService");
const yjsService = require("../services/yjsService");
const { buildDiffSummary } = require("../utils/ast");

const createNewDocument = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Document title is required" });
    }

    const document = await createDocument({
      title,
      content: content || "",
      ownerId: req.user._id,
    });

    yjsService.updateText(document._id.toString(), document.content);

    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
};

const getAllDocuments = async (req, res, next) => {
  try {
    const documents = await getUserDocuments(req.user._id);
    res.json(documents);
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const document = await getDocumentById(req.params.id, req.user._id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    next(error);
  }
};

const updateDocumentContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    const document = await getDocumentById(req.params.id, req.user._id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const previousContent = document.content || "";
    const updatedDocument = await updateDocument(req.params.id, { content, lastEditedBy: req.user._id });

    const diff = buildDiffSummary(previousContent, content);
    await createVersion({
      documentId: req.params.id,
      userId: req.user._id,
      content,
      changeSummary: "Live document update",
      diff,
    });

    yjsService.updateText(req.params.id, content);

    res.json(updatedDocument);
  } catch (error) {
    next(error);
  }
};

const shareDocument = async (req, res, next) => {
  try {
    const { collaboratorId } = req.body;
    const document = await getDocumentById(req.params.id, req.user._id);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (!document.collaborators.includes(collaboratorId)) {
      document.collaborators.push(collaboratorId);
      await document.save();
    }

    res.json({ message: "Collaborator added successfully", document });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNewDocument,
  getAllDocuments,
  getDocument,
  updateDocumentContent,
  shareDocument,
};
