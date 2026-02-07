import {
  FaArrowLeft,
  FaSearch,
  FaTimes,
  FaBan,
  FaUnlock,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ChatHeader({
  user,
  isOnline,
  isTyping,
  onBack,
  onOpenProfile,
  onSearch,
  onBlock,
  onUnblock,
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    onSearch?.(val);
  };

  const toggleSearch = () => {
    if (isSearching) {
      handleSearchChange("");
    }
    setIsSearching(!isSearching);
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Offline";
    try {
      return `Last seen ${formatDistanceToNow(new Date(timestamp), { addSuffix: true })}`;
    } catch (e) {
      return "Offline";
    }
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 p-4 flex items-center sticky top-0 z-40 h-[73px]">
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div
            key="header-info"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center flex-1 min-w-0"
          >
            <button
              className="md:hidden mr-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
              aria-label="Back"
              onClick={onBack}
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>

            <div
              className="relative flex-shrink-0 cursor-pointer group"
              onClick={() => onOpenProfile?.(user)}
            >
              <img
                src={user.avatar || "/default-avatar.svg"}
                alt={user.username || "User"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white dark:border-neutral-800 rounded-full"></span>
              )}
            </div>

            <div
              className="ml-3 flex-1 cursor-pointer overflow-hidden"
              onClick={() => onOpenProfile?.(user)}
            >
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate">
                {user.username}
              </h3>
              <p className="text-[11px] font-medium transition-colors truncate">
                {isTyping ? (
                  <span className="text-primary-600 dark:text-primary-400 animate-pulse uppercase tracking-wider">
                    typing...
                  </span>
                ) : isOnline ? (
                  <span className="text-success-600 dark:text-success-400">
                    Online
                  </span>
                ) : (
                  <span className="text-neutral-500 dark:text-neutral-500">
                    {formatLastSeen(user.lastSeen)}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="header-search"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex items-center"
          >
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
              <input
                autoFocus
                type="text"
                placeholder="Search in conversation..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleSearch}
        className="ml-2 p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
        title={isSearching ? "Close search" : "Search messages"}
      >
        {isSearching ? (
          <FaTimes className="w-4 h-4" />
        ) : (
          <FaSearch className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={() =>
          user.blockedByMe ? onUnblock?.(user._id) : onBlock?.(user._id)
        }
        className={`ml-2 p-2.5 rounded-xl transition-all ${
          user.blockedByMe
            ? "text-success-500 bg-success-50 dark:bg-success-500/10 hover:bg-success-100 dark:hover:bg-success-500/20"
            : "text-error-500 bg-error-50 dark:bg-error-500/10 hover:bg-error-100 dark:hover:bg-error-500/20"
        }`}
        title={user.blockedByMe ? "Unblock User" : "Block User"}
      >
        {user.blockedByMe ? (
          <FaUnlock className="w-4 h-4" />
        ) : (
          <FaBan className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default ChatHeader;
