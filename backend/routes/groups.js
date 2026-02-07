import express from "express";
import Group from "../models/Group.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Create a new group
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Group name must be at least 2 characters" });
    }

    // Ensure creator is included in members
    const allMembers = [
      ...new Set([req.user._id.toString(), ...(memberIds || [])]),
    ];

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || "",
      members: allMembers,
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    await group.save();
    await group.populate("members", "username avatar isOnline");
    await group.populate("admins", "username avatar");
    await group.populate("createdBy", "username avatar");

    res.status(201).json(group);
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's groups
router.get("/", auth, async (req, res) => {
  try {
    const groups = await Group.getUserGroups(req.user._id);
    res.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get group details
router.get("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.getGroupWithMembers(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some(
      (m) => m._id.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    res.json(group);
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update group info (admin only)
router.put("/:groupId", auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.some(
      (a) => a.toString() === req.user._id.toString(),
    );

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can update group" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    await group.save();
    await group.populate("members", "username avatar isOnline");
    await group.populate("admins", "username avatar");

    res.json(group);
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add members to group
router.post("/:groupId/members", auth, async (req, res) => {
  try {
    const { userIds } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    const isAdmin = group.admins.some(
      (a) => a.toString() === req.user._id.toString(),
    );

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    // Add new members
    const existingMembers = group.members.map((m) => m.toString());
    const newMembers = userIds.filter((id) => !existingMembers.includes(id));

    group.members.push(...newMembers);
    await group.save();
    await group.populate("members", "username avatar isOnline");

    res.json(group);
  } catch (error) {
    console.error("Add members error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove member from group (admin only)
router.delete("/:groupId/members/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isAdmin = group.admins.some(
      (a) => a.toString() === req.user._id.toString(),
    );

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can remove members" });
    }

    // Cannot remove the creator
    if (group.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ message: "Cannot remove group creator" });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== req.params.userId,
    );
    group.admins = group.admins.filter(
      (a) => a.toString() !== req.params.userId,
    );

    await group.save();
    await group.populate("members", "username avatar isOnline");

    res.json(group);
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Leave group
router.delete("/:groupId/leave", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Creator cannot leave, must delete group
    if (group.createdBy.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Creator cannot leave. Delete the group instead." });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== req.user._id.toString(),
    );
    group.admins = group.admins.filter(
      (a) => a.toString() !== req.user._id.toString(),
    );

    await group.save();

    res.json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete group (creator only)
router.delete("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the creator can delete the group" });
    }

    await Group.findByIdAndDelete(req.params.groupId);

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
