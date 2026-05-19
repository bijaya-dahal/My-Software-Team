const express = require("express");
const router = express.Router();

const {
    assignTrainer,
    getAllAssignments,
    getMyAssignments,
    updateHoursWorked,
    getTrainerHours,
    getAllTrainers,
    getTrainerList,
    cancelAssignment,
} = require("../controllers/trainerController");

const { protect, authorise } = require("../middleware/authMiddleware");

// Private - Staff/Admin only
router.get("/", protect, authorise("staff", "admin"), getAllTrainers);
router.post("/assign", protect, authorise("staff", "admin"), assignTrainer);
router.get("/assignments", protect, authorise("staff", "admin"), getAllAssignments);
router.get("/hours", protect, authorise("staff", "admin"), getTrainerHours);
router.put("/assignments/:id/hours", protect, authorise("staff", "admin"), updateHoursWorked);
router.delete("/assignments/:id", protect, authorise("staff", "admin"), cancelAssignment);

// Private - Any logged-in user
router.get("/list", protect, getTrainerList);

// Private - Trainer only
router.get("/my-assignments", protect, authorise("trainer"), getMyAssignments);

module.exports = router;