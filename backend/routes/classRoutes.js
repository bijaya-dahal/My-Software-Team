const express = require("express");
const router = express.Router();

const {
    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
    registerForClass,
    getMyClasses,
} = require("../controllers/classController");

const { protect, authorise } = require("../middleware/authMiddleware");

// Public
router.get("/", getAllClasses);
router.get("/:id", getClassById);

// Private - Member
router.post("/:id/register", protect, registerForClass);
router.get("/my-classes", protect, getMyClasses);

// Private - Staff/Admin only
router.post("/", protect, authorise("staff", "admin"), createClass);
router.put("/:id", protect, authorise("staff", "admin"), updateClass);
router.delete("/:id", protect, authorise("staff", "admin"), deleteClass);

module.exports = router;