import express from "express";
import GroupMessage from "../models/GroupMessage.js";
import Group from "../models/Group.js";
import { auth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Send text message to group
router.post("/", auth, async (req, res) => {
  try {
    const { groupId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const message = new GroupMessage({
      group: groupId,
      sender: req.user._id,
      content: content.trim(),
      messageType: "text",
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    await message.save();
    await message.populate("sender", "username avatar");

    // Update group's last activity
    group.lastActivity = new Date();
    await group.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Send group message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send image message to group
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    const { groupId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const message = new GroupMessage({
      group: groupId,
      sender: req.user._id,
      content: "",
      messageType: "image",
      imageUrl: imageUrl,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    await message.save();
    await message.populate("sender", "username avatar");

    // Update group's last activity
    group.lastActivity = new Date();
    await group.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Send group image message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a group
router.get("/:groupId", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;
    const skip = page * limit;

    // Verify user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const messages = await GroupMessage.getGroupMessages(groupId, limit, skip);

    // Mark messages as read
    await GroupMessage.markAsRead(groupId, req.user._id);

    res.json(messages.reverse());
  } catch (error) {
    console.error("Get group messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark group messages as read
router.put("/read/:groupId", auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await GroupMessage.markAsRead(groupId, req.user._id);

    res.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("Mark group messages as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
