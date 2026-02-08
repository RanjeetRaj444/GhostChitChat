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
import ConfirmationModal from "../components/ConfirmationModal";
import ClearChatModal from "../components/ClearChatModal";
import ContactInfoPanel from "../components/ContactInfoPanel";
import ForwardModal from "../components/ForwardModal";
import MessageInfoModal from "../components/MessageInfoModal";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function ChatPage() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Use a counter for scroll trigger to allow multiple Enter presses
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [clearingTarget, setClearingTarget] = useState(null); // { id: string, type: 'private' | 'group' }
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageInfoTarget, setMessageInfoTarget] = useState(null);
  const [showMessageInfoModal, setShowMessageInfoModal] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const {
    isUserOnline,
    isUserTyping,
    sendTypingStatus,
    getGroupTypingUsers,
    sendGroupTypingStatus,
  } = useSocket();
  const { currentUser, logout, api } = useAuth();
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
    setMessages,
    refreshConversations,
    removeContact,
    blockUser,
    unblockUser,
    clearChat,
    muteUser,
    toggleFavorite,
    toggleStar,
    sendVideo,
    sendAudio,
    sendFile,
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
    clearGroupChat,
    muteGroup,
    toggleGroupFavorite,
    toggleGroupStar,
    sendGroupVideo,
    sendGroupAudio,
    sendGroupFile,
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

  const handleSendVideo = async (videoFile, replyToId) => {
    if (selectedUser) {
      await sendVideo(videoFile, replyToId);
    } else if (selectedGroup) {
      await sendGroupVideo(videoFile, replyToId);
    }
  };

  const handleSendAudio = async (audioFile, replyToId) => {
    if (selectedUser) {
      await sendAudio(audioFile, replyToId);
    } else if (selectedGroup) {
      await sendGroupAudio(audioFile, replyToId);
    }
  };

  const handleSendFile = async (file, replyToId) => {
    if (selectedUser) {
      await sendFile(file, replyToId);
    } else if (selectedGroup) {
      await sendGroupFile(file, replyToId);
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

  const handlePin = async (messageId) => {
    if (selectedUser) {
      await togglePin(messageId);
    } else if (selectedGroup) {
      await toggleGroupPin(messageId);
    }
  };

  const handleForward = (message) => {
    setForwardingMessage(message);
    setShowForwardModal(true);
  };

  const handleSelectForwardTarget = async (target) => {
    if (!forwardingMessage) return;

    try {
      const messageIds = Array.isArray(forwardingMessage._id)
        ? forwardingMessage._id
        : [forwardingMessage._id];

      for (const mid of messageIds) {
        if (target.type === "private") {
          if (selectedGroup) {
            await forwardGroupMessage(mid, { targetUserId: target.id });
          } else {
            await forwardMessage(mid, target.id);
          }
        } else {
          if (selectedUser) {
            await api.post(`/group-messages/${mid}/forward`, {
              targetGroupId: target.id,
            });
          } else {
            await forwardGroupMessage(mid, { targetGroupId: target.id });
          }
        }
      }

      if (Array.isArray(forwardingMessage._id)) {
        toast.success(`${messageIds.length} messages forwarded`);
        clearSelection();
      } else {
        toast.success("Message forwarded");
      }

      setShowForwardModal(false);
      setForwardingMessage(null);
    } catch (err) {
      console.error("Forward error:", err);
      toast.error("Failed to forward message");
    }
  };

  const handleMessageInfo = (message) => {
    setMessageInfoTarget(message);
    setShowMessageInfoModal(true);
  };

  const handleSelect = (messageId) => {
    setIsSelectionMode(true);
    setSelectedMessages([messageId]);
  };

  const handleToggleMessageSelection = (messageId) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId],
    );
  };

  const clearSelection = () => {
    setIsSelectionMode(false);
    setSelectedMessages([]);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleSelectUser = async (user) => {
    setSelectedGroup(null);
    setSelectedUser(user);

    // Add to contacts when selecting a user (connecting)
    try {
      if (user && user._id) {
        await api.post(`/users/contacts/${user._id}`);
        // Refresh conversations to show the newly added contact
        refreshConversations();
      }
    } catch (err) {
      console.error("Failed to add to contacts:", err);
    }

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

  const handleRemoveContact = async () => {
    if (!contactToDelete) return;

    setIsDeletingContact(true);
    try {
      const success = await removeContact(contactToDelete._id);
      if (success) {
        toast.success("Contact and chat history removed");
        setContactToDelete(null);
        refreshConversations();
      }
    } catch (err) {
      console.error("Remove contact error:", err);
      toast.error("An error occurred while removing the contact");
    } finally {
      setIsDeletingContact(false);
    }
  };

  const handleClearChat = async (keepStarred) => {
    if (!clearingTarget) return;

    setIsClearingChat(true);
    try {
      let success = false;
      if (clearingTarget.type === "private") {
        success = await clearChat(clearingTarget.id, keepStarred);
      } else {
        success = await clearGroupChat(clearingTarget.id, keepStarred);
      }

      if (success) {
        setClearingTarget(null);
      }
    } catch (err) {
      console.error("Clear chat error:", err);
    } finally {
      setIsClearingChat(false);
    }
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
            isUserTyping={isUserTyping}
            getGroupTypingUsers={getGroupTypingUsers}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            // Group props
            groups={groups}
            selectedGroup={selectedGroup}
            onSelectGroup={handleSelectGroup}
            onCreateGroupClick={() => setShowCreateGroupModal(true)}
            onRemoveContact={(user) => setContactToDelete(user)}
            onBlock={blockUser}
            onUnblock={unblockUser}
          />
        </motion.div>

        {/* Main content area with optional Contact Info Panel */}
        <div className="flex-1 flex overflow-hidden">
          <main
            className={`flex-1 flex flex-col overflow-hidden ${hasActiveChat ? "flex" : "hidden md:flex"}`}
          >
            <AnimatePresence mode="wait">
              {hasActiveChat ? (
                <motion.div
                  key={selectedUser?._id || selectedGroup?._id || "active-chat"}
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
                      onOpenProfile={() => setShowContactInfoModal(true)}
                      onSearch={setChatSearchQuery}
                      onBlock={blockUser}
                      onUnblock={unblockUser}
                      onClearChat={(userId) =>
                        setClearingTarget({ id: userId, type: "private" })
                      }
                      onDeleteChat={(user) => setContactToDelete(user)}
                      onMute={muteUser}
                      onFavorite={toggleFavorite}
                      currentUser={currentUser}
                      isSearchOpen={isSearchOpen}
                      onSearchClose={() => setIsSearchOpen(false)}
                      onScrollToResult={() =>
                        setScrollTrigger((prev) => prev + 1)
                      }
                    />
                  ) : (
                    <GroupChatHeader
                      group={selectedGroup}
                      typingUsers={getGroupTypingUsers(selectedGroup?._id)}
                      onBack={() => setSelectedGroup(null)}
                      onOpenInfo={() => setShowGroupInfoModal(true)}
                      onlineCount={getOnlineCount()}
                      onSearch={setChatSearchQuery}
                      onClearChat={(groupId) =>
                        setClearingTarget({ id: groupId, type: "group" })
                      }
                      onDeleteChat={deleteGroup}
                      onMute={muteGroup}
                      onFavorite={toggleGroupFavorite}
                      currentUser={currentUser}
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
                    onToggleStar={selectedGroup ? toggleGroupStar : toggleStar}
                    onTogglePin={handlePin}
                    onForward={handleForward}
                    onInfo={handleMessageInfo}
                    onSelect={handleSelect}
                    isSelectionMode={isSelectionMode}
                    selectedMessages={selectedMessages}
                    onToggleSelection={handleToggleMessageSelection}
                    searchQuery={chatSearchQuery}
                    scrollTrigger={scrollTrigger}
                  />

                  {/* Selection Action Bar */}
                  <AnimatePresence>
                    {isSelectionMode && (
                      <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
                      >
                        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={clearSelection}
                              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors text-neutral-500"
                            >
                              <FaTimes />
                            </button>
                            <div>
                              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                                {selectedMessages.length} selected
                              </p>
                              <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                                Choose an action
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                // Forward multiple
                                if (selectedMessages.length > 0) {
                                  // For now, let's just use the first one as a reference or adapt the modal
                                  const firstMsgId = selectedMessages[0];
                                  const msg =
                                    messages.find(
                                      (m) => m._id === firstMsgId,
                                    ) ||
                                    groupMessages.find(
                                      (m) => m._id === firstMsgId,
                                    );
                                  if (msg) {
                                    setForwardingMessage({
                                      ...msg,
                                      _id: selectedMessages,
                                    }); // Special case for multiple
                                    setShowForwardModal(true);
                                  }
                                }
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary-500/20"
                            >
                              <FaShare className="w-3.5 h-3.5" />
                              <span>Forward</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    `Delete ${selectedMessages.length} messages?`,
                                  )
                                ) {
                                  for (const mid of selectedMessages) {
                                    await handleDeleteForMe(mid);
                                  }
                                  clearSelection();
                                  toast.success("Messages deleted");
                                }
                              }}
                              className="p-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-error-50 dark:hover:bg-error-900/20 text-neutral-600 dark:text-neutral-400 hover:text-error-500 rounded-2xl transition-all"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ChatInput
                    onSendMessage={handleSendMessage}
                    onSendImage={handleSendImage}
                    onSendVideo={handleSendVideo}
                    onSendAudio={handleSendAudio}
                    onSendFile={handleSendFile}
                    onTyping={handleTyping}
                    replyTo={currentReplyTo}
                    onCancelReply={handleCancelReply}
                    editingMessage={currentEditingMessage}
                    onCancelEdit={handleCancelEdit}
                    onEditMessage={handleEditMessage}
                    isBlocked={selectedUser?.blockedByMe}
                    hasBlockedMe={selectedUser?.hasBlockedMe}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
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
                        G-ChitChat
                      </span>
                    </motion.h1>

                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-lg mx-auto leading-relaxed"
                    >
                      Connect freely, chat securely. Select a conversation from
                      the sidebar to start talking, or create a group to chat
                      with multiple friends.
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Contact Info Panel - Slide-in from right */}
          <AnimatePresence>
            {showContactInfoModal && selectedUser && (
              <ContactInfoPanel
                key="contact-info-panel"
                user={selectedUser}
                currentUser={currentUser}
                onClose={() => setShowContactInfoModal(false)}
                onBlock={blockUser}
                onUnblock={unblockUser}
                onMute={muteUser}
                onFavorite={toggleFavorite}
                onClearChat={(userId) =>
                  setClearingTarget({ id: userId, type: "private" })
                }
                onDeleteChat={(user) => {
                  setShowContactInfoModal(false);
                  setContactToDelete(user);
                }}
                onSearch={() => {
                  setShowContactInfoModal(false);
                  setIsSearchOpen(true);
                }}
                isOnline={isUserOnline(selectedUser._id)}
                messages={messages}
                groups={groups}
                users={users}
                onCreateGroup={createGroup}
                onSelectGroup={(group) => {
                  setShowContactInfoModal(false);
                  setSelectedUser(null);
                  setSelectedGroup(group);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal
            key="profile-modal"
            user={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={() => setShowProfileModal(false)}
          />
        )}

        {showCreateGroupModal && (
          <CreateGroupModal
            key="create-group-modal"
            users={users}
            currentUserId={currentUser._id}
            onClose={() => setShowCreateGroupModal(false)}
            onCreateGroup={createGroup}
          />
        )}

        {showGroupInfoModal && selectedGroup && (
          <GroupInfoModal
            key="group-info-modal"
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
            messages={groupMessages}
          />
        )}

        {/* Delete Contact Confirmation Modal */}
        {!!contactToDelete && (
          <ConfirmationModal
            key="delete-contact-modal"
            isOpen={!!contactToDelete}
            onClose={() => setContactToDelete(null)}
            onConfirm={handleRemoveContact}
            title="Delete Contact?"
            message={`Are you sure you want to remove ${contactToDelete?.username} from your contacts? This will permanently delete your entire chat history, including all messages and media files. This action cannot be undone.`}
            confirmText="Delete Everything"
            cancelText="Cancel"
            isDanger={true}
            loading={isDeletingContact}
          />
        )}

        {/* Clear Chat Confirmation Modal */}
        {!!clearingTarget && (
          <ClearChatModal
            key="clear-chat-modal"
            isOpen={!!clearingTarget}
            onClose={() => setClearingTarget(null)}
            onConfirm={handleClearChat}
            loading={isClearingChat}
          />
        )}

        {showForwardModal && (
          <ForwardModal
            isOpen={showForwardModal}
            onClose={() => {
              setShowForwardModal(false);
              setForwardingMessage(null);
            }}
            onForward={handleSelectForwardTarget}
            users={users}
            groups={groups}
            currentUser={currentUser}
          />
        )}

        {showMessageInfoModal && (
          <MessageInfoModal
            isOpen={showMessageInfoModal}
            message={messageInfoTarget}
            isGroup={!!selectedGroup}
            onClose={() => {
              setShowMessageInfoModal(false);
              setMessageInfoTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatPage;
