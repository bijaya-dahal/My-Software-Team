const MembershipPlan = require("../models/MembershipPlan");
const Subscription = require("../models/Subscription");

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

const getAllPlans = async(req, res) => {
    try {
        const plans = await MembershipPlan.find({ isActive: true });
        res.status(200).json({ plans });
    } catch (error) {
        console.error("Get plans error:", error.message);
        res.status(500).json({ message: "Server error fetching plans" });
    }
};

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

const renewSubscription = async(req, res) => {
    try {
        const { planId, paymentMethod, subscriptionId } = req.body;

        const planToUse = planId ? await MembershipPlan.findById(planId) : null;

        let sub = subscriptionId ? await Subscription.findById(subscriptionId) : null;
        if (!sub) {
            sub = await Subscription.findOne({ member: req.user.id, status: "active" });
        }

        const plan = planToUse || (sub ? await MembershipPlan.findById(sub.plan) : null);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        if (sub) {
            sub.status = "expired";
            await sub.save();
        }

        const newSub = await Subscription.create({
            member: req.user.id,
            plan: plan._id,
            startDate,
            endDate,
            amountPaid: plan.price,
            paymentMethod: paymentMethod || "cash",
        });

        const populated = await newSub.populate("plan");

        res.status(201).json({ message: "Membership renewed successfully", subscription: populated });
    } catch (error) {
        console.error("Renew error:", error.message);
        res.status(500).json({ message: "Server error renewing subscription" });
    }
};

const getPaymentHistory = async(req, res) => {
    try {
        const payments = await Subscription.find({ member: req.user.id })
            .populate("plan", "name price duration")
            .sort({ createdAt: -1 });

        const history = payments.map((s) => ({
            _id: s._id,
            plan: s.plan,
            amount: s.amountPaid,
            paymentMethod: s.paymentMethod,
            status: s.status,
            startDate: s.startDate,
            date: s.createdAt,
        }));

        res.status(200).json({ payments: history });
    } catch (error) {
        console.error("Payment history error:", error.message);
        res.status(500).json({ message: "Server error fetching payment history" });
    }
};

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
    renewSubscription,
    getPaymentHistory,
    getAllSubscriptions,
};