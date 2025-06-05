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
  const { socket } = useSocket();
  const messagesRef = useRef(messages);
  const selectedUserRef = useRef(selectedUser);

  const { api, currentUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { isUserOnline, isUserTyping, sendTypingStatus, sendMessage } = useSocket();

  // Restore selected user after users are loaded
  useEffect(() => {
    const savedUserId = localStorage.getItem("selectedUserId");
    if (savedUserId && users.length > 0) {
      const user = users.find((u) => u._id === savedUserId);
      if (user) setSelectedUser(user);
    }
  }, [users]);

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem("selectedUserId", selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesRef.current = messages;
    selectedUserRef.current = selectedUser;
  }, [messages, selectedUser]);

  // Fetch users first, then conversations
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const usersRes = await api.get("/users");
        setUsers(usersRes.data);
        const conversationsRes = await api.get("/messages");
        setConversations(conversationsRes.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [api]);

  // Fetch messages only when selectedUser is set and users are loaded
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      try {
        setLoading(true);
        const res = await api.get(`/messages/${selectedUser._id}`);
        setMessages(res.data);
        await api.put(`/messages/read/${selectedUser._id}`);
        setConversations((prev) =>
          prev.map((conv) =>
            conv.user._id === selectedUser._id
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedUser, api, users.length]);

  useEffect(() => {
    if (!socket) return;
    const handleIncomingMessage = (data) => {
      setConversations((prev) => {
        const idx = prev.findIndex(
          (c) => c.user._id === data.senderId || c.user._id === data.receiverId
        );
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            lastMessage: {
              content: data.message,
              createdAt: data.timestamp,
              sender: data.senderId,
            },
            unreadCount:
              selectedUserRef.current &&
              (data.senderId === selectedUserRef.current._id ||
                data.receiverId === selectedUserRef.current._id)
                ? 0
                : (updated[idx].unreadCount || 0) + 1,
          };
          const [conv] = updated.splice(idx, 1);
          updated.unshift(conv);
          return updated;
        } else {
          return prev;
        }
      });

      // Only add message if it's for the currently selected user
      if (
        selectedUserRef.current &&
        (data.senderId === selectedUserRef.current._id ||
          data.receiverId === selectedUserRef.current._id)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: Date.now().toString(),
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
  }, [socket]);

  const handleSendMessage = async (content) => {
    if (!selectedUser || !content.trim()) return;
    const tempId = Date.now().toString();
    try {
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
    } catch (error) {
      console.error("Error sending message:", error);
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
      const existingIndex = prevConversations.findIndex(
        (c) => c.user._id === userId
      );
      if (existingIndex > -1) {
        const updatedConversations = [...prevConversations];
        updatedConversations[existingIndex] = {
          ...updatedConversations[existingIndex],
          lastMessage: {
            ...updatedConversations[existingIndex].lastMessage,
            content,
            createdAt: now,
            sender: currentUser._id,
          },
        };
        const [updated] = updatedConversations.splice(existingIndex, 1);
        updatedConversations.unshift(updated);
        return updatedConversations;
      } else {
        const user = users.find((u) => u._id === userId);
        if (user) {
          const newConversation = {
            _id: userId,
            user,
            lastMessage: {
              content,
              createdAt: now,
              sender: currentUser._id,
            },
            unreadCount: 0,
          };
          return [newConversation, ...prevConversations];
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