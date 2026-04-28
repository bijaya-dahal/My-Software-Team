const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Class name is required"],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    instructor: {
        type: String,
        required: [true, "Instructor name is required"],
        trim: true,
    },
    date: {
        type: Date,
        required: [true, "Class date is required"],
    },
    startTime: {
        type: String,
        required: [true, "Start time is required"],
    },
    endTime: {
        type: String,
        required: [true, "End time is required"],
    },
    capacity: {
        type: Number,
        required: [true, "Capacity is required"],
    },
    registeredMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, ],
    location: {
        type: String,
        trim: true,
        default: "Main Hall",
    },
    category: {
        type: String,
        enum: ["Yoga", "Spinning", "Boxing", "Pilates", "HIIT", "Swimming", "Other"],
        default: "Other",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Class", classSchema);