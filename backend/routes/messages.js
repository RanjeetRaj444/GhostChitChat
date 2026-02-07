import express from "express";
import Message from "../models/Message.js";
import { auth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import mongoose from "mongoose";

const router = express.Router();

// Send text message
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, content, replyToId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Check for blocks
    const receiver = await mongoose.model("ChatUser").findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    if (receiver.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: "You are blocked by this user" });
    }
    if (req.user.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ message: "You have blocked this user" });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      messageType: "text",
      replyTo: replyToId || null,
    });

    await message.save();

    // Automatically add to contacts
    await mongoose.model("ChatUser").findByIdAndUpdate(req.user._id, {
      $addToSet: { contacts: receiverId },
    });
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");
    if (replyToId) {
      await message.populate({
        path: "replyTo",
        select: "content sender messageType imageUrl",
        populate: { path: "sender", select: "username avatar" },
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send image message
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    const { receiverId, replyToId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Check for blocks
    const receiver = await mongoose.model("ChatUser").findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    if (receiver.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: "You are blocked by this user" });
    }
    if (req.user.blockedUsers.includes(receiverId)) {
      return res.status(403).json({ message: "You have blocked this user" });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content: "",
      messageType: "image",
      imageUrl: imageUrl,
      replyTo: replyToId || null,
    });

    await message.save();

    // Automatically add to contacts
    await mongoose.model("ChatUser").findByIdAndUpdate(req.user._id, {
      $addToSet: { contacts: receiverId },
    });
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");
    if (replyToId) {
      await message.populate({
        path: "replyTo",
        select: "content sender messageType imageUrl",
        populate: { path: "sender", select: "username avatar" },
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Send image message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages for a conversation
router.get("/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;
    const skip = page * limit;
    const messages = await Message.getConversation(
      currentUserId,
      userId,
      limit,
      skip,
    );

    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: Date.now() },
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all conversations
router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark messages as read
router.put("/read/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: Date.now() },
    );

    res.json({ updated: result.nModified });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add or toggle reaction to a message
router.post("/:messageId/react", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is part of the conversation
    const isParticipant =
      message.sender.toString() === req.user._id.toString() ||
      message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized" });
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
      // If same emoji (or we are moderating), remove reaction; otherwise update it
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
      // Add new reaction (only if not trying to moderate a non-existent reaction)
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
    console.error("React to message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete message for me
router.delete("/:messageId/delete-for-me", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is part of the conversation
    const isParticipant =
      message.sender.toString() === req.user._id.toString() ||
      message.receiver.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Add user to deletedFor array if not already there
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
    }

    await message.save();

    res.json({ success: true, messageId });
  } catch (error) {
    console.error("Delete message for me error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete message for everyone (only sender can do this)
router.delete("/:messageId/delete-for-everyone", auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete for everyone
    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only sender can delete for everyone" });
    }

    // Check if message is within 1 hour (like WhatsApp)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (message.createdAt < oneHourAgo) {
      return res.status(400).json({
        message: "Can only delete messages within 1 hour of sending",
      });
    }

    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    message.content = "";
    message.imageUrl = null;

    await message.save();

    res.json({ success: true, messageId, receiverId: message.receiver });
  } catch (error) {
    console.error("Delete message for everyone error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Edit message (only sender, within time limit)
router.put("/:messageId/edit", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only sender can edit message" });
    }

    // Can't edit image messages
    if (message.messageType === "image") {
      return res.status(400).json({ message: "Cannot edit image messages" });
    }

    // Check if message is within 15 minutes
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
    await message.populate("receiver", "username avatar");

    res.json(message);
  } catch (error) {
    console.error("Edit message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear conversation history (delete for me only)
router.delete("/clear/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { keepStarred } = req.query; // true/false
    const currentUserId = req.user._id;

    const query = {
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      deletedFor: { $ne: currentUserId },
    };

    if (keepStarred === "true") {
      query.starredBy = { $ne: currentUserId };
    }

    // Update all messages in this conversation to include current user in deletedFor
    const result = await Message.updateMany(query, {
      $push: { deletedFor: currentUserId },
    });

    res.json({
      success: true,
      message: "Chat cleared",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Clear chat error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle star status of a message
router.post("/:messageId/star", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
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
    console.error("Star message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
