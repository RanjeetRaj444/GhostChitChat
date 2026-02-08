import express from "express";
import User from "../models/User.js";
import Message from "../models/Message.js";
import Report from "../models/Report.js";
import { auth } from "../middleware/auth.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js"; // Import

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

    // Check if avatar is being updated
    if (avatar && avatar !== user.avatar) {
      // Delete old avatar from Cloudinary if it exists and is not the default one
      if (user.avatar && !user.avatar.includes("ui-avatars.com")) {
        await deleteFromCloudinary(user.avatar);
      }
      user.avatar = avatar;
    }

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

// Remove user from contacts and wipe data
router.delete("/contacts/:id", auth, async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user._id;

    // 1. Remove from contacts
    req.user.contacts = req.user.contacts.filter(
      (id) => id.toString() !== contactId,
    );
    await req.user.save();

    // 2. Wipe messages for this user (Soft Delete)
    // Add this user to 'deletedFor' for all messages in the conversation
    await Message.updateMany(
      {
        $or: [
          { sender: userId, receiver: contactId },
          { sender: contactId, receiver: userId },
        ],
        deletedFor: { $ne: userId },
      },
      {
        $addToSet: { deletedFor: userId },
      },
    );

    // 3. Clean up orphaned messages (deleted by both)
    const orphanedMessages = await Message.find({
      $or: [
        { sender: userId, receiver: contactId },
        { sender: contactId, receiver: userId },
      ],
      deletedFor: { $all: [userId, contactId] },
    });

    for (const msg of orphanedMessages) {
      if (msg.imageUrl) await deleteFromCloudinary(msg.imageUrl);
      if (msg.videoUrl) await deleteFromCloudinary(msg.videoUrl);
      if (msg.audioUrl) await deleteFromCloudinary(msg.audioUrl);
      if (msg.fileUrl) await deleteFromCloudinary(msg.fileUrl);

      await Message.findByIdAndDelete(msg._id);
    }

    res.json({ success: true, message: "Contact and chat data removed" });
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

// Block user
router.post("/block/:id", auth, async (req, res) => {
  try {
    const blockId = req.params.id;
    if (blockId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    if (!req.user.blockedUsers.includes(blockId)) {
      req.user.blockedUsers.push(blockId);
      await req.user.save();
    }

    res.json({ success: true, blockedUsers: req.user.blockedUsers });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unblock user
router.post("/unblock/:id", auth, async (req, res) => {
  try {
    const unblockId = req.params.id;
    req.user.blockedUsers = req.user.blockedUsers.filter(
      (id) => id.toString() !== unblockId,
    );
    await req.user.save();
    res.json({ success: true, blockedUsers: req.user.blockedUsers });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mute/Unmute user or group
router.post("/mute/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { type } = req.body; // 'user' or 'group'
    const field = type === "group" ? "mutedGroups" : "mutedUsers";
    const isMuted = req.user[field].includes(targetId);

    if (isMuted) {
      req.user[field] = req.user[field].filter(
        (id) => id.toString() !== targetId,
      );
    } else {
      req.user[field].push(targetId);
    }

    await req.user.save();
    res.json({
      success: true,
      [field]: req.user[field],
      isMuted: !isMuted,
    });
  } catch (error) {
    console.error("Mute error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Favorite/Unfavorite user or group
router.post("/favorite/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { type } = req.body; // 'user' or 'group'
    const field = type === "group" ? "favoriteGroups" : "favoriteUsers";
    const isFavorite = req.user[field].includes(targetId);

    if (isFavorite) {
      req.user[field] = req.user[field].filter(
        (id) => id.toString() !== targetId,
      );
    } else {
      req.user[field].push(targetId);
    }

    await req.user.save();
    res.json({
      success: true,
      [field]: req.user[field],
      isFavorite: !isFavorite,
    });
  } catch (error) {
    console.error("Favorite error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Report user
router.post("/report/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const report = new Report({
      reporter: req.user._id,
      target: targetId,
      reason,
    });

    await report.save();

    res.json({ success: true, message: "Report received" });
  } catch (error) {
    console.error("Report user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
