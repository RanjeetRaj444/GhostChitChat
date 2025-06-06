import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSocket } from "../contexts/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import UserProfileModal from "../components/UserProfileModal";

function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { socket, isUserOnline, isUserTyping, sendTypingStatus, sendMessage } =
    useSocket();
  const { api, currentUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const messagesRef = useRef(messages);
  const selectedUserRef = useRef(selectedUser);

  // Sync refs for socket event handlers
  useEffect(() => {
    messagesRef.current = messages;
    selectedUserRef.current = selectedUser;
  }, [messages, selectedUser]);

  // Load users and conversations on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [usersRes, conversationsRes] = await Promise.all([
          api.get("/users"),
          api.get("/messages"),
        ]);
        setUsers(usersRes.data);

        // Restore selected user from localStorage if exists and present in users
        const savedUserId = localStorage.getItem("selectedUserId");
        let initialSelectedUser = null;
        if (savedUserId) {
          initialSelectedUser =
            usersRes.data.find((u) => u._id === savedUserId) || null;
        }
        setSelectedUser(initialSelectedUser);

        setConversations(conversationsRes.data);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [api]);

  // Save selected user id to localStorage on change
  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUserId", selectedUser._id);
    } else {
      localStorage.removeItem("selectedUserId");
    }
  }, [selectedUser]);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
        await api.put(`/messages/read/${selectedUser._id}`); // mark read
        setConversations((prev) =>
          prev.map((conv) =>
            conv.user._id === selectedUser._id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedUser, api]);

  // Socket event: handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (data) => {
      // Check if the message involves current user
      const otherUserId =
        data.senderId === currentUser._id ? data.receiverId : data.senderId;

      setConversations((prev) => {
        let idx = prev.findIndex((c) => c.user._id === otherUserId);
        if (idx === -1) return prev;

        const updated = [...prev];
        const isSelectedUser = selectedUserRef.current?._id === otherUserId;

        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            content: data.message,
            createdAt: data.timestamp,
            sender: data.senderId,
          },
          unreadCount: isSelectedUser ? 0 : (updated[idx].unreadCount || 0) + 1,
        };

        // Move updated conversation to top
        const [conv] = updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });

      // Add message to messages if current chat
      if (selectedUserRef.current?._id === otherUserId) {
        setMessages((prev) => [
          ...prev,
          {
            _id: data.messageId || Date.now().toString(),
            content: data.message,
            sender: { _id: data.senderId },
            receiver: { _id: data.receiverId },
            createdAt: data.timestamp,
            isRead: false,
            failed: false,
            isSending: false,
          },
        ]);
      }
    };

    socket.on("private_message", handleIncomingMessage);
    return () => {
      socket.off("private_message", handleIncomingMessage);
    };
  }, [socket, currentUser._id]);

  // Send message handler
  const handleSendMessage = async (content) => {
    if (!selectedUser || !content.trim()) return;
    const tempId = Date.now().toString();

    const newMessage = {
      _id: tempId,
      content,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      receiver: {
        _id: selectedUser._id,
        username: selectedUser.username,
        avatar: selectedUser.avatar,
      },
      createdAt: new Date().toISOString(),
      isRead: false,
      isSending: true,
      failed: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    sendMessage(selectedUser._id, content, tempId);

    try {
      const res = await api.post("/messages", {
        receiverId: selectedUser._id,
        content,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...res.data, isSending: false, failed: false }
            : msg
        )
      );
      updateConversationList(selectedUser._id, content);
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...msg, isSending: false, failed: true } : msg
        )
      );
    }
  };

  const updateConversationList = (userId, content) => {
    const now = new Date().toISOString();
    setConversations((prevConversations) => {
      const idx = prevConversations.findIndex((c) => c.user._id === userId);
      if (idx !== -1) {
        const updated = [...prevConversations];
        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            content,
            createdAt: now,
            sender: currentUser._id,
          },
        };
        const [conv] = updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      } else {
        const user = users.find((u) => u._id === userId);
        if (user) {
          const newConv = {
            _id: userId,
            user,
            lastMessage: {
              content,
              createdAt: now,
              sender: currentUser._id,
            },
            unreadCount: 0,
          };
          return [newConv, ...prevConversations];
        }
        return prevConversations;
      }
    });
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const handleTyping = (isTyping) => {
    if (selectedUser) {
      sendTypingStatus(selectedUser._id, isTyping);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <div className="flex h-full">
        <Sidebar
          conversations={conversations}
          users={users}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onLogout={logout}
          onOpenProfile={() => setShowProfileModal(true)}
          currentUser={currentUser}
          isUserOnline={isUserOnline}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              <ChatHeader
                user={selectedUser}
                isOnline={isUserOnline(selectedUser._id)}
                isTyping={isUserTyping(selectedUser._id)}
                onBack={() => setSelectedUser(null)}
              />

              <ChatWindow
                messages={messages}
                currentUser={currentUser}
                selectedUser={selectedUser}
                loading={loading}
              />

              <ChatInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-chat dark:shadow-chat-dark max-w-md animate-fade-in">
                <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                  Welcome to ChitChat!
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  Select a conversation from the sidebar or start a new chat to
                  begin messaging.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (users.length > 0) {
                        handleSelectUser(users[0]);
                      }
                    }}
                    className="btn btn-primary"
                    disabled={users.length === 0}
                  >
                    Start a New Chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showProfileModal && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdate={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

export default ChatPage;
