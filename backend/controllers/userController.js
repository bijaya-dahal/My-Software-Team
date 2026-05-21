const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || "gym-secret-key", {
        expiresIn: "7d",
    });
};

const registerUser = async(req, res) => {
    try {
        const { name, email, password, role, phone, dateOfBirth, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "A user with this email already exists" });
        }

        const user = await User.create({
            name, email, password,
            role: role || "member",
            phone, dateOfBirth, address
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                createdAt: user.createdAt,
            },
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated. Contact support." });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                address: user.address,
            },
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message });
    }
};

const getUserProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ message: error.message });
    }
};

const updateUserProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { name, phone, dateOfBirth, address } = req.body;
        if (name)        user.name        = name;
        if (phone)       user.phone       = phone;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (address)     user.address     = address;

        const updated = await user.save();
        res.json({
            message: "Profile updated",
            user: {
                id: updated._id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                phone: updated.phone,
                dateOfBirth: updated.dateOfBirth,
                address: updated.address,
                createdAt: updated.createdAt,
            }
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
};
