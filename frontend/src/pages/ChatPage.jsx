import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useSocket } from "../contexts/SocketContext";
import { useChat } from "../hooks/useChat";
import { useGroupChat } from "../hooks/useGroupChat";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";
import UserProfileModal from "../components/UserProfileModal";
import CreateGroupModal from "../components/CreateGroupModal";
import GroupChatHeader from "../components/GroupChatHeader";
import GroupInfoModal from "../components/GroupInfoModal";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function ChatPage() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);

  const {
    isUserOnline,
    isUserTyping,
    sendTypingStatus,
    getGroupTypingUsers,
    sendGroupTypingStatus,
  } = useSocket();
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Private chat hooks
  const {
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
  } = useChat();

  // Group chat hooks
  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    loading: groupLoading,
    sendGroupMessage,
    sendGroupImage,
    reactToMessage: reactToGroupMessage,
    deleteForMe: deleteGroupForMe,
    deleteForEveryone: deleteGroupForEveryone,
    editMessage: editGroupMessage,
    replyTo: groupReplyTo,
    setReplyTo: setGroupReplyTo,
    editingMessage: groupEditingMessage,
    setEditingMessage: setGroupEditingMessage,
    createGroup,
    addMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    updateGroup,
  } = useGroupChat();

  const handleTyping = (isTyping) => {
    if (selectedUser) {
      sendTypingStatus(selectedUser._id, isTyping);
    } else if (selectedGroup) {
      sendGroupTypingStatus(selectedGroup._id, isTyping);
    }
  };

  const handleSendMessage = async (content, replyToId) => {
    if (selectedUser) {
      await sendMessage(content, replyToId);
    } else if (selectedGroup) {
      await sendGroupMessage(content, replyToId);
    }
  };

  const handleSendImage = async (imageFile, replyToId) => {
    if (selectedUser) {
      await sendImage(imageFile, replyToId);
    } else if (selectedGroup) {
      await sendGroupImage(imageFile, replyToId);
    }
  };

  const handleReply = (message) => {
    if (selectedUser) {
      setReplyTo(message);
      setEditingMessage(null);
    } else if (selectedGroup) {
      setGroupReplyTo(message);
      setGroupEditingMessage(null);
    }
  };

  const handleCancelReply = () => {
    if (selectedUser) {
      setReplyTo(null);
    } else if (selectedGroup) {
      setGroupReplyTo(null);
    }
  };

  const handleReact = async (messageId, emoji) => {
    if (selectedUser) {
      await reactToMessage(messageId, emoji);
    } else if (selectedGroup) {
      await reactToGroupMessage(messageId, emoji);
    }
  };

  const handleDeleteForMe = async (messageId) => {
    if (selectedUser) {
      await deleteForMe(messageId);
    } else if (selectedGroup) {
      await deleteGroupForMe(messageId);
    }
  };

  const handleDeleteForEveryone = async (messageId) => {
    if (selectedUser) {
      await deleteForEveryone(messageId);
    } else if (selectedGroup) {
      await deleteGroupForEveryone(messageId);
    }
  };

  const handleEdit = (message) => {
    if (selectedUser) {
      setEditingMessage(message);
      setReplyTo(null);
    } else if (selectedGroup) {
      setGroupEditingMessage(message);
      setGroupReplyTo(null);
    }
  };

  const handleCancelEdit = () => {
    if (selectedUser) {
      setEditingMessage(null);
    } else if (selectedGroup) {
      setGroupEditingMessage(null);
    }
  };

  const handleEditMessage = async (messageId, content) => {
    if (selectedUser) {
      await editMessage(messageId, content);
    } else if (selectedGroup) {
      await editGroupMessage(messageId, content);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleSelectUser = (user) => {
    setSelectedGroup(null);
    setSelectedUser(user);
    // Clear reply/edit state
    setReplyTo(null);
    setEditingMessage(null);
  };

  const handleSelectGroup = (group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
    // Clear reply/edit state
    setGroupReplyTo(null);
    setGroupEditingMessage(null);
  };

  // Count online members in a group
  const getOnlineCount = () => {
    if (!selectedGroup?.members) return 0;
    return selectedGroup.members.filter((m) => isUserOnline(m._id || m)).length;
  };

  // Determine current chat state
  const hasActiveChat = selectedUser || selectedGroup;
  const currentLoading = selectedGroup ? groupLoading : loading;
  const currentMessages = selectedGroup ? groupMessages : messages;
  const currentReplyTo = selectedGroup ? groupReplyTo : replyTo;
  const currentEditingMessage = selectedGroup
    ? groupEditingMessage
    : editingMessage;

  return (
    <div className="h-[100dvh] flex flex-col bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <div className="flex h-full relative">
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${hasActiveChat ? "hidden md:flex" : "flex"} h-full`}
        >
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
            // Group props
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
            onCreateGroupClick={() => setShowCreateGroupModal(true)}
          />
        </motion.div>

        <main
          className={`flex-1 flex flex-col overflow-hidden ${hasActiveChat ? "flex" : "hidden md:flex"}`}
        >
          <AnimatePresence mode="wait">
            {hasActiveChat ? (
              <motion.div
                key={selectedUser?._id || selectedGroup?._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {selectedUser ? (
                  <ChatHeader
                    user={selectedUser}
                    isOnline={isUserOnline(selectedUser._id)}
                    isTyping={isUserTyping(selectedUser._id)}
                    onBack={() => setSelectedUser(null)}
                  />
                ) : (
                  <GroupChatHeader
                    group={selectedGroup}
                    typingUsers={getGroupTypingUsers(selectedGroup?._id)}
                    onBack={() => setSelectedGroup(null)}
                    onOpenInfo={() => setShowGroupInfoModal(true)}
                    onlineCount={getOnlineCount()}
                  />
                )}

                <ChatWindow
                  messages={currentMessages}
                  currentUser={currentUser}
                  selectedUser={selectedUser}
                  loading={currentLoading}
                  isGroup={!!selectedGroup}
                  onReply={handleReply}
                  onReact={handleReact}
                  onDeleteForMe={handleDeleteForMe}
                  onDeleteForEveryone={handleDeleteForEveryone}
                  onEdit={handleEdit}
                />

                <ChatInput
                  onSendMessage={handleSendMessage}
                  onSendImage={handleSendImage}
                  onTyping={handleTyping}
                  replyTo={currentReplyTo}
                  onCancelReply={handleCancelReply}
                  editingMessage={currentEditingMessage}
                  onCancelEdit={handleCancelEdit}
                  onEditMessage={handleEditMessage}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/50"
              >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      x: [0, 30, 0],
                      y: [0, -50, 0],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
                  ></motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      x: [0, -40, 0],
                      y: [0, 40, 0],
                    }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2,
                    }}
                    className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"
                  ></motion.div>
                </div>

                <div className="relative z-10 max-w-2xl px-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8 flex justify-center"
                  >
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-xl shadow-primary-500/10 ring-1 ring-black/5 dark:ring-white/10">
                      <img
                        src="/vite.svg"
                        alt="Logo"
                        className="w-20 h-20 opacity-80"
                      />
                    </div>
                  </motion.div>

                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight"
                  >
                    Welcome to{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                      ChitChat
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-lg mx-auto leading-relaxed"
                  >
                    Connect freely, chat securely. Select a conversation from
                    the sidebar to start talking, or create a group to chat with
                    multiple friends.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal
            user={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={() => setShowProfileModal(false)}
          />
        )}

        {showCreateGroupModal && (
          <CreateGroupModal
            users={users}
            currentUserId={currentUser._id}
            onClose={() => setShowCreateGroupModal(false)}
            onCreateGroup={createGroup}
          />
        )}

        {showGroupInfoModal && selectedGroup && (
          <GroupInfoModal
            group={selectedGroup}
            currentUserId={currentUser._id}
            users={users}
            isUserOnline={isUserOnline}
            onClose={() => setShowGroupInfoModal(false)}
            onAddMembers={addMembers}
            onRemoveMember={removeMember}
            onLeaveGroup={leaveGroup}
            onDeleteGroup={deleteGroup}
            onUpdateGroup={updateGroup}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatPage;
