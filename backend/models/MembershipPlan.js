const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Plan name is required"],
        unique: true,
        trim: true,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
    },
    duration: {
        type: Number,
        required: [true, "Duration is required"],
    },
    description: {
        type: String,
        trim: true,
    },
    features: {
        type: [String],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("MembershipPlan", membershipPlanSchema);