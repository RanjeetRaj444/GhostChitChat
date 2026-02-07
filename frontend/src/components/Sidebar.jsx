import { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaUser,
  FaSearch,
  FaPlus,
  FaUsers,
  FaComments,
  FaTrash,
  FaEllipsisV,
  FaBan,
  FaUnlock,
  FaBellSlash,
} from "react-icons/fa";

function Sidebar({
  conversations,
  users,
  selectedUser,
  onSelectUser,
  onLogout,
  onOpenProfile,
  currentUser,
  isUserOnline,
  isUserTyping,
  getGroupTypingUsers,
  darkMode,
  toggleTheme,
  // Group props
  groups = [],
  selectedGroup,
  onSelectGroup,
  onCreateGroupClick,
  onRemoveContact,
  onBlock,
  onUnblock,
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "groups"

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter groups by search query
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter users by search query and exclude users already in conversations
  const conversationUserIds = conversations.map((conv) => conv.user._id);
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !conversationUserIds.includes(user._id),
  );

  // Format timestamp
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();

      if (date.toDateString() === now.toDateString()) {
        return format(date, "h:mm a");
      } else if (date.getFullYear() === now.getFullYear()) {
        return format(date, "MMM d");
      } else {
        return format(date, "MM/dd/yy");
      }
    } catch (error) {
      return "";
    }
  };

  const handleSelectChat = (user) => {
    onSelectGroup?.(null);
    onSelectUser(user);
    setActiveDropdown(null);
  };

  const handleSelectGroup = (group) => {
    onSelectUser(null);
    onSelectGroup?.(group);
    setActiveDropdown(null);
  };

  return (
    <div className="w-full md:w-80 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-500 dark:to-secondary-500">
         G-ChitChat
        </h1>

        <div className="flex space-x-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <FaSun className="w-4 h-4" />
            ) : (
              <FaMoon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={onOpenProfile}
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
            aria-label="User profile"
          >
            <FaUser className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-error-500 transition-colors"
            aria-label="Logout"
          >
            <FaSignOutAlt className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex bg-neutral-100 dark:bg-neutral-700/30 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === "chats"
                ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <FaComments className="w-3.5 h-3.5 mr-1.5" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === "groups"
                ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <FaUsers className="w-3.5 h-3.5 mr-1.5" />
            Groups
            {groups.filter((g) => g.unreadCount > 0).length > 0 && (
              <span className="ml-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {groups.filter((g) => g.unreadCount > 0).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder={
              activeTab === "chats" ? "Search messages..." : "Search groups..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-700/30 border-2 border-transparent focus:border-primary-500/50 focus:bg-white dark:focus:bg-neutral-700/50 rounded-2xl pl-10 py-2.5 text-sm transition-all duration-300 outline-none"
          />
        </div>
      </div>

      {/* Chat/Group List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === "chats" ? (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {/* Private Chats */}
              {filteredConversations.length === 0 &&
                filteredUsers.length === 0 &&
                searchQuery && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 text-center"
                  >
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                      No users found
                    </p>
                  </motion.div>
                )}

              {filteredConversations.length > 0 && (
                <div className="pb-2">
                  {!searchQuery && (
                    <h2 className="px-3 pb-3 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      Recent Chats
                    </h2>
                  )}

                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <motion.div
                        key={conversation._id || conversation.user._id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative rounded-2xl transition-all duration-300 border border-transparent ${
                          selectedUser &&
                          selectedUser._id === conversation.user._id &&
                          !selectedGroup
                            ? "bg-white dark:bg-neutral-700 shadow-md shadow-neutral-200/50 dark:shadow-none border-neutral-100 dark:border-neutral-600"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                        } ${activeDropdown === conversation.user._id ? "z-[60]" : "z-0"}`}
                      >
                        <div
                          onClick={() => handleSelectChat(conversation.user)}
                          className="w-full flex items-center px-3 py-3 cursor-pointer"
                        >
                          <div className="relative flex-shrink-0 pointer-events-none">
                            <img
                              src={
                                conversation.user.avatar ||
                                "/default-avatar.svg"
                              }
                              alt={conversation.user.username}
                              className={`w-12 h-12 rounded-2xl object-cover transition-transform duration-300 ${
                                selectedUser &&
                                selectedUser._id === conversation.user._id &&
                                !selectedGroup
                                  ? "scale-105"
                                  : "group-hover:scale-105"
                              }`}
                            />
                            {isUserOnline(conversation.user._id) && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 border-2 border-white dark:border-neutral-800 rounded-full shadow-sm"></span>
                            )}
                          </div>

                          <div className="ml-4 flex-1 overflow-hidden pointer-events-none pr-8">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3
                                className={`text-sm font-bold truncate ${
                                  conversation.unreadCount > 0
                                    ? "text-neutral-900 dark:text-white"
                                    : "text-neutral-700 dark:text-neutral-200"
                                }`}
                              >
                                {conversation.user.username}
                              </h3>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap ml-1 font-bold">
                                  {conversation.lastMessage
                                    ? formatTime(
                                        conversation.lastMessage.createdAt,
                                      )
                                    : ""}
                                </span>
                                {currentUser?.mutedUsers?.includes(
                                  conversation.user._id,
                                ) && (
                                  <FaBellSlash className="w-2.5 h-2.5 text-neutral-400 mt-1" />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              {isUserTyping(conversation.user._id) ? (
                                <p className="text-xs text-primary-600 dark:text-primary-400 font-bold animate-pulse">
                                  typing...
                                </p>
                              ) : (
                                <p
                                  className={`text-xs truncate max-w-[85%] ${
                                    conversation.unreadCount > 0
                                      ? "text-neutral-800 dark:text-neutral-300 font-bold"
                                      : "text-neutral-500 dark:text-neutral-500"
                                  }`}
                                >
                                  {conversation.lastMessage ? (
                                    <>
                                      {conversation.lastMessage.sender ===
                                      currentUser._id ? (
                                        <span className="text-primary-500 mr-1 opacity-70">
                                          You:
                                        </span>
                                      ) : null}
                                      {conversation.lastMessage.content}
                                    </>
                                  ) : (
                                    <span className="italic opacity-60">
                                      No messages yet
                                    </span>
                                  )}
                                </p>
                              )}

                              {conversation.unreadCount > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex-shrink-0 bg-primary-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] flex items-center justify-center px-1.5 shadow-lg shadow-primary-500/30"
                                >
                                  {conversation.unreadCount}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Options Menu Button - Absolute Positioned */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-[70]">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(
                                  activeDropdown === conversation.user._id
                                    ? null
                                    : conversation.user._id,
                                );
                              }}
                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg text-neutral-400 transition-all duration-200"
                              title="Options"
                            >
                              <FaEllipsisV className="w-3.5 h-3.5" />
                            </button>

                            <AnimatePresence>
                              {activeDropdown === conversation.user._id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-[80]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(null);
                                    }}
                                  ></div>

                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -10,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-700 z-[90] py-2 overflow-hidden shadow-neutral-900/10 dark:shadow-black/50"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdown(null);
                                        if (conversation.user.blockedByMe) {
                                          onUnblock?.(conversation.user._id);
                                        } else {
                                          onBlock?.(conversation.user._id);
                                        }
                                      }}
                                      className={`w-full flex items-center px-4 py-2.5 text-xs font-bold transition-colors ${
                                        conversation.user.blockedByMe
                                          ? "text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10"
                                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                      }`}
                                    >
                                      {conversation.user.blockedByMe ? (
                                        <>
                                          <FaUnlock className="w-3 h-3 mr-2.5" />
                                          Unblock
                                        </>
                                      ) : (
                                        <>
                                          <FaBan className="w-3 h-3 mr-2.5" />
                                          Block
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDropdown(null);
                                        onRemoveContact(conversation.user);
                                      }}
                                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                                    >
                                      <FaTrash className="w-3 h-3 mr-2.5" />
                                      Delete
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Chat Section */}
              {(showAllUsers || searchQuery) && filteredUsers.length > 0 && (
                <div className="pb-2">
                  <h2 className="px-3 pt-4 pb-3 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                    {searchQuery ? "Search Results" : "Connect with Users"}
                  </h2>

                  <div className="space-y-1">
                    {filteredUsers.map((user) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <button
                          onClick={() => handleSelectChat(user)}
                          className="w-full flex items-center px-3 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-all duration-300 group border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700"
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={user.avatar || "/default-avatar.svg"}
                              alt={user.username}
                              className="w-12 h-12 rounded-2xl object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {isUserOnline(user._id) && (
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 border-2 border-white dark:border-neutral-800 rounded-full shadow-sm"></span>
                            )}
                          </div>

                          <div className="ml-4 flex-1 text-left">
                            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                              {user.username}
                            </h3>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-500 font-medium font-mono leading-none">
                              {isUserTyping(user._id)
                                ? "typing..."
                                : "New connection"}
                            </p>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-2 text-primary-500 bg-primary-50 dark:bg-primary-500/10 p-2 rounded-lg">
                            <FaPlus className="w-3 h-3" />
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {!showAllUsers && !searchQuery && filteredUsers.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAllUsers(true)}
                  className="w-full flex items-center justify-center px-4 py-4 mt-4 text-xs font-bold text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-2xl shadow-lg shadow-primary-500/20 transition-all duration-300 group"
                >
                  <FaPlus className="w-3 h-3 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Discover More People</span>
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="groups"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {/* Groups List */}
              {filteredGroups.length === 0 && searchQuery && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center"
                >
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    No groups found
                  </p>
                </motion.div>
              )}

              {filteredGroups.length > 0 && (
                <div className="pb-2">
                  {!searchQuery && (
                    <h2 className="px-3 pb-3 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      Your Groups
                    </h2>
                  )}

                  <div className="space-y-1">
                    {filteredGroups.map((group) => (
                      <motion.div
                        key={group._id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <button
                          onClick={() => handleSelectGroup(group)}
                          className={`w-full flex items-center px-3 py-3 rounded-2xl transition-all duration-300 group/item relative border border-transparent ${
                            selectedGroup && selectedGroup._id === group._id
                              ? "bg-white dark:bg-neutral-700 shadow-md shadow-neutral-200/50 dark:shadow-none border-neutral-100 dark:border-neutral-600"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={group.avatar || "/default-avatar.svg"}
                              alt={group.name}
                              className={`w-12 h-12 rounded-2xl object-cover transition-transform duration-300 ${
                                selectedGroup && selectedGroup._id === group._id
                                  ? "scale-105"
                                  : "group-hover/item:scale-105"
                              }`}
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary-500 border-2 border-white dark:border-neutral-800 rounded-full flex items-center justify-center">
                              <FaUsers className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>

                          <div className="ml-4 flex-1 overflow-hidden text-left">
                            <div className="flex justify-between items-baseline mb-1">
                              <h3
                                className={`text-sm font-bold truncate ${
                                  group.unreadCount > 0
                                    ? "text-neutral-900 dark:text-white"
                                    : "text-neutral-700 dark:text-neutral-200"
                                }`}
                              >
                                {group.name}
                              </h3>
                              {group.lastMessage && (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap ml-1 font-bold">
                                    {group.lastMessage
                                      ? formatTime(group.lastMessage.createdAt)
                                      : ""}
                                  </span>
                                  {currentUser?.mutedGroups?.includes(
                                    group._id,
                                  ) && (
                                    <FaBellSlash className="w-2.5 h-2.5 text-neutral-400 mt-1" />
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              {getGroupTypingUsers(group._id).length > 0 ? (
                                <p className="text-xs text-secondary-600 dark:text-secondary-400 font-bold animate-pulse">
                                  {getGroupTypingUsers(group._id)[0]} is
                                  typing...
                                </p>
                              ) : (
                                <p
                                  className={`text-xs truncate max-w-[85%] ${
                                    group.unreadCount > 0
                                      ? "text-neutral-800 dark:text-neutral-300 font-bold"
                                      : "text-neutral-500 dark:text-neutral-500"
                                  }`}
                                >
                                  {group.lastMessage ? (
                                    <>
                                      <span className="font-medium">
                                        {group.lastMessage.sender?._id ===
                                        currentUser._id
                                          ? "You"
                                          : group.lastMessage.sender?.username}
                                        :
                                      </span>{" "}
                                      {group.lastMessage.content}
                                    </>
                                  ) : (
                                    <span className="text-neutral-400 italic">
                                      No messages yet
                                    </span>
                                  )}
                                </p>
                              )}
                              {group.unreadCount > 0 && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex-shrink-0 bg-secondary-600 text-white text-[10px] font-black rounded-lg h-5 min-w-[20px] flex items-center justify-center px-1.5 shadow-lg shadow-secondary-500/30"
                                >
                                  {group.unreadCount}
                                </motion.span>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Group Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreateGroupClick}
                className="w-full flex items-center justify-center px-4 py-4 mt-4 text-xs font-bold text-white bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-500 hover:to-secondary-600 rounded-2xl shadow-lg shadow-secondary-500/20 transition-all duration-300 group"
              >
                <FaPlus className="w-3 h-3 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create New Group</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
        <div
          className="flex items-center p-2 rounded-2xl hover:bg-white dark:hover:bg-neutral-700/50 transition-colors cursor-pointer group"
          onClick={onOpenProfile}
        >
          <img
            src={currentUser?.avatar || "/default-avatar.svg"}
            alt={currentUser?.username}
            className="w-10 h-10 rounded-xl object-cover border-2 border-transparent group-hover:border-primary-500/30 transition-all"
          />
          <div className="ml-3 flex-1 overflow-hidden">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {currentUser?.username}
            </h3>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
