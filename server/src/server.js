const http = require("http");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { registerCollaborationSocket } = require("./websocket/collaboration");

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = () => {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const authHeader = socket.handshake.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = socket.handshake.auth?.token || bearerToken;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  registerCollaborationSocket(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  connectDB().catch((error) => {
    console.error("MongoDB unavailable; continuing without persistence:", error.message);
  });
};

startServer();
