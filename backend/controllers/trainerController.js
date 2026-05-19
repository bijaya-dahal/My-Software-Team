const TrainerAssignment = require("../models/TrainerAssignment");
const User = require("../models/User");
const Class = require("../models/Class");

const assignTrainer = async(req, res) => {
    try {
        const { trainerId, classId, notes } = req.body;

        if (!trainerId || !classId) {
            return res.status(400).json({ message: "Trainer and class are required" });
        }

        const trainer = await User.findById(trainerId);
        if (!trainer || trainer.role !== "trainer") {
            return res.status(404).json({ message: "Trainer not found" });
        }

        const foundClass = await Class.findById(classId);
        if (!foundClass) {
            return res.status(404).json({ message: "Class not found" });
        }

        const existingAssignment = await TrainerAssignment.findOne({
            trainer: trainerId,
            class: classId,
            status: "assigned",
        });
        if (existingAssignment) {
            return res.status(400).json({ message: "Trainer already assigned to this class" });
        }

        const assignment = await TrainerAssignment.create({
            trainer: trainerId,
            class: classId,
            assignedBy: req.user.id,
            notes,
        });

        res.status(201).json({
            message: "Trainer assigned successfully",
            assignment,
        });
    } catch (error) {
        console.error("Assign trainer error:", error.message);
        res.status(500).json({ message: "Server error assigning trainer" });
    }
};

const getAllAssignments = async(req, res) => {
    try {
        const assignments = await TrainerAssignment.find()
            .populate("trainer", "name email phone")
            .populate("class", "name date startTime endTime")
            .populate("assignedBy", "name");

        res.status(200).json({ assignments });
    } catch (error) {
        console.error("Get assignments error:", error.message);
        res.status(500).json({ message: "Server error fetching assignments" });
    }
};

const getMyAssignments = async(req, res) => {
    try {
        const assignments = await TrainerAssignment.find({
            trainer: req.user.id,
        }).populate("class", "name date startTime endTime location");

        res.status(200).json({ assignments });
    } catch (error) {
        console.error("Get my assignments error:", error.message);
        res.status(500).json({ message: "Server error fetching your assignments" });
    }
};

const updateHoursWorked = async(req, res) => {
    try {
        const { hoursWorked } = req.body;

        if (!hoursWorked) {
            return res.status(400).json({ message: "Hours worked is required" });
        }

        const assignment = await TrainerAssignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        assignment.hoursWorked = hoursWorked;
        assignment.status = "completed";
        await assignment.save();

        res.status(200).json({
            message: "Hours updated successfully",
            assignment,
        });
    } catch (error) {
        console.error("Update hours error:", error.message);
        res.status(500).json({ message: "Server error updating hours" });
    }
};

const getTrainerHours = async(req, res) => {
    try {
        const trainers = await TrainerAssignment.aggregate([{
                $group: {
                    _id: "$trainer",
                    totalHours: { $sum: "$hoursWorked" },
                    totalClasses: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "trainerInfo",
                },
            },
            {
                $unwind: "$trainerInfo",
            },
            {
                $project: {
                    trainerName: "$trainerInfo.name",
                    trainerEmail: "$trainerInfo.email",
                    totalHours: 1,
                    totalClasses: 1,
                },
            },
        ]);

        res.status(200).json({ trainers });
    } catch (error) {
        console.error("Get trainer hours error:", error.message);
        res.status(500).json({ message: "Server error fetching trainer hours" });
    }
};

const getAllTrainers = async(req, res) => {
    try {
        const trainers = await User.find({ role: "trainer" }).select(
            "name email phone"
        );
        res.status(200).json({ trainers });
    } catch (error) {
        console.error("Get trainers error:", error.message);
        res.status(500).json({ message: "Server error fetching trainers" });
    }
};

const cancelAssignment = async(req, res) => {
    try {
        const assignment = await TrainerAssignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        assignment.status = "cancelled";
        await assignment.save();

        res.status(200).json({ message: "Assignment cancelled successfully" });
    } catch (error) {
        console.error("Cancel assignment error:", error.message);
        res.status(500).json({ message: "Server error cancelling assignment" });
    }
};

module.exports = {
    assignTrainer,
    getAllAssignments,
    getMyAssignments,
    updateHoursWorked,
    getTrainerHours,
    getAllTrainers,
    cancelAssignment,
};