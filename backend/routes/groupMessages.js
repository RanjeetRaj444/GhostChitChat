import express from "express";
import GroupMessage from "../models/GroupMessage.js";
import Group from "../models/Group.js";
import { auth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Send text message to group
router.post("/", auth, async (req, res) => {
  try {
    const { groupId, content, replyToId } = req.body;

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
      replyTo: replyToId || null,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    await message.save();
    await message.populate("sender", "username avatar");
    if (replyToId) {
      await message.populate({
        path: "replyTo",
        select: "content sender messageType imageUrl",
        populate: { path: "sender", select: "username avatar" },
      });
    }

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
    const { groupId, replyToId } = req.body;

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
      replyTo: replyToId || null,
      readBy: [{ user: req.user._id, readAt: new Date() }],
    });

    await message.save();
    await message.populate("sender", "username avatar");
    if (replyToId) {
      await message.populate({
        path: "replyTo",
        select: "content sender messageType imageUrl",
        populate: { path: "sender", select: "username avatar" },
      });
    }

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

    const messages = await GroupMessage.getGroupMessages(
      groupId,
      req.user._id,
      limit,
      skip,
    );

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

// Add or toggle reaction to a group message
router.post("/:messageId/react", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await GroupMessage.findById(messageId).populate("group");
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is a member of the group
    const group = await Group.findById(message.group);
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const { targetUserId } = req.body;

    // Find existing reaction
    // If targetUserId is provided and the requester is the message sender, they can remove that user's reaction
    const canModerate = message.sender.toString() === req.user._id.toString();
    const findUserId =
      targetUserId && canModerate ? targetUserId : req.user._id.toString();

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === findUserId,
    );

    if (existingReactionIndex > -1) {
      if (
        message.reactions[existingReactionIndex].emoji === emoji ||
        (targetUserId && canModerate)
      ) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
        message.reactions[existingReactionIndex].createdAt = new Date();
      }
    } else if (!targetUserId) {
      message.reactions.push({
        user: req.user._id,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();
    await message.populate("reactions.user", "username avatar");

    res.json(message);
  } catch (error) {
    console.error("React to group message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete group message for me
router.delete("/:messageId/delete-for-me", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is a member of the group
    const group = await Group.findById(message.group);
    const isMember = group.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
    }

    await message.save();

    res.json({ success: true, messageId });
  } catch (error) {
    console.error("Delete group message for me error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete group message for everyone (only sender or admin can do this)
router.delete("/:messageId/delete-for-everyone", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const group = await Group.findById(message.group);
    const isAdmin = group.admins.some(
      (a) => a.toString() === req.user._id.toString(),
    );
    const isSender = message.sender.toString() === req.user._id.toString();

    if (!isSender && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Only sender or admin can delete for everyone" });
    }

    // Check if message is within 1 hour (for non-admins)
    if (!isAdmin) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (message.createdAt < oneHourAgo) {
        return res.status(400).json({
          message: "Can only delete messages within 1 hour of sending",
        });
      }
    }

    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    message.content = "";
    message.imageUrl = null;

    await message.save();

    res.json({ success: true, messageId, groupId: message.group });
  } catch (error) {
    console.error("Delete group message for everyone error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit group message
router.put("/:messageId/edit", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only sender can edit message" });
    }

    if (message.messageType === "image") {
      return res.status(400).json({ message: "Cannot edit image messages" });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({
        message: "Can only edit messages within 15 minutes of sending",
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate("sender", "username avatar");

    res.json(message);
  } catch (error) {
    console.error("Edit group message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear group conversation history (delete for me only)
router.delete("/clear/:groupId", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { keepStarred } = req.query; // true/false
    const currentUserId = req.user._id;

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(currentUserId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const query = { group: groupId, deletedFor: { $ne: currentUserId } };

    if (keepStarred === "true") {
      query.starredBy = { $ne: currentUserId };
    }

    const result = await GroupMessage.updateMany(query, {
      $push: { deletedFor: currentUserId },
    });

    res.json({
      success: true,
      message: "Group chat cleared",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Clear group chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle star status of a group message
router.post("/:messageId/star", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const isStarred = message.starredBy.includes(currentUserId);

    if (isStarred) {
      message.starredBy = message.starredBy.filter(
        (id) => id.toString() !== currentUserId.toString(),
      );
    } else {
      message.starredBy.push(currentUserId);
    }

    await message.save();
    res.json({
      success: true,
      isStarred: !isStarred,
      starredBy: message.starredBy,
    });
  } catch (error) {
    console.error("Star group message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
