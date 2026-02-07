import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
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
      ref: "GroupMessage",
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
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ChatUser",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

groupMessageSchema.index({ group: 1, createdAt: -1 });
groupMessageSchema.index({ sender: 1 });

// Get messages for a group with pagination
groupMessageSchema.statics.getGroupMessages = async function (
  groupId,
  userId,
  limit = 50,
  skip = 0,
) {
  return this.find({
    group: groupId,
    deletedFor: { $ne: userId }, // Exclude messages deleted for this user
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender", "username avatar")
    .populate({
      path: "replyTo",
      select: "content sender messageType imageUrl",
      populate: {
        path: "sender",
        select: "username avatar",
      },
    })
    .populate("reactions.user", "username avatar")
    .lean();
};

// Mark messages as read by a user
groupMessageSchema.statics.markAsRead = async function (groupId, userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  return this.updateMany(
    {
      group: groupId,
      sender: { $ne: userObjectId },
      "readBy.user": { $ne: userObjectId },
    },
    {
      $push: {
        readBy: { user: userObjectId, readAt: new Date() },
      },
    },
  );
};

groupMessageSchema.statics.searchGroupMessages = async function (
  groupId,
  userId,
  query,
  limit = 50,
) {
  return this.find({
    group: groupId,
    content: { $regex: query, $options: "i" },
    messageType: "text",
    deletedFor: { $ne: userId },
    deletedForEveryone: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "username avatar")
    .populate({
      path: "replyTo",
      select: "content sender messageType imageUrl",
      populate: { path: "sender", select: "username avatar" },
    });
};

groupMessageSchema.statics.getStarredMessages = async function (userId) {
  return this.find({
    starredBy: userId,
    deletedFor: { $ne: userId },
  })
    .sort({ createdAt: -1 })
    .populate("sender", "username avatar")
    .populate("group", "name avatar")
    .populate({
      path: "replyTo",
      select: "content sender messageType imageUrl",
      populate: { path: "sender", select: "username avatar" },
    });
};

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;
