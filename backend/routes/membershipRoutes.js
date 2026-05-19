const express = require("express");
const router = express.Router();

const {
    createPlan,
    getAllPlans,
    subscribeToPlan,
    getMySubscription,
    renewSubscription,
    getPaymentHistory,
    getAllSubscriptions,
} = require("../controllers/membershipController");

const { protect, authorise } = require("../middleware/authMiddleware");

// Public
router.get("/plans", getAllPlans);

// Private - Member
router.post("/subscribe", protect, subscribeToPlan);
router.post("/renew", protect, renewSubscription);
router.get("/my-subscription", protect, getMySubscription);
router.get("/payment-history", protect, getPaymentHistory);

// Private - Staff/Admin only
router.post("/plans", protect, authorise("staff", "admin"), createPlan);
router.get("/all-subscriptions", protect, authorise("staff", "admin"), getAllSubscriptions);

module.exports = router;