const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gymDB";
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error(`✗ MongoDB connection failed: ${error.message}`);
        console.error("  Make sure MongoDB is running: net start MongoDB");
        return false;
    }
};

module.exports = connectDB;
