const mongoose = require("mongoose");

const seedPlans = async() => {
    const MembershipPlan = require("../models/MembershipPlan");
    const count = await MembershipPlan.countDocuments();
    if (count > 0) return;

    await MembershipPlan.insertMany([
        { name: "Basic", price: 25, duration: 30, description: "Perfect for getting started", features: ["Gym Access", "Locker Room", "Free WiFi"] },
        { name: "Premium", price: 45, duration: 30, description: "Most popular choice", features: ["Gym Access", "All Classes", "Locker Room", "Personal Trainer (1/month)", "Free WiFi"] },
        { name: "VIP", price: 75, duration: 30, description: "The ultimate fitness experience", features: ["Gym Access", "All Classes", "Locker Room", "Personal Trainer (4/month)", "Nutrition Advice", "Priority Booking", "Free WiFi"] },
    ]);
    console.log("Default membership plans seeded");
};

const connectDB = async() => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/gymDB";
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        await seedPlans();
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;