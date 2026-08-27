const http = require("http");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { registerCollaborationSocket } = require("./websocket/collaboration");

dotenv.config();

const PORT = process.env.PORT || 5000;
const retryMongoConnection = () => {
  const retry = async () => {
    try {
      await connectDB();
      clearInterval(timer);
    } catch (error) {
      console.error("MongoDB remains unavailable; retrying persistence connection.");
    }
  };
  const timer = setInterval(retry, 30000);
  timer.unref();
};

const startServer = () => {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || false,
      methods: ["GET", "POST"],
    },
    // Socket event payloads, including Yjs updates, are capped at 2 MiB.
    maxHttpBufferSize: 2 * 1024 * 1024,
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
  server.on("error", (error) => console.error("HTTP server error:", error.message));

  connectDB().catch((error) => {
    console.error("MongoDB unavailable; continuing without persistence.");
    retryMongoConnection();
  });

  return { server, io };
};

if (require.main === module) startServer();

module.exports = { startServer };
