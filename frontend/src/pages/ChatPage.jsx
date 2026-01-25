import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSocket } from "../contexts/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import UserProfileModal from "../components/UserProfileModal";

import toast from "react-hot-toast";

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
        await api.put(`/messages/read/${selectedUser._id}`); // mark read in DB
        markRead(selectedUser._id); // mark read in Realtime
        setConversations((prev) =>
          prev.map((conv) =>
            conv.user._id === selectedUser._id
              ? { ...conv, unreadCount: 0 }
              : conv,
          ),
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

        const newMsgForConv = {
          content: data.message,
          createdAt: data.timestamp,
          sender: data.senderId,
        };

        if (idx === -1) {
          // New conversation!
          if (!data.senderProfile) return prev; // Safety check

          const newConv = {
            _id: otherUserId, // Using user ID as conversation ID for safety
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

        // Move updated conversation to top
        const [conv] = updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      });

      // Add message to messages if current chat
      if (selectedUserRef.current?._id === otherUserId) {
        setMessages((prev) => {
          // Prevent duplicates
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
              receiver: { _id: data.receiverId }, // Context: current user is receiver
              createdAt: data.timestamp,
              isRead: false,
              failed: false,
              isSending: false,
            },
          ];
        });

        // Critical Fix: Immediately mark the new incoming message as read if we are looking at it
        markRead(data.senderId);
      }
    };

    socket.on("private_message", handleIncomingMessage);

    // Listen for read receipts (Real-time Double Ticks)
    socket.on("messages_read_update", ({ by, readAt }) => {
      console.log(`[Client] Received read receipt from: ${by}`);

      // Update the messages state locally to show double ticks
      setMessages((prev) =>
        prev.map((msg) => {
          // If the message is in the current chat, and I sent it, and the other person ('by') read it
          const isMyMessage =
            msg.sender === currentUser._id ||
            msg.sender?._id === currentUser._id;

          if (isMyMessage && selectedUserRef.current?._id === by) {
            return { ...msg, isRead: true };
          }
          return msg;
        }),
      );
    });

    return () => {
      socket.off("private_message", handleIncomingMessage);
      socket.off("messages_read_update");
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
    sendMessage(selectedUser._id, content, tempId);

    try {
      const res = await api.post("/messages", {
        receiverId: selectedUser._id,
        content,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          // Robust ID matching: Match tempId OR if we unknowingly added it via socket already
          msg._id === tempId ||
          (msg.content === content && msg.createdAt === newMessage.createdAt)
            ? {
                ...res.data,
                isSending: false,
                failed: false,
                isRead: msg.isRead || res.data.isRead,
              }
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

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <div className="flex h-full relative">
        <div className={`${selectedUser ? "hidden md:flex" : "flex"} h-full`}>
          <Sidebar
            conversations={conversations}
            users={users}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            onLogout={handleLogout}
            onOpenProfile={() => setShowProfileModal(true)}
            currentUser={currentUser}
            isUserOnline={isUserOnline}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
          />
        </div>

        <div
          className={`flex-1 flex flex-col overflow-hidden ${selectedUser ? "flex" : "hidden md:flex"}`}
        >
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/50">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/10 rounded-full blur-3xl rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-accent-500/10 rounded-full blur-3xl rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
              </div>

              <div className="relative z-10 max-w-2xl px-6">
                <div className="mb-8 flex justify-center">
                  <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-xl shadow-primary-500/10 ring-1 ring-black/5 dark:ring-white/10 animate-fade-in">
                    <img
                      src="/vite.svg"
                      alt="Logo"
                      className="w-20 h-20 opacity-80"
                    />
                  </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight">
                  Welcome to{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                    ChitChat
                  </span>
                </h1>

                <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-lg mx-auto leading-relaxed">
                  Connect freely, chat securely. Select a conversation from the
                  sidebar to start talking, or invite someone new.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!conversations.length && (
                    <button
                      onClick={() => {
                        if (users.length > 0) {
                          handleSelectUser(users[0]);
                        }
                      }}
                      className="btn btn-primary px-8 py-3 rounded-full text-lg shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50 hover:-translate-y-0.5 transition-all duration-300"
                      disabled={users.length === 0}
                    >
                      Start Messaging
                    </button>
                  )}
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
