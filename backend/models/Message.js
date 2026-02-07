import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    // Reply functionality
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    // Reactions - array of user reactions
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ChatUser",
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Soft delete for specific users
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatUser",
      },
    ],
    // Delete for everyone flag
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Edit tracking
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

messageSchema.statics.getConversation = async function (
  userId1,
  userId2,
  limit = 50,
  skip = 0,
) {
  return this.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
    deletedFor: { $ne: userId1 }, // Exclude messages deleted for this user
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar")
    .populate({
      path: "replyTo",
      select: "content sender messageType imageUrl",
      populate: {
        path: "sender",
        select: "username avatar",
      },
    })
    .populate("reactions.user", "username avatar");
};

messageSchema.statics.getUserConversations = async function (userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) },
        ],
        deletedFor: { $ne: new mongoose.Types.ObjectId(userId) },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
            then: "$receiver",
            else: "$sender",
          },
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        user: {
          _id: 1,
          username: 1,
          avatar: 1,
          isOnline: 1,
          lastSeen: 1,
        },
        lastMessage: 1,
        unreadCount: 1,
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  return conversations;
};

const Message = mongoose.model("ChatMessage", messageSchema);

export default Message;
