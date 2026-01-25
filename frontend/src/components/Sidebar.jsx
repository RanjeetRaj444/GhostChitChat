import { useState } from "react";
import { format } from "date-fns";
import {
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaUser,
  FaSearch,
  FaPlus,
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
  darkMode,
  toggleTheme,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv) =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()),
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

  return (
    <div className="w-full md:w-80 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border-r border-neutral-200 dark:border-neutral-700 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-500">
          ChitChat
        </h1>

        <div className="flex space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
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
            className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            aria-label="User profile"
          >
            <FaUser className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
            aria-label="Logout"
          >
            <FaSignOutAlt className="w-4 h-4" />
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
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-700/50 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-neutral-800 rounded-xl pl-10 py-2.5 text-sm transition-all duration-200 outline-none ring-2 ring-transparent focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filteredConversations.length === 0 &&
          filteredUsers.length === 0 &&
          searchQuery && (
            <div className="p-8 text-center">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No users found
              </p>
            </div>
          )}

        {filteredConversations.length > 0 && (
          <div className="pb-2">
            {!searchQuery && (
              <h2 className="px-3 pb-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono">
                Recent
              </h2>
            )}

            <ul className="space-y-1">
              {filteredConversations.map((conversation) => (
                <li key={conversation._id}>
                  <button
                    onClick={() => onSelectUser(conversation.user)}
                    className={`w-full flex items-center px-3 py-2 rounded-xl transition-all duration-200 group ${
                      selectedUser && selectedUser._id === conversation.user._id
                        ? "bg-primary-50 dark:bg-primary-900/10 text-primary-900 dark:text-primary-100"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-200"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conversation.user.avatar || "/default-avatar.svg"}
                        alt={conversation.user.username}
                        className={`w-10 h-10 rounded-full object-cover border-2 transition-colors ${
                          selectedUser &&
                          selectedUser._id === conversation.user._id
                            ? "border-primary-200 dark:border-primary-700"
                            : "border-transparent"
                        }`}
                      />
                      {isUserOnline(conversation.user._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white dark:border-neutral-800 rounded-full shadow-sm"></span>
                      )}
                    </div>

                    <div className="ml-3 flex-1 overflow-hidden text-left">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            conversation.unreadCount > 0
                              ? "text-neutral-900 dark:text-white"
                              : ""
                          }`}
                        >
                          {conversation.user.username}
                        </h3>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap ml-1 font-medium">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs truncate max-w-[85%] ${
                            conversation.unreadCount > 0
                              ? "text-neutral-800 dark:text-neutral-300 font-medium"
                              : "text-neutral-500 dark:text-neutral-500"
                          }`}
                        >
                          {conversation.lastMessage.sender ===
                          currentUser._id ? (
                            <span className="text-neutral-400 dark:text-neutral-600 mr-1">
                              You:
                            </span>
                          ) : null}
                          {conversation.lastMessage.content}
                        </p>

                        {conversation.unreadCount > 0 && (
                          <span className="flex-shrink-0 bg-primary-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shadow-sm shadow-primary-500/20">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* New Chat Section */}
        {(showAllUsers || searchQuery) && filteredUsers.length > 0 && (
          <div className="pb-2 animate-fade-in">
            <h2 className="px-3 pt-4 pb-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-mono">
              {searchQuery ? "Contacts" : "Suggested"}
            </h2>

            <ul className="space-y-1">
              {filteredUsers.map((user) => (
                <li key={user._id}>
                  <button
                    onClick={() => onSelectUser(user)}
                    className="w-full flex items-center px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-200 text-neutral-700 dark:text-neutral-200 group"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar || "/default-avatar.svg"}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover border-2 border-transparent group-hover:border-neutral-200 dark:group-hover:border-neutral-700 transition-colors"
                      />
                      {isUserOnline(user._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white dark:border-neutral-800 rounded-full shadow-sm"></span>
                      )}
                    </div>

                    <div className="ml-3 flex-1 text-left">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.username}
                      </h3>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        Click to start chatting
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary-500">
                      <FaPlus className="w-3 h-3" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!showAllUsers && !searchQuery && filteredUsers.length > 0 && (
          <button
            onClick={() => setShowAllUsers(true)}
            className="w-full flex items-center justify-center px-4 py-3 mt-2 text-sm font-medium text-primary-600 dark:text-primary-500/80 hover:text-primary-700 dark:hover:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-xl transition-all duration-200 border border-transparent hover:border-primary-200 dark:hover:border-primary-500/20 group"
          >
            <span className="group-hover:scale-110 transition-transform duration-200 mr-2">
              <FaPlus className="w-3 h-3" />
            </span>
            <span>Start New Chat</span>
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center">
        <img
          src={currentUser?.avatar || "/default-avatar.svg"}
          alt={currentUser?.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {currentUser?.username}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {currentUser?.email}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
