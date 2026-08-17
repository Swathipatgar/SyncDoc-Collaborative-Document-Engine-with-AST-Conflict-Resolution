const yjsService = require("../services/yjsService");

const registerCollaborationSocket = (io) => {
  const documentSubscriptions = new Map();
  const updateOrigins = new Map();

  const emitError = (socket, message) => {
    socket.emit("collaboration-error", { message });
  };

  const toUint8Array = (update) => {
    if (update instanceof Uint8Array) return update;
    if (Buffer.isBuffer(update)) return new Uint8Array(update);
    if (update instanceof ArrayBuffer) return new Uint8Array(update);
    if (ArrayBuffer.isView(update)) {
      return new Uint8Array(update.buffer, update.byteOffset, update.byteLength);
    }

    return null;
  };

  const ensureDocumentSubscription = (documentId) => {
    if (documentSubscriptions.has(documentId)) return;

    const unsubscribe = yjsService.onUpdate(documentId, (update) => {
      const sourceSocketId = updateOrigins.get(documentId);
      const target = sourceSocketId ? io.except(sourceSocketId).to(documentId) : io.to(documentId);

      target.emit("yjs-update", {
        documentId,
        update: Buffer.from(update),
      });

      if (sourceSocketId) {
        updateOrigins.delete(documentId);
      }
    });

    documentSubscriptions.set(documentId, unsubscribe);
  };

  const removeDocumentSubscriptionIfUnused = (documentId) => {
    const room = io.sockets.adapter.rooms.get(documentId);
    if (room && room.size > 0) return;

    const unsubscribe = documentSubscriptions.get(documentId);
    if (unsubscribe) unsubscribe();
    documentSubscriptions.delete(documentId);
    updateOrigins.delete(documentId);
  };

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-document", (payload = {}) => {
      const { documentId } = payload || {};
      const doc = yjsService.getDoc(documentId);
      if (!doc) {
        emitError(socket, "A valid documentId is required to join collaboration.");
        return;
      }

      const normalizedDocumentId = String(documentId).trim();

      const previousDocumentId = socket.data.documentId;
      if (previousDocumentId && previousDocumentId !== normalizedDocumentId) {
        socket.leave(previousDocumentId);
        socket.to(previousDocumentId).emit("user-left", {
          socketId: socket.id,
          userId: socket.data.user.userId,
        });
        removeDocumentSubscriptionIfUnused(previousDocumentId);
      }

      socket.join(normalizedDocumentId);
      socket.data.documentId = normalizedDocumentId;
      ensureDocumentSubscription(normalizedDocumentId);

      socket.emit("yjs-sync", {
        documentId: normalizedDocumentId,
        update: Buffer.from(yjsService.encodeState(normalizedDocumentId)),
      });

      socket.to(normalizedDocumentId).emit("user-joined", {
        userId: socket.data.user.userId,
        socketId: socket.id,
      });
    });

    socket.on("yjs-update", (payload = {}) => {
      const { documentId, update } = payload || {};
      if (!socket.data.documentId) {
        emitError(socket, "Join a document before sending collaboration updates.");
        return;
      }

      const normalizedDocumentId =
        typeof documentId === "string" || typeof documentId === "number"
          ? String(documentId).trim()
          : null;

      if (!normalizedDocumentId || normalizedDocumentId !== socket.data.documentId) {
        emitError(socket, "Cannot update a document that this socket has not joined.");
        return;
      }

      const encodedUpdate = toUint8Array(update);
      if (!encodedUpdate) {
        emitError(socket, "Collaboration update must be a binary Yjs payload.");
        return;
      }

      // Yjs emits synchronously from applyUpdate(). Track this origin so the
      // shared update listener broadcasts once, to peers only.
      updateOrigins.set(normalizedDocumentId, socket.id);
      const applied = yjsService.applyUpdate(normalizedDocumentId, encodedUpdate);

      if (!applied) {
        updateOrigins.delete(normalizedDocumentId);
        emitError(socket, "Invalid Yjs collaboration update.");
      } else if (updateOrigins.get(normalizedDocumentId) === socket.id) {
        // Applying a duplicate Yjs update produces no Y.Doc update event.
        updateOrigins.delete(normalizedDocumentId);
      }
    });

    socket.on("cursor-update", (payload = {}) => {
      const { documentId, cursor } = payload || {};
      if (documentId !== socket.data.documentId) {
        emitError(socket, "Cannot update a cursor for a document this socket has not joined.");
        return;
      }

      socket.to(socket.data.documentId).emit("cursor-sync", {
        socketId: socket.id,
        userId: socket.data.user.userId,
        cursor,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (socket.data.documentId) {
        socket.to(socket.data.documentId).emit("user-left", {
          socketId: socket.id,
          userId: socket.data.user.userId,
        });
        removeDocumentSubscriptionIfUnused(socket.data.documentId);
      }
    });
  });
};

module.exports = { registerCollaborationSocket };
