import express from 'express';
import Message from '../models/Message.js';
import { auth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a new message
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    
    if (!content.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content
    });
    
    await message.save();
    
    // Populate sender and receiver info
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');
    
    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/:userId
// @desc    Get conversation with a user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 50;
    const skip = page * limit;
    
    // Get messages between current user and the specified user
    const messages = await Message.getConversation(currentUserId, userId, limit, skip);
    
    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    
    res.json(messages.reverse()); // Reverse to get oldest messages first
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages
// @desc    Get all conversations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/read/:userId
// @desc    Mark all messages from a user as read
// @access  Private
router.put('/read/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await Message.updateMany(
      { sender: userId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    
    res.json({ updated: result.nModified });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;