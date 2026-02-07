import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import toast from "react-hot-toast";

export const useGroupChat = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    socket,
    joinGroupRoom,
    leaveGroupRoom,
    sendGroupMessage: sendSocketGroupMessage,
    markGroupRead,
  } = useSocket();
  const { api, currentUser } = useAuth();

  const selectedGroupRef = useRef(selectedGroup);
  const groupMessagesRef = useRef(groupMessages);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    groupMessagesRef.current = groupMessages;
  }, [groupMessages]);

  // Fetch user's groups - only runs once on mount
  const fetchGroups = useCallback(async () => {
    if (!api || !currentUser) return;

    try {
      const res = await api.get("/groups");
      setGroups(res.data);
      return res.data;
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      return [];
    }
  }, [api, currentUser]);

  // Initialize groups and join rooms
  useEffect(() => {
    if (!socket || !currentUser || hasInitializedRef.current) return;

    const initGroups = async () => {
      const fetchedGroups = await fetchGroups();
      // Join socket rooms for all groups
      fetchedGroups.forEach((group) => {
        joinGroupRoom(group._id);
      });
      hasInitializedRef.current = true;
    };

    initGroups();
  }, [socket, currentUser, fetchGroups, joinGroupRoom]);

  // Handle selected group change
  useEffect(() => {
    if (selectedGroup) {
      localStorage.setItem("selectedGroupId", selectedGroup._id);
      fetchGroupMessages(selectedGroup._id);
    } else {
      localStorage.removeItem("selectedGroupId");
      setGroupMessages([]);
    }
  }, [selectedGroup?._id]);

  const fetchGroupMessages = async (groupId) => {
    if (!api) return;

    setLoading(true);
    try {
      const res = await api.get(`/group-messages/${groupId}`);
      setGroupMessages(res.data);
      await api.put(`/group-messages/read/${groupId}`);
      markGroupRead(groupId);

      // Reset unread count for this group
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? { ...g, unreadCount: 0 } : g)),
      );
    } catch (err) {
      console.error("Failed to fetch group messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Socket event handlers for group messages
  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleGroupMessage = (data) => {
      const {
        groupId,
        senderId,
        message,
        timestamp,
        senderProfile,
        messageId,
      } = data;

      // Skip if this is our own message (we already added it optimistically)
      if (senderId === currentUser._id) {
        return;
      }

      // Update groups list with last message
      setGroups((prev) => {
        const idx = prev.findIndex((g) => g._id === groupId);
        if (idx === -1) return prev;

        const updated = [...prev];
        const isSelected = selectedGroupRef.current?._id === groupId;

        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            content: message,
            createdAt: timestamp,
            sender: { _id: senderId, ...senderProfile },
          },
          lastActivity: timestamp,
          unreadCount: isSelected ? 0 : (updated[idx].unreadCount || 0) + 1,
        };

        // Move to top
        const [group] = updated.splice(idx, 1);
        updated.unshift(group);
        return updated;
      });

      // Add message to current chat if viewing this group
      if (selectedGroupRef.current?._id === groupId) {
        setGroupMessages((prev) => {
          // Check for duplicate
          if (prev.some((m) => m._id === messageId)) return prev;

          return [
            ...prev,
            {
              _id: messageId || Date.now().toString(),
              content: message,
              sender: {
                _id: senderId,
                username: senderProfile?.username,
                avatar: senderProfile?.avatar,
              },
              group: groupId,
              createdAt: timestamp,
              isSending: false,
              failed: false,
            },
          ];
        });

        markGroupRead(groupId);
      }
    };

    socket.on("group_message", handleGroupMessage);

    return () => {
      socket.off("group_message", handleGroupMessage);
    };
  }, [socket, currentUser?._id, markGroupRead]);

  // Send message to group
  const sendGroupMessage = async (content) => {
    if (!selectedGroup || !content.trim() || !api) return;
    const tempId = Date.now().toString();

    const newMessage = {
      _id: tempId,
      content,
      messageType: "text",
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar || "/default-avatar.svg",
      },
      group: selectedGroup._id,
      createdAt: new Date().toISOString(),
      isSending: true,
      failed: false,
    };

    // Add message optimistically
    setGroupMessages((prev) => [...prev, newMessage]);

    // Update group list optimistically
    updateGroupList(selectedGroup._id, content);

    try {
      const res = await api.post("/group-messages", {
        groupId: selectedGroup._id,
        content,
      });

      // Update the temp message with the real one from server
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      // Send via socket for real-time delivery to other users
      sendSocketGroupMessage(selectedGroup._id, content, res.data._id);
    } catch (err) {
      console.error("Send group message error:", err);
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error("Failed to send message");
    }
  };

  // Send image to group
  const sendGroupImage = async (imageFile) => {
    if (!selectedGroup || !imageFile || !api) return;
    const tempId = Date.now().toString();

    // Create a local URL for preview
    const localImageUrl = URL.createObjectURL(imageFile);

    const newMessage = {
      _id: tempId,
      content: "",
      messageType: "image",
      imageUrl: localImageUrl,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar || "/default-avatar.svg",
      },
      group: selectedGroup._id,
      createdAt: new Date().toISOString(),
      isSending: true,
      failed: false,
    };

    // Add message optimistically
    setGroupMessages((prev) => [...prev, newMessage]);

    // Update group list optimistically with image indicator
    updateGroupList(selectedGroup._id, "📷 Image");

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("groupId", selectedGroup._id);

      const res = await api.post("/group-messages/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Clean up local URL
      URL.revokeObjectURL(localImageUrl);

      // Update the temp message with the real one from server
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      // Send via socket for real-time delivery to other users
      sendSocketGroupMessage(selectedGroup._id, "📷 Image", res.data._id);
    } catch (err) {
      console.error("Send group image error:", err);
      URL.revokeObjectURL(localImageUrl);
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error("Failed to send image");
    }
  };

  const updateGroupList = (groupId, content) => {
    const now = new Date().toISOString();
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g._id === groupId);
      if (idx === -1) return prev;

      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        lastMessage: {
          content,
          createdAt: now,
          sender: {
            _id: currentUser._id,
            username: currentUser.username,
            avatar: currentUser.avatar,
          },
        },
        lastActivity: now,
      };

      const [group] = updated.splice(idx, 1);
      updated.unshift(group);
      return updated;
    });
  };

  // Create a new group
  const createGroup = async (name, description, memberIds) => {
    if (!api) return null;

    try {
      const res = await api.post("/groups", {
        name,
        description,
        memberIds,
      });

      const newGroup = {
        ...res.data,
        lastMessage: null,
        unreadCount: 0,
      };

      setGroups((prev) => [newGroup, ...prev]);
      joinGroupRoom(newGroup._id);

      toast.success("Group created successfully!");
      return newGroup;
    } catch (err) {
      console.error("Create group error:", err);
      toast.error(err.response?.data?.message || "Failed to create group");
      return null;
    }
  };

  // Add members to group
  const addMembers = async (groupId, userIds) => {
    if (!api) return false;

    try {
      const res = await api.post(`/groups/${groupId}/members`, { userIds });

      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId ? { ...g, members: res.data.members } : g,
        ),
      );

      if (selectedGroup?._id === groupId) {
        setSelectedGroup((prev) => ({ ...prev, members: res.data.members }));
      }

      toast.success("Members added successfully!");
      return true;
    } catch (err) {
      console.error("Add members error:", err);
      toast.error(err.response?.data?.message || "Failed to add members");
      return false;
    }
  };

  // Remove member from group
  const removeMember = async (groupId, userId) => {
    if (!api) return false;

    try {
      const res = await api.delete(`/groups/${groupId}/members/${userId}`);

      setGroups((prev) =>
        prev.map((g) =>
          g._id === groupId ? { ...g, members: res.data.members } : g,
        ),
      );

      if (selectedGroup?._id === groupId) {
        setSelectedGroup((prev) => ({ ...prev, members: res.data.members }));
      }

      toast.success("Member removed successfully!");
      return true;
    } catch (err) {
      console.error("Remove member error:", err);
      toast.error(err.response?.data?.message || "Failed to remove member");
      return false;
    }
  };

  // Leave group
  const leaveGroup = async (groupId) => {
    if (!api) return false;

    try {
      await api.delete(`/groups/${groupId}/leave`);

      leaveGroupRoom(groupId);
      setGroups((prev) => prev.filter((g) => g._id !== groupId));

      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
      }

      toast.success("Left group successfully!");
      return true;
    } catch (err) {
      console.error("Leave group error:", err);
      toast.error(err.response?.data?.message || "Failed to leave group");
      return false;
    }
  };

  // Delete group (creator only)
  const deleteGroup = async (groupId) => {
    if (!api) return false;

    try {
      await api.delete(`/groups/${groupId}`);

      leaveGroupRoom(groupId);
      setGroups((prev) => prev.filter((g) => g._id !== groupId));

      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
      }

      toast.success("Group deleted successfully!");
      return true;
    } catch (err) {
      console.error("Delete group error:", err);
      toast.error(err.response?.data?.message || "Failed to delete group");
      return false;
    }
  };

  // Update group info
  const updateGroup = async (groupId, updates) => {
    if (!api) return false;

    try {
      const res = await api.put(`/groups/${groupId}`, updates);

      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? { ...g, ...res.data } : g)),
      );

      if (selectedGroup?._id === groupId) {
        setSelectedGroup((prev) => ({ ...prev, ...res.data }));
      }

      toast.success("Group updated successfully!");
      return true;
    } catch (err) {
      console.error("Update group error:", err);
      toast.error(err.response?.data?.message || "Failed to update group");
      return false;
    }
  };

  return {
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    loading,
    sendGroupMessage,
    sendGroupImage,
    createGroup,
    addMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    updateGroup,
    refreshGroups: fetchGroups,
    setGroups,
  };
};
