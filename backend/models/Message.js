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
      enum: ["text", "image", "video", "audio", "file"],
      default: "text",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    audioUrl: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
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
    starredBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatUser",
      },
    ],
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
      select:
        "content sender messageType imageUrl videoUrl audioUrl fileUrl fileName",
      populate: { path: "sender", select: "username avatar" },
    })
    .populate("reactions.user", "username avatar");
};

messageSchema.statics.getUserConversations = async function (userId) {
  const userModel = mongoose.model("ChatUser");
  const userCollectionName = userModel.collection.name || "chatusers";

  // 1. Get user's contacts first
  const user = await userModel
    .findById(userId)
    .select("contacts favoriteUsers blockedUsers");
  const contactIds = user?.contacts || [];

  const conversations = await this.aggregate([
    // Match messages for the user
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
    // Union with contacts who might not have messages
    {
      $unionWith: {
        coll: userCollectionName,
        pipeline: [
          {
            $match: {
              _id: { $in: contactIds },
            },
          },
          {
            $project: {
              _id: 1,
              user: {
                _id: "$_id",
                username: "$username",
                avatar: "$avatar",
                isOnline: "$isOnline",
                lastSeen: "$lastSeen",
              },
              lastMessage: { $literal: null },
              unreadCount: { $literal: 0 },
            },
          },
        ],
      },
    },
    // Sort to ensure real messages come before null entries from contacts union
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
    // Group again by _id to merge contacts with their messages if they exist
    {
      $group: {
        _id: "$_id",
        unionUser: { $first: "$user" },
        lastMessage: { $first: "$lastMessage" },
        unreadCount: { $first: "$unreadCount" },
      },
    },
    {
      $lookup: {
        from: userCollectionName,
        localField: "_id",
        foreignField: "_id",
        as: "lookedUpUser",
      },
    },
    { $unwind: { path: "$lookedUpUser", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: { $ifNull: ["$_id", "$user._id"] },
        user: {
          _id: { $ifNull: ["$unionUser._id", "$lookedUpUser._id"] },
          username: {
            $ifNull: ["$unionUser.username", "$lookedUpUser.username"],
          },
          avatar: { $ifNull: ["$unionUser.avatar", "$lookedUpUser.avatar"] },
          isOnline: {
            $ifNull: ["$unionUser.isOnline", "$lookedUpUser.isOnline"],
          },
          lastSeen: {
            $ifNull: ["$unionUser.lastSeen", "$lookedUpUser.lastSeen"],
          },
          blockedUsers: { $ifNull: ["$lookedUpUser.blockedUsers", []] },
        },
        lastMessage: 1,
        unreadCount: 1,
      },
    },
    {
      $addFields: {
        "user.blockedByMe": {
          $in: ["$user._id", { $ifNull: [user.blockedUsers, []] }],
        },
        "user.hasBlockedMe": {
          $in: [
            new mongoose.Types.ObjectId(userId),
            { $ifNull: ["$user.blockedUsers", []] },
          ],
        },
        "user.isFavorite": {
          $in: ["$user._id", { $ifNull: [user.favoriteUsers, []] }],
        },
      },
    },
    {
      $sort: {
        "user.isFavorite": -1,
        "lastMessage.createdAt": -1,
        "user.username": 1,
      },
    },
  ]);

  return conversations;
};

messageSchema.statics.searchMessages = async function (
  userId,
  query,
  limit = 50,
) {
  return this.find({
    $or: [{ sender: userId }, { receiver: userId }],
    content: { $regex: query, $options: "i" },
    messageType: "text",
    deletedFor: { $ne: userId },
    deletedForEveryone: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar")
    .populate({
      path: "replyTo",
      select:
        "content sender messageType imageUrl videoUrl audioUrl fileUrl fileName",
      populate: { path: "sender", select: "username avatar" },
    });
};

messageSchema.statics.getStarredMessages = async function (userId) {
  return this.find({
    starredBy: userId,
    deletedFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("receiver", "username avatar")
    .populate({
      path: "replyTo",
      select: "content sender messageType imageUrl videoUrl",
      populate: { path: "sender", select: "username avatar" },
    });
};

const Message = mongoose.model("ChatMessage", messageSchema);

export default Message;
