const Class = require("../models/Class");

const createClass = async(req, res) => {
    try {
        const { name, description, instructor, date, startTime, endTime, capacity, location, category } = req.body;

        if (!name || !instructor || !date || !startTime || !endTime || !capacity) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const newClass = await Class.create({
            name,
            description,
            instructor,
            date,
            startTime,
            endTime,
            capacity,
            location,
            category,
        });

        res.status(201).json({
            message: "Class created successfully",
            class: newClass,
        });
    } catch (error) {
        console.error("Create class error:", error.message);
        res.status(500).json({ message: "Server error creating class" });
    }
};

const getAllClasses = async(req, res) => {
    try {
        const classes = await Class.find({ isActive: true }).sort({ date: 1 });
        res.status(200).json({ classes });
    } catch (error) {
        console.error("Get classes error:", error.message);
        res.status(500).json({ message: "Server error fetching classes" });
    }
};

const getClassById = async(req, res) => {
    try {
        const foundClass = await Class.findById(req.params.id).populate(
            "registeredMembers",
            "name email"
        );

        if (!foundClass) {
            return res.status(404).json({ message: "Class not found" });
        }

        res.status(200).json({ class: foundClass });
    } catch (error) {
        console.error("Get class error:", error.message);
        res.status(500).json({ message: "Server error fetching class" });
    }
};

const updateClass = async(req, res) => {
    try {
        const foundClass = await Class.findById(req.params.id);

        if (!foundClass) {
            return res.status(404).json({ message: "Class not found" });
        }

        const { name, description, instructor, date, startTime, endTime, capacity, location, category } = req.body;

        if (name) foundClass.name = name;
        if (description) foundClass.description = description;
        if (instructor) foundClass.instructor = instructor;
        if (date) foundClass.date = date;
        if (startTime) foundClass.startTime = startTime;
        if (endTime) foundClass.endTime = endTime;
        if (capacity) foundClass.capacity = capacity;
        if (location) foundClass.location = location;
        if (category) foundClass.category = category;

        const updatedClass = await foundClass.save();

        res.status(200).json({
            message: "Class updated successfully",
            class: updatedClass,
        });
    } catch (error) {
        console.error("Update class error:", error.message);
        res.status(500).json({ message: "Server error updating class" });
    }
};

const deleteClass = async(req, res) => {
    try {
        const foundClass = await Class.findById(req.params.id);

        if (!foundClass) {
            return res.status(404).json({ message: "Class not found" });
        }

        foundClass.isActive = false;
        await foundClass.save();

        res.status(200).json({ message: "Class deleted successfully" });
    } catch (error) {
        console.error("Delete class error:", error.message);
        res.status(500).json({ message: "Server error deleting class" });
    }
};

const registerForClass = async(req, res) => {
    try {
        const foundClass = await Class.findById(req.params.id);

        if (!foundClass) {
            return res.status(404).json({ message: "Class not found" });
        }

        if (foundClass.registeredMembers.length >= foundClass.capacity) {
            return res.status(400).json({ message: "Class is full" });
        }

        if (foundClass.registeredMembers.includes(req.user.id)) {
            return res.status(400).json({ message: "You are already registered for this class" });
        }

        foundClass.registeredMembers.push(req.user.id);
        await foundClass.save();

        res.status(200).json({ message: "Successfully registered for class" });
    } catch (error) {
        console.error("Register for class error:", error.message);
        res.status(500).json({ message: "Server error registering for class" });
    }
};

const getMyClasses = async(req, res) => {
    try {
        const classes = await Class.find({
            registeredMembers: req.user.id,
            isActive: true,
        }).sort({ date: 1 });

        res.status(200).json({ classes });
    } catch (error) {
        console.error("Get my classes error:", error.message);
        res.status(500).json({ message: "Server error fetching your classes" });
    }
};

module.exports = {
    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
    registerForClass,
    getMyClasses,
};