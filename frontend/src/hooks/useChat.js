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
        const newMsgForConv = {
          content: data.message,
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
              content: data.message,
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

    socket.on("private_message", handleIncomingMessage);
    socket.on("messages_read_update", handleReadUpdate);

    return () => {
      socket.off("private_message", handleIncomingMessage);
      socket.off("messages_read_update", handleReadUpdate);
    };
  }, [socket, currentUser._id, markRead]);

  const sendMessage = async (content) => {
    if (!selectedUser || !content.trim()) return;
    const tempId = Date.now().toString();

    const newMessage = {
      _id: tempId,
      content,
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
    sendSocketMessage(selectedUser._id, content, tempId);

    try {
      const res = await api.post("/messages", {
        receiverId: selectedUser._id,
        content,
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ||
          (msg.content === content && msg.createdAt === newMessage.createdAt)
            ? { ...res.data, isSending: false, failed: false }
            : msg,
        ),
      );
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

  return {
    conversations,
    users,
    selectedUser,
    setSelectedUser,
    messages,
    loading,
    sendMessage,
    setConversations,
    setMessages,
  };
};
