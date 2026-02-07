import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import toast from "react-hot-toast";

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const { socket, markRead, sendMessage: sendSocketMessage } = useSocket();
  const { api, currentUser } = useAuth();

  const selectedUserRef = useRef(selectedUser);
  const messagesRef = useRef(messages);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Fetch initial data (users and conversations)
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, conversationsRes] = await Promise.all([
        api.get("/users"),
        api.get("/messages"),
      ]);
      setUsers(usersRes.data);
      setConversations(conversationsRes.data);

      const savedUserId = localStorage.getItem("selectedUserId");
      if (savedUserId) {
        const initialSelectedUser = usersRes.data.find(
          (u) => u._id === savedUserId,
        );
        if (initialSelectedUser) setSelectedUser(initialSelectedUser);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      toast.error("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle selected user change
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUserId", selectedUser._id);
      fetchMessages(selectedUser._id);
      // Clear reply/edit state when switching conversations
      setReplyTo(null);
      setEditingMessage(null);
    } else {
      localStorage.removeItem("selectedUserId");
      setMessages([]);
    }
  }, [selectedUser]);

  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
      await api.put(`/messages/read/${userId}`);
      markRead(userId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.user._id === userId ? { ...conv, unreadCount: 0 } : conv,
        ),
      );
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (data) => {
      const otherUserId =
        data.senderId === currentUser._id ? data.receiverId : data.senderId;

      setConversations((prev) => {
        let idx = prev.findIndex((c) => c.user._id === otherUserId);
        const messageContent =
          data.messageType === "image" ? "📷 Image" : data.message;
        const newMsgForConv = {
          content: messageContent,
          createdAt: data.timestamp,
          sender: data.senderId,
        };

        if (idx === -1) {
          if (!data.senderProfile) return prev;
          const newConv = {
            _id: otherUserId,
            user: {
              _id: otherUserId,
              username: data.senderProfile.username,
              avatar: data.senderProfile.avatar,
            },
            lastMessage: newMsgForConv,
            unreadCount: 1,
          };
          return [newConv, ...prev];
        }

        const updated = [...prev];
        const isSelectedUser = selectedUserRef.current?._id === otherUserId;
        updated[idx] = {
          ...updated[idx],
          lastMessage: newMsgForConv,
          unreadCount: isSelectedUser ? 0 : (updated[idx].unreadCount || 0) + 1,
        };

        const [conv] = updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });

      if (selectedUserRef.current?._id === otherUserId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.messageId)) return prev;
          return [
            ...prev,
            {
              _id: data.messageId || Date.now().toString(),
              content: data.message || "",
              messageType: data.messageType || "text",
              imageUrl: data.imageUrl || null,
              replyTo: data.replyTo || null,
              reactions: [],
              sender: {
                _id: data.senderId,
                username: data.senderProfile?.username,
                avatar: data.senderProfile?.avatar,
              },
              receiver: { _id: data.receiverId },
              createdAt: data.timestamp,
              isRead: false,
              failed: false,
              isSending: false,
            },
          ];
        });
        markRead(data.senderId);
      }
    };

    const handleReadUpdate = ({ by }) => {
      if (selectedUserRef.current?._id === by) {
        setMessages((prev) =>
          prev.map((msg) => {
            const isMyMessage =
              msg.sender === currentUser._id ||
              msg.sender?._id === currentUser._id;
            return isMyMessage ? { ...msg, isRead: true } : msg;
          }),
        );
      }
    };

    // Handle reaction updates
    const handleReactionUpdate = (data) => {
      const { messageId, emoji, userId, username, action } = data;
      setMessages((prev) =>
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
              reactions[existingIdx] = {
                ...reactions[existingIdx],
                emoji,
              };
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
        setMessages((prev) =>
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
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content, isEdited: true, editedAt }
            : msg,
        ),
      );
    };

    socket.on("private_message", handleIncomingMessage);
    socket.on("messages_read_update", handleReadUpdate);
    socket.on("message_reaction_update", handleReactionUpdate);
    socket.on("message_deleted_update", handleDeleteUpdate);
    socket.on("message_edited_update", handleEditUpdate);

    return () => {
      socket.off("private_message", handleIncomingMessage);
      socket.off("messages_read_update", handleReadUpdate);
      socket.off("message_reaction_update", handleReactionUpdate);
      socket.off("message_deleted_update", handleDeleteUpdate);
      socket.off("message_edited_update", handleEditUpdate);
    };
  }, [socket, currentUser._id, markRead]);

  const sendMessage = async (content, replyToId = null) => {
    if (!selectedUser || !content.trim()) return;
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
      receiver: {
        _id: selectedUser._id,
        username: selectedUser.username,
        avatar: selectedUser.avatar || "/default-avatar.svg",
      },
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true,
      failed: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setReplyTo(null);

    try {
      const res = await api.post("/messages", {
        receiverId: selectedUser._id,
        content,
        replyToId: replyToId || replyTo?._id,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ||
          (msg.content === content && msg.createdAt === newMessage.createdAt)
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      // Send socket message
      sendSocketMessage(selectedUser._id, content, res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "text",
      });
      updateConversationList(selectedUser._id, content);
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error("Failed to send message");
    }
  };

  // Send image message
  const sendImage = async (imageFile, replyToId = null) => {
    if (!selectedUser || !imageFile) return;
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
      receiver: {
        _id: selectedUser._id,
        username: selectedUser.username,
        avatar: selectedUser.avatar || "/default-avatar.svg",
      },
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true,
      failed: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setReplyTo(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("receiverId", selectedUser._id);
      if (replyToId || replyTo?._id) {
        formData.append("replyToId", replyToId || replyTo._id);
      }

      const res = await api.post("/messages/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      URL.revokeObjectURL(localImageUrl);

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );

      updateConversationList(selectedUser._id, "📷 Image");
      sendSocketMessage(selectedUser._id, "📷 Image", res.data._id, {
        replyTo: res.data.replyTo,
        messageType: "image",
        imageUrl: res.data.imageUrl,
      });
    } catch (err) {
      console.error("Send image error:", err);
      URL.revokeObjectURL(localImageUrl);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg,
        ),
      );
      toast.error("Failed to send image");
    }
  };

  // React to a message
  const reactToMessage = async (messageId, emoji, targetUserId = null) => {
    if (!selectedUser) return;

    // Check if finding another user's reaction for removal (moderation)
    const message = messages.find((m) => m._id === messageId);
    const userIdToFind = targetUserId || currentUser._id;

    const existingReaction = message?.reactions?.find(
      (r) =>
        (r.user?._id === userIdToFind || r.user === userIdToFind) &&
        r.emoji === emoji,
    );

    // If we have a targetUserId, it's always a 'remove' (or no-op if no reaction found)
    const action = existingReaction || targetUserId ? "remove" : "add";

    try {
      const res = await api.post(`/messages/${messageId}/react`, {
        emoji,
        targetUserId, // Send to backend to authorize and process removal
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: res.data.reactions }
            : msg,
        ),
      );

      // Emit socket event for real-time update
      socket?.emit("message_reaction", {
        messageId,
        emoji,
        userId: userIdToFind, // The user whose reaction is affected
        receiverId: selectedUser._id,
        username: currentUser.username,
        action,
      });
    } catch (err) {
      console.error("React to message error:", err);
      toast.error(
        targetUserId ? "Failed to remove reaction" : "Failed to react",
      );
    }
  };

  // Delete message for me
  const deleteForMe = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}/delete-for-me`);

      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      toast.success("Message deleted for you");
    } catch (err) {
      console.error("Delete for me error:", err);
      toast.error("Failed to delete message");
    }
  };

  // Delete message for everyone
  const deleteForEveryone = async (messageId) => {
    if (!selectedUser) return;

    try {
      const res = await api.delete(
        `/messages/${messageId}/delete-for-everyone`,
      );

      setMessages((prev) =>
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

      // Emit socket event
      socket?.emit("message_deleted", {
        messageId,
        receiverId: selectedUser._id,
        deleteType: "everyone",
      });

      toast.success("Message deleted for everyone");
    } catch (err) {
      console.error("Delete for everyone error:", err);
      toast.error(err.response?.data?.message || "Failed to delete message");
    }
  };

  // Edit message
  const editMessage = async (messageId, content) => {
    if (!selectedUser) return;

    try {
      const res = await api.put(`/messages/${messageId}/edit`, { content });

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, content, isEdited: true, editedAt: res.data.editedAt }
            : msg,
        ),
      );

      // Emit socket event
      socket?.emit("message_edited", {
        messageId,
        content,
        receiverId: selectedUser._id,
        editedAt: res.data.editedAt,
      });

      setEditingMessage(null);
      toast.success("Message edited");
    } catch (err) {
      console.error("Edit message error:", err);
      toast.error(err.response?.data?.message || "Failed to edit message");
    }
  };

  const updateConversationList = (userId, content) => {
    const now = new Date().toISOString();
    setConversations((prev) => {
      const idx = prev.findIndex((c) => c.user._id === userId);
      const updated = [...prev];
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          lastMessage: { content, createdAt: now, sender: currentUser._id },
        };
        const [conv] = updated.splice(idx, 1);
        updated.unshift(conv);
      } else {
        const user = users.find((u) => u._id === userId);
        if (user) {
          updated.unshift({
            _id: userId,
            user,
            lastMessage: { content, createdAt: now, sender: currentUser._id },
            unreadCount: 0,
          });
        }
      }
      return updated;
    });
  };

  const removeContact = async (userId) => {
    try {
      await api.delete(`/users/contacts/${userId}`);
      setConversations((prev) =>
        prev.filter((c) => c._id !== userId && c.user?._id !== userId),
      );
      if (selectedUserRef.current?._id === userId) {
        setSelectedUser(null);
        setMessages([]);
      }
      return true;
    } catch (err) {
      console.error("Remove contact error:", err);
      toast.error("Failed to remove contact");
      return false;
    }
  };

  const blockUser = async (userId) => {
    try {
      await api.post(`/users/block/${userId}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.user?._id === userId
            ? { ...c, user: { ...c.user, blockedByMe: true } }
            : c,
        ),
      );
      if (selectedUserRef.current?._id === userId) {
        setSelectedUser((prev) => ({ ...prev, blockedByMe: true }));
      }
      toast.success("User blocked");
      return true;
    } catch (err) {
      console.error("Block user error:", err);
      toast.error("Failed to block user");
      return false;
    }
  };

  const unblockUser = async (userId) => {
    try {
      await api.post(`/users/unblock/${userId}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.user?._id === userId
            ? { ...c, user: { ...c.user, blockedByMe: false } }
            : c,
        ),
      );
      if (selectedUserRef.current?._id === userId) {
        setSelectedUser((prev) => ({ ...prev, blockedByMe: false }));
      }
      toast.success("User unblocked");
      return true;
    } catch (err) {
      console.error("Unblock user error:", err);
      toast.error("Failed to unblock user");
      return false;
    }
  };

  return {
    conversations,
    users,
    selectedUser,
    setSelectedUser,
    messages,
    loading,
    sendMessage,
    sendImage,
    reactToMessage,
    deleteForMe,
    deleteForEveryone,
    editMessage,
    replyTo,
    setReplyTo,
    editingMessage,
    setEditingMessage,
    setConversations,
    setMessages,
    refreshConversations: fetchInitialData,
    removeContact,
    blockUser,
    unblockUser,
  };
};
