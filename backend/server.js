const express = require("express");
const app = express();

const connectDB = require("./database/db");
connectDB();

app.use(express.json());

// ROUTES
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// START SERVER
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});