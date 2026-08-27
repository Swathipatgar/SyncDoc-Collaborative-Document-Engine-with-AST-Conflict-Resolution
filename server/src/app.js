const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const versionRoutes = require("./routes/versionRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || false,
  })
);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
});
// 2 MiB accommodates sizeable technical documents while bounding JSON parsing.
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ message: "SyncDoc Backend is Running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api", versionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
