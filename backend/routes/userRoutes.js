const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// ✅ TEST ROUTE (add this)
router.get("/", (req, res) => {
    res.json({ message: "Users route is working" });
});

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);

module.exports = router;