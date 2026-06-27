const express = require("express");
const cors = require("cors");

require("dotenv").config();

console.log("========== ENV CHECK ==========");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "Loaded ✅" : "Missing ❌"
);
console.log("===============================");

require("./config/db");

const trainerRoutes = require("./routes/trainerroutes");
const membershipPlanRoutes = require("./routes/membershipplanroutes");
const paymentRoutes = require("./routes/paymentroutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/trainers", trainerRoutes);
app.use("/api/membership-plans", membershipPlanRoutes);
app.use("/api/payments", paymentRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Gym Management System Backend is Running 🚀");
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

server.on("error", (err) => {
  console.error("Server Error:", err);
});