import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import toast from "react-hot-toast";

export const useGroupChat = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const {
    socket,
    joinGroupRoom,
    leaveGroupRoom,
    sendGroupMessage: sendSocketGroupMessage,
    markGroupRead,
  } = useSocket();
  const { api, currentUser, setCurrentUser } = useAuth();

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
    if (!api || !currentUser) return [];

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
      setReplyTo(null);
      setEditingMessage(null);
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

      if (senderId === currentUser._id) {
        return;
      }

      setGroups((prev) => {
        const idx = prev.findIndex((g) => g._id === groupId);
        if (idx === -1) return prev;

        const updated = [...prev];
        const isSelected = selectedGroupRef.current?._id === groupId;

        const messageContent =
          data.messageType === "image"
            ? "📷 Image"
            : data.messageType === "video"
              ? "🎥 Video"
              : data.messageType === "audio"
                ? "🎵 Audio"
                : data.messageType === "file"
                  ? "📄 Document"
                  : message;

        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            content: messageContent,
            createdAt: timestamp,
            sender: { _id: senderId, ...senderProfile },
          },
          lastActivity: timestamp,
          unreadCount: isSelected ? 0 : (updated[idx].unreadCount || 0) + 1,
        };

        const [group] = updated.splice(idx, 1);
        updated.unshift(group);
        return updated;
      });

      if (selectedGroupRef.current?._id === groupId) {
        setGroupMessages((prev) => {
          if (prev.some((m) => m._id === messageId)) return prev;

          return [
            ...prev,
            {
              _id: messageId || Date.now().toString(),
              content: message,
              messageType: data.messageType || "text",
              imageUrl: data.imageUrl || null,
              videoUrl: data.videoUrl || null,
              audioUrl: data.audioUrl || null,
              fileUrl: data.fileUrl || null,
              fileName: data.fileName || null,
              replyTo: data.replyTo || null,
              reactions: [],
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

    // Handle reaction updates
    const handleReactionUpdate = (data) => {
      const { messageId, emoji, userId, username, action } = data;
      setGroupMessages((prev) =>
        prev.map((msg) => {
          if (msg._id !== messageId) return msg;
          let reactions = [...(msg.reactions || [])];

          if (action === "remove") {
            reactions = reactions.filter(
              (r) => !(r.user?._id === userId || r.user === userId),
            );
          } else {
            const existingIdx = reactions.findIndex(
              (r) => r.user?._id === userId || r.user === userId,
            );
            if (existingIdx > -1) {
              reactions[existingIdx] = { ...reactions[existingIdx], emoji };
            } else {
              reactions.push({
                user: { _id: userId, username },
                emoji,
                createdAt: new Date().toISOString(),
              });
            }
          }

          return { ...msg, reactions };
        }),
      );
    };

    // Handle delete updates
    const handleDeleteUpdate = (data) => {
      const { messageId, deleteType } = data;
      if (deleteType === "everyone") {
        setGroupMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  deletedForEveryone: true,
                  content: "",
                  imageUrl: null,
                }
              : msg,
          ),
        );
      }
    };

    // Handle edit updates
    const handleEditUpdate = (data) => {
      const { messageId, content, editedAt } = data;
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content, isEdited: true, editedAt }
            : msg,
        ),
      );
    };

    socket.on("group_message", handleGroupMessage);
    socket.on("group_message_reaction_update", handleReactionUpdate);
    socket.on("group_message_deleted_update", handleDeleteUpdate);
    socket.on("group_message_edited_update", handleEditUpdate);

    return () => {
      socket.off("group_message", handleGroupMessage);
      socket.off("group_message_reaction_update", handleReactionUpdate);
      socket.off("group_message_deleted_update", handleDeleteUpdate);
      socket.off("group_message_edited_update", handleEditUpdate);
    };
  }, [socket, currentUser?._id, markGroupRead]);

  // Send message to group
  const sendGroupMessage = async (content, replyToId = null) => {
    if (!selectedGroup || !content.trim() || !api) return;
    const tempId = Date.now().toString();

    const newMessage = {
      _id: tempId,
      content,
      messageType: "text",
      replyTo: replyTo || null,
      reactions: [],
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

    setGroupMessages((prev) => [...prev, newMessage]);
    updateGroupList(selectedGroup._id, content);
    setReplyTo(null);

    try {
      const res = await api.post("/group-messages", {
        groupId: selectedGroup._id,
        content,
        replyToId: replyToId || replyTo?._id,
      });

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      sendSocketGroupMessage(selectedGroup._id, content, res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "text",
      });
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
  const sendGroupImage = async (imageFile, replyToId = null) => {
    if (!selectedGroup || !imageFile || !api) return;
    const tempId = Date.now().toString();

    const localImageUrl = URL.createObjectURL(imageFile);

    const newMessage = {
      _id: tempId,
      content: "",
      messageType: "image",
      imageUrl: localImageUrl,
      replyTo: replyTo || null,
      reactions: [],
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

    setGroupMessages((prev) => [...prev, newMessage]);
    updateGroupList(selectedGroup._id, "📷 Image");
    setReplyTo(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("groupId", selectedGroup._id);
      if (replyToId || replyTo?._id) {
        formData.append("replyToId", replyToId || replyTo._id);
      }

      const res = await api.post("/group-messages/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      URL.revokeObjectURL(localImageUrl);

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      sendSocketGroupMessage(selectedGroup._id, "📷 Image", res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "image",
        imageUrl: res.data.imageUrl,
      });
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

  // Send video to group
  const sendGroupVideo = async (videoFile, replyToId = null) => {
    if (!selectedGroup || !videoFile || !api) return;

    // Check file size (5MB limit)
    if (videoFile.size > 5 * 1024 * 1024) {
      toast.error("Video size must be less than 5MB");
      return;
    }

    const tempId = Date.now().toString();
    const localVideoUrl = URL.createObjectURL(videoFile);

    const newMessage = {
      _id: tempId,
      content: "",
      messageType: "video",
      videoUrl: localVideoUrl,
      replyTo: replyTo || null,
      reactions: [],
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

    setGroupMessages((prev) => [...prev, newMessage]);
    updateGroupList(selectedGroup._id, "🎥 Video");
    setReplyTo(null);

    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("groupId", selectedGroup._id);
      if (replyToId || replyTo?._id) {
        formData.append("replyToId", replyToId || replyTo._id);
      }

      const res = await api.post("/group-messages/video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      URL.revokeObjectURL(localVideoUrl);

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      sendSocketGroupMessage(selectedGroup._id, "🎥 Video", res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "video",
        videoUrl: res.data.videoUrl,
      });
    } catch (err) {
      console.error("Send group video error:", err);
      URL.revokeObjectURL(localVideoUrl);
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error(err.response?.data?.message || "Failed to send video");
    }
  };

  // Send audio to group
  const sendGroupAudio = async (audioFile, replyToId = null) => {
    if (!selectedGroup || !audioFile || !api) return;

    if (audioFile.size > 5 * 1024 * 1024) {
      toast.error("Audio size must be less than 5MB");
      return;
    }

    const tempId = Date.now().toString();
    const localAudioUrl = URL.createObjectURL(audioFile);

    const newMessage = {
      _id: tempId,
      content: "",
      messageType: "audio",
      audioUrl: localAudioUrl,
      replyTo: replyTo || null,
      reactions: [],
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

    setGroupMessages((prev) => [...prev, newMessage]);
    updateGroupList(selectedGroup._id, "🎵 Audio");
    setReplyTo(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("groupId", selectedGroup._id);
      if (replyToId || replyTo?._id) {
        formData.append("replyToId", replyToId || replyTo._id);
      }

      const res = await api.post("/group-messages/audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      URL.revokeObjectURL(localAudioUrl);

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      sendSocketGroupMessage(selectedGroup._id, "🎵 Audio", res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "audio",
        audioUrl: res.data.audioUrl,
      });
    } catch (err) {
      console.error("Send group audio error:", err);
      URL.revokeObjectURL(localAudioUrl);
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error(err.response?.data?.message || "Failed to send audio");
    }
  };

  // Send file to group
  const sendGroupFile = async (file, replyToId = null) => {
    if (!selectedGroup || !file || !api) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const tempId = Date.now().toString();

    const newMessage = {
      _id: tempId,
      content: "",
      messageType: "file",
      fileName: file.name,
      fileUrl: null,
      replyTo: replyTo || null,
      reactions: [],
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

    setGroupMessages((prev) => [...prev, newMessage]);
    updateGroupList(selectedGroup._id, "📄 Document");
    setReplyTo(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", selectedGroup._id);
      if (replyToId || replyTo?._id) {
        formData.append("replyToId", replyToId || replyTo._id);
      }

      const res = await api.post("/group-messages/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      sendSocketGroupMessage(selectedGroup._id, "📄 Document", res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "file",
        fileUrl: res.data.fileUrl,
        fileName: res.data.fileName,
      });
    } catch (err) {
      console.error("Send group file error:", err);
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error(err.response?.data?.message || "Failed to send file");
    }
  };

  // React to a group message
  const reactToMessage = async (messageId, emoji, targetUserId = null) => {
    if (!selectedGroup) return;

    // Check if finding another user's reaction for removal (moderation)
    const message = groupMessages.find((m) => m._id === messageId);
    const userIdToFind = targetUserId || currentUser._id;

    const existingReaction = message?.reactions?.find(
      (r) =>
        (r.user?._id === userIdToFind || r.user === userIdToFind) &&
        r.emoji === emoji,
    );

    // If we have a targetUserId, it's always a 'remove' (or no-op if no reaction found)
    const action = existingReaction || targetUserId ? "remove" : "add";

    try {
      const res = await api.post(`/group-messages/${messageId}/react`, {
        emoji,
        targetUserId, // Send to backend to authorize and process removal
      });

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: res.data.reactions }
            : msg,
        ),
      );

      socket?.emit("group_message_reaction", {
        groupId: selectedGroup._id,
        messageId,
        emoji,
        userId: userIdToFind, // The user whose reaction is affected
        username: currentUser.username,
        action,
      });
    } catch (err) {
      console.error("React to group message error:", err);
      toast.error(
        targetUserId ? "Failed to remove reaction" : "Failed to react",
      );
    }
  };

  // Delete group message for me
  const deleteForMe = async (messageId) => {
    try {
      await api.delete(`/group-messages/${messageId}/delete-for-me`);

      setGroupMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      toast.success("Message deleted for you");
    } catch (err) {
      console.error("Delete for me error:", err);
      toast.error("Failed to delete message");
    }
  };

  // Delete group message for everyone
  const deleteForEveryone = async (messageId) => {
    if (!selectedGroup) return;

    try {
      await api.delete(`/group-messages/${messageId}/delete-for-everyone`);

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, deletedForEveryone: true, content: "", imageUrl: null }
            : msg,
        ),
      );

      socket?.emit("group_message_deleted", {
        groupId: selectedGroup._id,
        messageId,
        deleteType: "everyone",
      });

      toast.success("Message deleted for everyone");
    } catch (err) {
      console.error("Delete for everyone error:", err);
      toast.error(err.response?.data?.message || "Failed to delete message");
    }
  };

  // Edit group message
  const editMessage = async (messageId, content) => {
    if (!selectedGroup) return;

    try {
      const res = await api.put(`/group-messages/${messageId}/edit`, {
        content,
      });

      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content, isEdited: true, editedAt: res.data.editedAt }
            : msg,
        ),
      );

      socket?.emit("group_message_edited", {
        groupId: selectedGroup._id,
        messageId,
        content,
        editedAt: res.data.editedAt,
      });

      setEditingMessage(null);
      toast.success("Message edited");
    } catch (err) {
      console.error("Edit group message error:", err);
      toast.error(err.response?.data?.message || "Failed to edit message");
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
      const res = await api.post("/groups", { name, description, memberIds });

      const newGroup = { ...res.data, lastMessage: null, unreadCount: 0 };

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

  const toggleGroupStar = async (messageId) => {
    try {
      const res = await api.post(`/group-messages/${messageId}/star`);
      setGroupMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, starredBy: res.data.starredBy } : m,
        ),
      );
      toast.success(
        res.data.isStarred ? "Message starred" : "Message unstarred",
      );
      return true;
    } catch (err) {
      console.error("Star message error:", err);
      toast.error("Failed to star message");
      return false;
    }
  };

  // Clear group chat history
  const clearGroupChat = async (groupId, keepStarred = false) => {
    if (!api) return false;
    try {
      await api.delete(
        `/group-messages/clear/${groupId}?keepStarred=${keepStarred}`,
      );
      if (selectedGroupRef.current?._id === groupId && !keepStarred) {
        setGroupMessages([]);
      } else if (selectedGroupRef.current?._id === groupId && keepStarred) {
        // Optimistically filter locally if keepStarred is true
        setGroupMessages((prev) =>
          prev.filter((m) =>
            m.starredBy?.some(
              (id) => (id._id || id).toString() === currentUser._id.toString(),
            ),
          ),
        );
      }
      // Update groups list to remove last message preview if not keeping starred
      if (!keepStarred) {
        setGroups((prev) =>
          prev.map((g) =>
            g._id === groupId ? { ...g, lastMessage: null } : g,
          ),
        );
      }
      toast.success("Group chat cleared");
      return true;
    } catch (err) {
      console.error("Clear group chat error:", err);
      toast.error("Failed to clear group chat");
      return false;
    }
  };

  const muteGroup = async (groupId) => {
    try {
      const res = await api.post(`/users/mute/${groupId}`, { type: "group" });
      setCurrentUser((prev) => ({
        ...prev,
        mutedGroups: res.data.mutedGroups,
      }));
      toast.success(res.data.isMuted ? "Group muted" : "Group unmuted");
      return true;
    } catch (err) {
      console.error("Mute group error:", err);
      toast.error("Failed to update mute status");
      return false;
    }
  };

  const toggleGroupFavorite = async (groupId) => {
    try {
      const res = await api.post(`/users/favorite/${groupId}`, {
        type: "group",
      });
      setCurrentUser((prev) => ({
        ...prev,
        favoriteGroups: res.data.favoriteGroups,
      }));
      toast.success(
        res.data.isFavorite
          ? "Group added to favorites"
          : "Group removed from favorites",
      );
      return true;
    } catch (err) {
      console.error("Favorite group error:", err);
      toast.error("Failed to update favorite status");
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
    reactToMessage,
    deleteForMe,
    deleteForEveryone,
    editMessage,
    replyTo,
    setReplyTo,
    editingMessage,
    setEditingMessage,
    createGroup,
    addMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    updateGroup,
    refreshGroups: fetchGroups,
    setGroups,
    clearGroupChat,
    muteGroup,
    toggleGroupFavorite,
    toggleGroupStar,
    sendGroupVideo,
    sendGroupAudio,
    sendGroupFile,
  };
};
