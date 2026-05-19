const express = require("express");
const router  = express.Router();

const {
    createPlan,
    getAllPlans,
    subscribeToPlan,
    getMySubscription,
    getAllSubscriptions,
    getPaymentHistory,
    renewSubscription,
} = require("../controllers/membershipController");

const { protect, authorise } = require("../middleware/authMiddleware");

// Public
router.get("/plans", getAllPlans);

// Private - Member
router.post("/subscribe",        protect, subscribeToPlan);
router.get("/my-subscription",   protect, getMySubscription);
router.get("/payment-history",   protect, getPaymentHistory);
router.post("/renew",            protect, renewSubscription);

// Private - Staff/Admin only
router.post("/plans",             protect, authorise("staff", "admin"), createPlan);
router.get("/all-subscriptions",  protect, authorise("staff", "admin"), getAllSubscriptions);

module.exports = router;
