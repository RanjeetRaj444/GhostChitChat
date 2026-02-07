import express from "express";
import Message from "../models/Message.js";
import { auth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import mongoose from "mongoose";

const router = express.Router();

// Send text message
router.post("/", auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      messageType: "text",
    });

    await message.save();
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Send image message
router.post("/image", auth, upload.single("image"), async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content: "",
      messageType: "image",
      imageUrl: imageUrl,
    });

    await message.save();
    await message.populate("sender", "username avatar");
    await message.populate("receiver", "username avatar");

    res.status(201).json(message);
  } catch (error) {
    console.error("Send image message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

export default router;
