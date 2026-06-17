const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/db");
const app = express();
const trainerRoutes = require("./routes/trainerRoutes");
// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/trainers", trainerRoutes);
// Test Route
app.get("/", (req, res) => {
  res.send("Gym Management System Backend is Running 🚀");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

server.on('error', (err) => {
  console.error('Server Error:', err);
});