const Y = require("yjs");

class YjsService {
  constructor() {
    this.docs = new Map();
  }

  getDoc(documentId) {
    const normalizedDocumentId = this.normalizeDocumentId(documentId);
    if (!normalizedDocumentId) {
      return null;
    }

    if (!this.docs.has(normalizedDocumentId)) {
      this.docs.set(normalizedDocumentId, new Y.Doc());
    }

    return this.docs.get(normalizedDocumentId);
  }

  getText(documentId) {
    const doc = this.getDoc(documentId);
    if (!doc) return "";

    const text = doc.getText("content");
    return text.toString();
  }

  // Legacy REST/import replacement only. Real-time collaboration must use
  // applyUpdate() to retain Yjs CRDT semantics.
  updateText(documentId, content) {
    const doc = this.getDoc(documentId);
    if (!doc || typeof content !== "string") return null;

    const text = doc.getText("content");
    const nextContent = content;

    doc.transact(() => {
      if (text.length > 0) text.delete(0, text.length);
      text.insert(0, nextContent);
    }, "legacy-text-replacement");

    return nextContent;
  }

  encodeState(documentId) {
    const doc = this.getDoc(documentId);
    return doc ? Y.encodeStateAsUpdate(doc) : null;
  }

  applyUpdate(documentId, update) {
    const doc = this.getDoc(documentId);
    const encodedUpdate = this.normalizeUpdate(update);
    if (!doc || !encodedUpdate) return false;

    try {
      Y.applyUpdate(doc, encodedUpdate);
      return true;
    } catch (error) {
      return false;
    }
  }

  onUpdate(documentId, callback) {
    const doc = this.getDoc(documentId);
    if (!doc || typeof callback !== "function") return () => {};

    doc.on("update", callback);
    return () => doc.off("update", callback);
  }

  normalizeDocumentId(documentId) {
    if (typeof documentId !== "string" && typeof documentId !== "number") return null;

    const normalizedDocumentId = String(documentId).trim();
    return normalizedDocumentId || null;
  }

  normalizeUpdate(update) {
    if (update instanceof Uint8Array) return update;
    if (Buffer.isBuffer(update)) return new Uint8Array(update);
    if (update instanceof ArrayBuffer) return new Uint8Array(update);
    if (ArrayBuffer.isView(update)) {
      return new Uint8Array(update.buffer, update.byteOffset, update.byteLength);
    }

    return null;
  }
}

module.exports = new YjsService();
