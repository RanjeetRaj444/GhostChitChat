import express from "express";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ username: 1 });

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", auth, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add user to contacts
router.post("/contacts/:id", auth, async (req, res) => {
  try {
    const contactId = req.params.id;
    if (contactId === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot add yourself to contacts" });
    }

    const contactUser = await User.findById(contactId);
    if (!contactUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.user.contacts.includes(contactId)) {
      req.user.contacts.push(contactId);
      await req.user.save();
    }

    res.json({ success: true, contacts: req.user.contacts });
  } catch (error) {
    console.error("Add contact error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove user from contacts
router.delete("/contacts/:id", auth, async (req, res) => {
  try {
    const contactId = req.params.id;
    req.user.contacts = req.user.contacts.filter(
      (id) => id.toString() !== contactId,
    );
    await req.user.save();
    res.json({ success: true, contacts: req.user.contacts });
  } catch (error) {
    console.error("Remove contact error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all contacts
router.get("/contacts/all", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "contacts",
      "username avatar isOnline lastSeen bio",
    );
    res.json(user.contacts);
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
