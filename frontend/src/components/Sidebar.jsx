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
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter users by search query and exclude users already in conversations
  const conversationUserIds = conversations.map((conv) => conv.user._id);
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !conversationUserIds.includes(user._id)
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
    <div className="w-80 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col">
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
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 &&
          filteredUsers.length === 0 &&
          searchQuery && (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              No users found
            </div>
          )}

        {filteredConversations.length > 0 && (
          <div className="pb-2">
            <h2 className="px-4 pt-2 pb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Recent Chats
            </h2>

            <ul>
              {filteredConversations.map((conversation) => (
                <li key={conversation._id}>
                  <button
                    onClick={() => onSelectUser(conversation.user)}
                    className={`w-full flex items-center px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                      selectedUser && selectedUser._id === conversation.user._id
                        ? "bg-neutral-100 dark:bg-neutral-700"
                        : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={conversation.user.avatar}
                        alt={conversation.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isUserOnline(conversation.user._id) && (
                        <span className="online-indicator"></span>
                      )}
                    </div>

                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {conversation.user.username}
                        </h3>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                          {conversation.lastMessage.sender ===
                          currentUser._id ? (
                            <span className="text-neutral-400 dark:text-neutral-500">
                              You:{" "}
                            </span>
                          ) : null}
                          {conversation.lastMessage.content}
                        </p>

                        {conversation.unreadCount > 0 && (
                          <span className="ml-2 flex-shrink-0 inline-block bg-primary-600 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1">
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
          <div className="pb-2">
            <h2 className="px-4 pt-2 pb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex justify-between items-center">
              <span>New Chat</span>
              {!searchQuery && (
                <button
                  onClick={() => setShowAllUsers(false)}
                  className="text-primary-600 dark:text-primary-500 text-xs"
                >
                  Hide
                </button>
              )}
            </h2>

            <ul>
              {filteredUsers.map((user) => (
                <li key={user._id}>
                  <button
                    onClick={() => onSelectUser(user)}
                    className="w-full flex items-center px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {isUserOnline(user._id) && (
                        <span className="online-indicator"></span>
                      )}
                    </div>

                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {user.username}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {isUserOnline(user._id) ? "Online" : "Offline"}
                      </p>
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
            className="w-full flex items-center justify-center px-4 py-3 text-primary-600 dark:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <FaPlus className="w-4 h-4 mr-2" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center">
        <img
          src={currentUser?.avatar}
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
