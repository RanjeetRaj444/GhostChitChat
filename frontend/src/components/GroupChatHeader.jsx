import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaUsers,
  FaEllipsisV,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

function GroupChatHeader({
  group,
  typingUsers,
  onBack,
  onOpenInfo,
  onlineCount,
  onSearch,
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const memberCount = group?.members?.length || 0;

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

  return (
    <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-40 h-[73px]">
      <div className="flex items-center flex-1 min-w-0 h-full">
        <AnimatePresence mode="wait">
          {!isSearching ? (
            <motion.div
              key="group-info"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center flex-1 min-w-0"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onBack}
                className="md:hidden p-2 mr-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
              </motion.button>

              <div
                className="relative flex-shrink-0 cursor-pointer"
                onClick={onOpenInfo}
              >
                <img
                  src={group?.avatar || "/default-avatar.svg"}
                  alt={group?.name}
                  className="w-11 h-11 rounded-xl object-cover shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-lg flex items-center justify-center border-2 border-white dark:border-neutral-800">
                  <FaUsers className="w-2.5 h-2.5 text-white" />
                </div>
              </div>

              <div
                className="ml-4 flex-1 min-w-0 cursor-pointer"
                onClick={onOpenInfo}
              >
                <h2 className="font-bold text-neutral-900 dark:text-white truncate leading-tight">
                  {group?.name}
                </h2>
                <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {typingUsers && typingUsers.length > 0 ? (
                    <span className="text-primary-500 font-bold animate-pulse uppercase tracking-wider text-[10px]">
                      {typingUsers.length === 1
                        ? `${typingUsers[0]} is typing...`
                        : `${typingUsers.length} people typing...`}
                    </span>
                  ) : (
                    <span>
                      {memberCount} members
                      {onlineCount > 0 && ` · ${onlineCount} online`}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="group-search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex items-center pr-2"
            >
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search in group..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-neutral-700 border-none rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-1">
        <button
          onClick={toggleSearch}
          className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
          title={isSearching ? "Close search" : "Search messages"}
        >
          {isSearching ? (
            <FaTimes className="w-4 h-4" />
          ) : (
            <FaSearch className="w-4 h-4" />
          )}
        </button>

        {!isSearching && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenInfo}
            className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <FaEllipsisV className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
}

export default GroupChatHeader;
