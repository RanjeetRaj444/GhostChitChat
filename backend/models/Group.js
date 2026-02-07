import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
    avatar: {
      type: String,
      default: function () {
        const colors = [
          "6366f1",
          "8b5cf6",
          "ec4899",
          "ef4444",
          "f97316",
          "eab308",
          "22c55e",
          "06b6d4",
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=${randomColor}&color=fff&bold=true`;
      },
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatUser",
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatUser",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatUser",
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

groupSchema.index({ members: 1 });
groupSchema.index({ lastActivity: -1 });

// Get all groups for a user with last message
groupSchema.statics.getUserGroups = async function (userId) {
  const GroupMessage = mongoose.model("GroupMessage");

  const groups = await this.find({ members: userId })
    .populate("members", "username avatar isOnline")
    .populate("admins", "username avatar")
    .populate("createdBy", "username avatar")
    .sort({ lastActivity: -1 })
    .lean();

  // Get last message and unread count for each group
  const groupsWithMessages = await Promise.all(
    groups.map(async (group) => {
      const lastMessage = await GroupMessage.findOne({ group: group._id })
        .sort({ createdAt: -1 })
        .populate("sender", "username avatar")
        .lean();

      const unreadCount = await GroupMessage.countDocuments({
        group: group._id,
        "readBy.user": { $ne: new mongoose.Types.ObjectId(userId) },
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
      });

      return {
        ...group,
        lastMessage,
        unreadCount,
      };
    }),
  );

  return groupsWithMessages;
};

// Get group with full member details
groupSchema.statics.getGroupWithMembers = async function (groupId) {
  return this.findById(groupId)
    .populate("members", "username avatar isOnline lastSeen bio")
    .populate("admins", "username avatar")
    .populate("createdBy", "username avatar");
};

const Group = mongoose.model("Group", groupSchema);

export default Group;
