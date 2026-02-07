import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "defaultsecret", {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      mutedUsers: user.mutedUsers || [],
      favoriteUsers: user.favoriteUsers || [],
      mutedGroups: user.mutedGroups || [],
      favoriteGroups: user.favoriteGroups || [],
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    user.isOnline = true;
    user.lastSeen = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      mutedUsers: user.mutedUsers || [],
      favoriteUsers: user.favoriteUsers || [],
      mutedGroups: user.mutedGroups || [],
      favoriteGroups: user.favoriteGroups || [],
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    req.user.isOnline = false;
    req.user.lastSeen = Date.now();
    await req.user.save();
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
