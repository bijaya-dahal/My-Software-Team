const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    member: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MembershipPlan",
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "expired", "cancelled"],
        default: "active",
    },
    amountPaid: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "card", "online"],
        default: "cash",
    },
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);