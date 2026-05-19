const MembershipPlan = require("../models/MembershipPlan");
const Subscription   = require("../models/Subscription");

const seedDefaultPlans = async () => {
    const count = await MembershipPlan.countDocuments();
    if (count === 0) {
        await MembershipPlan.insertMany([
            {
                name: "Basic", price: 12.99, duration: 30,
                description: "Basic gym access",
                features: ["Gym floor access", "2 group classes/month", "Member dashboard"]
            },
            {
                name: "Premium", price: 24.99, duration: 30,
                description: "Premium membership",
                features: ["Gym floor access", "Unlimited group classes", "Member dashboard", "2 PT sessions/month"]
            },
            {
                name: "Elite", price: 49.99, duration: 30,
                description: "Elite membership",
                features: ["Gym floor access", "Unlimited group classes", "Member dashboard", "Unlimited PT sessions", "Priority booking"]
            },
        ]);
        console.log("✓ Default membership plans seeded");
    }
};

const createPlan = async(req, res) => {
    try {
        const { name, price, duration, description, features } = req.body;
        if (!name || !price || !duration) {
            return res.status(400).json({ message: "Name, price and duration are required" });
        }
        const plan = await MembershipPlan.create({ name, price, duration, description, features: features || [] });
        res.status(201).json({ message: "Plan created successfully", plan });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllPlans = async(req, res) => {
    try {
        const plans = await MembershipPlan.find({ isActive: true });
        res.status(200).json({ plans });
    } catch (error) {
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

        const startDate = new Date();
        const endDate   = new Date();
        endDate.setDate(endDate.getDate() + plan.duration);

        const sub = await Subscription.create({
            member: req.user.id,
            plan:   plan._id,
            startDate, endDate,
            status: "active",
            amountPaid:    plan.price,
            paymentMethod: paymentMethod || "cash",
        });

        res.status(201).json({
            message: "Subscription successful",
            subscription: formatSub(sub, plan),
        });
    } catch (error) {
        console.error("Subscribe error:", error);
        res.status(500).json({ message: error.message });
    }
};

const getMySubscription = async(req, res) => {
    try {
        const sub = await Subscription
            .findOne({ member: req.user.id, status: "active", endDate: { $gt: new Date() } })
            .populate("plan")
            .sort({ startDate: -1 });

        res.json({ subscription: sub ? formatSub(sub, sub.plan) : null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllSubscriptions = async(req, res) => {
    try {
        const subs = await Subscription.find().populate("plan").populate("member", "name email");
        res.json({ subscriptions: subs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPaymentHistory = async(req, res) => {
    try {
        const subs = await Subscription
            .find({ member: req.user.id })
            .populate("plan")
            .sort({ startDate: -1 });

        const payments = subs.map(s => ({
            _id:           s._id,
            plan:          s.plan ? { name: s.plan.name } : { name: "Unknown" },
            amount:        s.amountPaid,
            paymentMethod: s.paymentMethod,
            status:        s.status,
            date:          s.startDate,
        }));

        res.json({ payments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const renewSubscription = async(req, res) => {
    try {
        const { planId, paymentMethod } = req.body;

        const activeSub = await Subscription
            .findOne({ member: req.user.id, status: "active" })
            .populate("plan");

        const targetId = planId || (activeSub && activeSub.plan && activeSub.plan._id);
        if (!targetId) {
            return res.status(400).json({ message: "No plan selected for renewal" });
        }

        const plan = await MembershipPlan.findById(targetId);
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        const startDate = activeSub && new Date(activeSub.endDate) > new Date()
            ? new Date(activeSub.endDate)
            : new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration);

        const sub = await Subscription.create({
            member: req.user.id,
            plan:   plan._id,
            startDate, endDate,
            status: "active",
            amountPaid:    plan.price,
            paymentMethod: paymentMethod || "cash",
        });

        res.status(201).json({
            message: "Membership renewed successfully",
            subscription: formatSub(sub, plan),
        });
    } catch (error) {
        console.error("Renew error:", error);
        res.status(500).json({ message: error.message });
    }
};

function formatSub(sub, plan) {
    return {
        _id:  sub._id,
        plan: plan ? { _id: plan._id, name: plan.name, price: plan.price } : null,
        startDate:     sub.startDate,
        endDate:       sub.endDate,
        status:        sub.status,
        amount:        sub.amountPaid,
        paymentMethod: sub.paymentMethod,
    };
}

module.exports = {
    createPlan,
    getAllPlans,
    subscribeToPlan,
    getMySubscription,
    getAllSubscriptions,
    getPaymentHistory,
    renewSubscription,
    seedDefaultPlans,
};
