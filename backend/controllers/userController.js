const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

// @route  POST /api/users/register
// @access Public
const registerUser = async(req, res) => {
    try {
        const { name, email, password, role, phone, dateOfBirth, address } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "A user with this email already exists" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || "member",
            phone,
            dateOfBirth,
            address,
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
        console.error("Register error:", error.message);
        res.status(500).json({ message: "Server error during registration" });
    }
};

// @route  POST /api/users/login
// @access Public
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
            },
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Server error during login" });
    }
};

// @route  GET /api/users/profile
// @access Private
const getUserProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error("Profile error:", error.message);
        res.status(500).json({ message: "Server error fetching profile" });
    }
};

// @route  PUT /api/users/profile
// @access Private
const updateUserProfile = async(req, res) => {
    try {
        const { name, phone, dateOfBirth, address } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (address) user.address = address;

        const updatedUser = await user.save();

        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                dateOfBirth: updatedUser.dateOfBirth,
                address: updatedUser.address,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error.message);
        res.status(500).json({ message: "Server error updating profile" });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };