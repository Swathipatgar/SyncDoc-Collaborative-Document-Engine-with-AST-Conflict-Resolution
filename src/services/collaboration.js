import { io } from "socket.io-client";
import * as Y from "yjs";

export class CollaborationSession {
  constructor({ documentId, token, onSync, onPresence, onBlockLock, onStatusChange }) {
    this.documentId = String(documentId);
    this.token = token;
    this.onSync = onSync || (() => {});
    this.onPresence = onPresence || (() => {});
    this.onBlockLock = onBlockLock || (() => {});
    this.onStatusChange = onStatusChange || (() => {});

    this.doc = new Y.Doc();
    this.yText = this.doc.getText("content");
    this.socket = null;
    this.isApplyingRemote = false;

    this.init();
  }

  init() {
    this.onStatusChange("connecting");

    // Connect to backend Socket.IO
    this.socket = io({
      auth: { token: this.token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this.onStatusChange("connected");
      this.socket.emit("join-document", { documentId: this.documentId });
    });

    this.socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
      this.onStatusChange("disconnected");
    });

    this.socket.on("disconnect", () => {
      this.onStatusChange("disconnected");
    });

    // Listen to initial Yjs sync from server
    this.socket.on("yjs-sync", (data) => {
      if (data && data.update) {
        try {
          this.isApplyingRemote = true;
          const update = new Uint8Array(data.update);
          Y.applyUpdate(this.doc, update);
          this.onSync(this.yText.toString());
        } catch (e) {
          console.error("Failed to apply yjs-sync:", e);
        } finally {
          this.isApplyingRemote = false;
        }
      }
    });

    // Listen to incremental binary Yjs updates from peer collaborators
    this.socket.on("yjs-update", (data) => {
      if (data && data.update && String(data.documentId) === this.documentId) {
        try {
          this.isApplyingRemote = true;
          const update = new Uint8Array(data.update);
          Y.applyUpdate(this.doc, update);
          this.onSync(this.yText.toString());
        } catch (e) {
          console.error("Failed to apply yjs-update:", e);
        } finally {
          this.isApplyingRemote = false;
        }
      }
    });

    // Listen to presence snapshots
    this.socket.on("presence-sync", (data) => {
      if (data && Array.isArray(data.users)) {
        this.onPresence(data.users);
      }
    });

    this.socket.on("presence-update", (data) => {
      if (data && Array.isArray(data.users)) {
        this.onPresence(data.users);
      }
    });

    // Listen to live visual block locking / editing events
    this.socket.on("block-editing", (payload) => {
      if (payload && payload.blockId) {
        this.onBlockLock(payload);
      }
    });

    // Listen to local Yjs doc changes and send binary update to server
    this.doc.on("update", (update, origin) => {
      if (this.isApplyingRemote || origin === "remote") return;

      if (this.socket && this.socket.connected) {
        this.socket.emit("yjs-update", {
          documentId: this.documentId,
          update: update,
        });
      }
    });
  }

  // Update document content locally in Y.Doc (CRDT transaction)
  updateText(newContent) {
    if (this.isApplyingRemote) return;
    const current = this.yText.toString();
    if (current === newContent) return;

    this.doc.transact(() => {
      if (this.yText.length > 0) {
        this.yText.delete(0, this.yText.length);
      }
      this.yText.insert(0, newContent);
    }, "local-change");
  }

  // Start editing a block (visual lock notification to peers)
  startBlockEdit(blockId) {
    if (this.socket && this.socket.connected && blockId) {
      this.socket.emit("block-edit-start", {
        documentId: this.documentId,
        blockId: String(blockId),
      });
    }
  }

  // Stop editing a block (release visual lock)
  endBlockEdit(blockId) {
    if (this.socket && this.socket.connected && blockId) {
      this.socket.emit("block-edit-end", {
        documentId: this.documentId,
        blockId: String(blockId),
      });
    }
  }

  // Cursor position broadcast
  updateCursor(cursorData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("cursor-update", {
        documentId: this.documentId,
        cursor: cursorData,
      });
    }
  }

  // Teardown
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.doc.destroy();
  }
}
