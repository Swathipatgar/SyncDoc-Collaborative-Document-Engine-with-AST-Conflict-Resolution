const yjsService = require("../services/yjsService");

const registerCollaborationSocket = (io) => {
  const documentSubscriptions = new Map();
  const updateOrigins = new Map();
  // Map<documentId, Map<userId, PresenceEntry>>. `sockets` and
  // `editingSocketId` are server-only and never included in client payloads.
  const presenceByDocument = new Map();

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

  const getAuthenticatedUser = (socket) => {
    const userId = socket.data.user?.userId;
    if (typeof userId !== "string" && typeof userId !== "number") return null;

    const normalizedUserId = String(userId).trim();
    if (!normalizedUserId) return null;

    return {
      userId: normalizedUserId,
      name: typeof socket.data.user.name === "string" ? socket.data.user.name : undefined,
    };
  };

  const getPresenceDocument = (documentId, create = false) => {
    if (!presenceByDocument.has(documentId) && create) {
      presenceByDocument.set(documentId, new Map());
    }

    return presenceByDocument.get(documentId);
  };

  const publicPresence = (presence) => ({
    userId: presence.userId,
    ...(presence.name ? { name: presence.name } : {}),
    blockId: presence.blockId,
    status: presence.status,
    cursor: presence.cursor,
    lastSeen: presence.lastSeen,
  });

  const presenceSnapshot = (documentId) => {
    const users = getPresenceDocument(documentId);
    return {
      documentId,
      users: users ? [...users.values()].map(publicPresence) : [],
    };
  };

  const broadcastPresenceUpdate = (documentId, excludedSocketId) => {
    const target = excludedSocketId ? io.except(excludedSocketId).to(documentId) : io.to(documentId);
    target.emit("presence-update", presenceSnapshot(documentId));
  };

  const addSocketPresence = (documentId, socket) => {
    const user = getAuthenticatedUser(socket);
    if (!user) return null;

    const users = getPresenceDocument(documentId, true);
    let presence = users.get(user.userId);
    if (!presence) {
      presence = {
        ...user,
        blockId: null,
        status: "idle",
        cursor: null,
        lastSeen: Date.now(),
        sockets: new Set(),
        editingSocketId: null,
      };
      users.set(user.userId, presence);
    }

    presence.sockets.add(socket.id);
    presence.lastSeen = Date.now();
    return presence;
  };

  const removeSocketPresence = (documentId, socket) => {
    const user = getAuthenticatedUser(socket);
    const users = getPresenceDocument(documentId);
    if (!user || !users) return { removedUser: false, endedBlockId: null };

    const presence = users.get(user.userId);
    if (!presence) return { removedUser: false, endedBlockId: null };

    presence.sockets.delete(socket.id);
    const endedBlockId = presence.editingSocketId === socket.id ? presence.blockId : null;
    if (endedBlockId) {
      presence.blockId = null;
      presence.status = "idle";
      presence.editingSocketId = null;
      presence.lastSeen = Date.now();
    }

    if (presence.sockets.size === 0) {
      users.delete(user.userId);
      if (users.size === 0) presenceByDocument.delete(documentId);
      return { removedUser: true, endedBlockId };
    }

    return { removedUser: false, endedBlockId };
  };

  const normalizeJoinedDocumentId = (socket, documentId, action) => {
    const normalizedDocumentId =
      typeof documentId === "string" || typeof documentId === "number"
        ? String(documentId).trim()
        : null;

    if (!getAuthenticatedUser(socket)) {
      emitError(socket, "Authentication is required for collaboration.");
      return null;
    }

    if (!normalizedDocumentId || normalizedDocumentId !== socket.data.documentId) {
      emitError(socket, `Cannot ${action} for a document this socket has not joined.`);
      return null;
    }

    return normalizedDocumentId;
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
      if (!getAuthenticatedUser(socket)) {
        emitError(socket, "Authentication is required for collaboration.");
        return;
      }

      const doc = yjsService.getDoc(documentId);
      if (!doc) {
        emitError(socket, "A valid documentId is required to join collaboration.");
        return;
      }

      const normalizedDocumentId = String(documentId).trim();

      const previousDocumentId = socket.data.documentId;
      if (previousDocumentId && previousDocumentId !== normalizedDocumentId) {
        const { endedBlockId } = removeSocketPresence(previousDocumentId, socket);
        socket.leave(previousDocumentId);
        if (endedBlockId) {
          socket.to(previousDocumentId).emit("block-editing", {
            userId: getAuthenticatedUser(socket).userId,
            blockId: endedBlockId,
            status: "idle",
          });
        }
        socket.to(previousDocumentId).emit("user-left", {
          socketId: socket.id,
          userId: getAuthenticatedUser(socket).userId,
        });
        broadcastPresenceUpdate(previousDocumentId);
        removeDocumentSubscriptionIfUnused(previousDocumentId);
      }

      socket.join(normalizedDocumentId);
      socket.data.documentId = normalizedDocumentId;
      ensureDocumentSubscription(normalizedDocumentId);
      addSocketPresence(normalizedDocumentId, socket);

      socket.emit("yjs-sync", {
        documentId: normalizedDocumentId,
        update: Buffer.from(yjsService.encodeState(normalizedDocumentId)),
      });

      socket.to(normalizedDocumentId).emit("user-joined", {
        userId: getAuthenticatedUser(socket).userId,
        socketId: socket.id,
      });
      socket.emit("presence-sync", presenceSnapshot(normalizedDocumentId));
      broadcastPresenceUpdate(normalizedDocumentId, socket.id);
    });

    socket.on("yjs-update", (payload = {}) => {
      const { documentId, update } = payload || {};
      const normalizedDocumentId = normalizeJoinedDocumentId(socket, documentId, "update");
      if (!normalizedDocumentId) return;

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
      const normalizedDocumentId = normalizeJoinedDocumentId(socket, documentId, "update a cursor");
      if (!normalizedDocumentId) return;

      const user = getAuthenticatedUser(socket);
      const presence = getPresenceDocument(normalizedDocumentId)?.get(user.userId);
      if (presence) {
        presence.cursor = cursor;
        presence.lastSeen = Date.now();
      }

      socket.to(normalizedDocumentId).emit("cursor-sync", {
        socketId: socket.id,
        userId: user.userId,
        cursor,
      });
    });

    socket.on("block-edit-start", (payload = {}) => {
      const { documentId, blockId } = payload || {};
      const normalizedDocumentId = normalizeJoinedDocumentId(socket, documentId, "edit a block");
      const normalizedBlockId =
        typeof blockId === "string" || typeof blockId === "number" ? String(blockId).trim() : null;
      if (!normalizedDocumentId) return;
      if (!normalizedBlockId) {
        emitError(socket, "A valid blockId is required to start editing.");
        return;
      }

      const user = getAuthenticatedUser(socket);
      const presence = getPresenceDocument(normalizedDocumentId)?.get(user.userId);
      if (!presence) {
        emitError(socket, "Join a document before editing a block.");
        return;
      }

      presence.blockId = normalizedBlockId;
      presence.status = "editing";
      presence.editingSocketId = socket.id;
      presence.lastSeen = Date.now();
      socket.to(normalizedDocumentId).emit("block-editing", {
        userId: user.userId,
        blockId: normalizedBlockId,
        status: "editing",
      });
      broadcastPresenceUpdate(normalizedDocumentId, socket.id);
    });

    socket.on("block-edit-end", (payload = {}) => {
      const { documentId, blockId } = payload || {};
      const normalizedDocumentId = normalizeJoinedDocumentId(socket, documentId, "stop editing a block");
      const normalizedBlockId =
        typeof blockId === "string" || typeof blockId === "number" ? String(blockId).trim() : null;
      if (!normalizedDocumentId) return;
      if (!normalizedBlockId) {
        emitError(socket, "A valid blockId is required to stop editing.");
        return;
      }

      const user = getAuthenticatedUser(socket);
      const presence = getPresenceDocument(normalizedDocumentId)?.get(user.userId);
      if (!presence || presence.editingSocketId !== socket.id || presence.blockId !== normalizedBlockId) return;

      presence.blockId = null;
      presence.status = "idle";
      presence.editingSocketId = null;
      presence.lastSeen = Date.now();
      socket.to(normalizedDocumentId).emit("block-editing", {
        userId: user.userId,
        blockId: normalizedBlockId,
        status: "idle",
      });
      broadcastPresenceUpdate(normalizedDocumentId, socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (socket.data.documentId) {
        const documentId = socket.data.documentId;
        const user = getAuthenticatedUser(socket);
        const { endedBlockId } = removeSocketPresence(documentId, socket);
        if (endedBlockId && user) {
          socket.to(documentId).emit("block-editing", {
            userId: user.userId,
            blockId: endedBlockId,
            status: "idle",
          });
        }
        socket.to(socket.data.documentId).emit("user-left", {
          socketId: socket.id,
          userId: user?.userId,
        });
        broadcastPresenceUpdate(documentId);
        removeDocumentSubscriptionIfUnused(documentId);
      }
    });
  });
};

module.exports = { registerCollaborationSocket };
