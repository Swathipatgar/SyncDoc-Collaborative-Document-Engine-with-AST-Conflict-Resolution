const { getDoc } = require("../services/yjsService");

const registerCollaborationSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-document", ({ documentId, userId }) => {
      if (!documentId) return;

      socket.join(documentId);
      socket.data.documentId = documentId;
      socket.data.userId = userId;

      socket.to(documentId).emit("user-joined", {
        userId,
        socketId: socket.id,
      });
    });

    socket.on("document-update", ({ documentId, content }) => {
      if (!documentId) return;

      const doc = getDoc(documentId);
      const yText = doc.getText("content");
      yText.delete(0, yText.length);
      yText.insert(0, content || "");

      socket.to(documentId).emit("document-sync", {
        documentId,
        content,
        updatedBy: socket.data.userId,
      });
    });

    socket.on("cursor-update", ({ documentId, cursor }) => {
      if (!documentId) return;
      socket.to(documentId).emit("cursor-sync", {
        socketId: socket.id,
        cursor,
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (socket.data.documentId) {
        socket.to(socket.data.documentId).emit("user-left", {
          socketId: socket.id,
          userId: socket.data.userId,
        });
      }
    });
  });
};

module.exports = { registerCollaborationSocket };
