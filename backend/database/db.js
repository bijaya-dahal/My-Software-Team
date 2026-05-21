const mongoose = require("mongoose");

const connectDB = async () => {
    // Try local MongoDB first
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gymDB";
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.warn(`⚠  Local MongoDB not available (${error.message})`);
        console.log("   Starting in-memory MongoDB instead...");
    }

    // Fall back to in-memory MongoDB (no installation required)
    try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        const memServer = await MongoMemoryServer.create();
        const uri = memServer.getUri();
        await mongoose.connect(uri);
        console.log("✓ In-memory MongoDB started (data resets on server restart)");
        return true;
    } catch (err) {
        console.error(`✗ Could not start in-memory MongoDB: ${err.message}`);
        return false;
    }
};

module.exports = connectDB;
