require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("../database/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const membershipRoutes = require("./routes/membershipRoutes");
app.use("/api/memberships", membershipRoutes);

const classRoutes = require("./routes/classRoutes");
app.use("/api/classes", classRoutes);

const trainerRoutes = require("./routes/trainerRoutes");
app.use("/api/trainers", trainerRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "GymApp API is running" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});