const MembershipPlan = require("../models/MembershipPlan");
const Subscription = require("../models/Subscription");

// @route  POST /api/memberships/plans
// @access Private - Staff/Admin only
const createPlan = async(req, res) => {
    try {
        const { name, price, duration, description, features } = req.body;

        if (!name || !price || !duration) {
            return res.status(400).json({ message: "Name, price and duration are required" });
        }

        const existingPlan = await MembershipPlan.findOne({ name });
        if (existingPlan) {
            return res.status(400).json({ message: "Plan already exists" });
        }

        const plan = await MembershipPlan.create({
            name,
            price,
            duration,
            description,
            features,
        });

        res.status(201).json({ message: "Plan created successfully", plan });
    } catch (error) {
        console.error("Create plan error:", error.message);
        res.status(500).json({ message: "Server error creating plan" });
    }
};

// @route  GET /api/memberships/plans
// @access Public
const getAllPlans = async(req, res) => {
    try {
        const plans = await MembershipPlan.find({ isActive: true });
        res.status(200).json({ plans });
    } catch (error) {
        console.error("Get plans error:", error.message);
        res.status(500).json({ message: "Server error fetching plans" });
    }
};

// @route  POST /api/memberships/subscribe
// @access Private - Member
const subscribeToPlan = async(req, res) => {
    try {
        const { planId, paymentMethod } = req.body;

        if (!planId) {
            return res.status(400).json({ message: "Plan ID is required" });
        }

        const plan = await MembershipPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        // Check if member already has active subscription
        const existingSubscription = await Subscription.findOne({
            member: req.user.id,
            status: "active",
        });
        if (existingSubscription) {
            return res.status(400).json({ message: "You already have an active subscription" });
        }

        // Calculate end date based on plan duration
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        const subscription = await Subscription.create({
            member: req.user.id,
            plan: plan._id,
            startDate,
            endDate,
            amountPaid: plan.price,
            paymentMethod: paymentMethod || "cash",
        });

        res.status(201).json({
            message: "Subscribed successfully",
            subscription,
        });
    } catch (error) {
        console.error("Subscribe error:", error.message);
        res.status(500).json({ message: "Server error subscribing to plan" });
    }
};

// @route  GET /api/memberships/my-subscription
// @access Private - Member
const getMySubscription = async(req, res) => {
    try {
        const subscription = await Subscription.findOne({
            member: req.user.id,
            status: "active",
        }).populate("plan");

        if (!subscription) {
            return res.status(404).json({ message: "No active subscription found" });
        }

        res.status(200).json({ subscription });
    } catch (error) {
        console.error("Get subscription error:", error.message);
        res.status(500).json({ message: "Server error fetching subscription" });
    }
};

// @route  GET /api/memberships/all-subscriptions
// @access Private - Staff/Admin only
const getAllSubscriptions = async(req, res) => {
    try {
        const subscriptions = await Subscription.find()
            .populate("member", "name email phone")
            .populate("plan", "name price duration");

        res.status(200).json({ subscriptions });
    } catch (error) {
        console.error("Get all subscriptions error:", error.message);
        res.status(500).json({ message: "Server error fetching subscriptions" });
    }
};

module.exports = {
    createPlan,
    getAllPlans,
    subscribeToPlan,
    getMySubscription,
    getAllSubscriptions,
};