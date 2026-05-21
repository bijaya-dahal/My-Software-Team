require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const connectDB          = require("./database/db");
const userRoutes         = require("./routes/userRoutes");
const membershipRoutes   = require("./routes/membershipRoutes");
const classRoutes        = require("./routes/classRoutes");
const trainerRoutes      = require("./routes/trainerRoutes");
const { seedDefaultPlans } = require("./controllers/membershipController");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users",       userRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/classes",     classRoutes);
app.use("/api/trainers",    trainerRoutes);

app.get("/", (req, res) => {
    res.json({ message: "GymApp API is running" });
});

const startServer = async () => {
    const connected = await connectDB();
    if (connected) {
        await seedDefaultPlans();
    } else {
        console.warn("⚠  Running without database — register/login will not work until MongoDB is started.");
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
