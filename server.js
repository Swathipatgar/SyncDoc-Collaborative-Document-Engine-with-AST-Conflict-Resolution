const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "SyncDoc Backend is Running",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});