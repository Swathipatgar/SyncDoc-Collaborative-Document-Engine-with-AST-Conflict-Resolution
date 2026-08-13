const Y = require("yjs");

class YjsService {
  constructor() {
    this.docs = new Map();
  }

  getDoc(documentId) {
    if (!this.docs.has(documentId)) {
      this.docs.set(documentId, new Y.Doc());
    }

    return this.docs.get(documentId);
  }

  getText(documentId) {
    const doc = this.getDoc(documentId);
    const xmlText = doc.getText("content");
    return xmlText.toString();
  }

  updateText(documentId, content) {
    const doc = this.getDoc(documentId);
    const text = doc.getText("content");
    text.delete(0, text.length);
    text.insert(0, content || "");
  }
}

module.exports = new YjsService();
