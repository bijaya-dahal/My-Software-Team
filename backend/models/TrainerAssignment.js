const mongoose = require("mongoose");

const trainerAssignmentSchema = new mongoose.Schema({
    trainer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true,
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    hoursWorked: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ["assigned", "completed", "cancelled"],
        default: "assigned",
    },
    notes: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("TrainerAssignment", trainerAssignmentSchema);