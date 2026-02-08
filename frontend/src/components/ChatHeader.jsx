import {
  FaArrowLeft,
  FaSearch,
  FaTimes,
  FaBan,
  FaUnlock,
  FaEllipsisV,
  FaPhoneAlt,
  FaVideo,
  FaInfoCircle,
  FaBellSlash,
  FaHeart,
  FaSignOutAlt,
  FaFlag,
  FaEraser,
  FaTrash,
  FaChevronDown,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function ChatHeader({
  user,
  isOnline,
  isTyping,
  onBack,
  onOpenProfile,
  onSearch,
  onBlock,
  onUnblock,
  onClearChat,
  onDeleteChat,
  onMute,
  onFavorite,
  currentUser,
  isSearchOpen,
  onSearchClose,
  onScrollToResult,
}) {
  const [isSearching, setIsSearching] = useState(isSearchOpen || false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const menuRef = useRef(null);
  const callMenuRef = useRef(null);

  // Sync external isSearchOpen with internal state
  useEffect(() => {
    if (isSearchOpen) {
      setIsSearching(true);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (callMenuRef.current && !callMenuRef.current.contains(event.target)) {
        setShowCallMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      onScrollToResult?.();
    }
  };

  const toggleSearch = () => {
    if (isSearching) {
      handleSearchChange("");
      onSearchClose?.();
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
                onKeyDown={handleSearchSubmit}
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

      {/* Call Button Group */}
      <div className="relative ml-2" ref={callMenuRef}>
        <button
          onClick={() => setShowCallMenu(!showCallMenu)}
          className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all font-bold text-xs"
        >
          <FaVideo className="w-3.5 h-3.5" />
          <span>Call</span>
          <FaChevronDown
            className={`w-2.5 h-2.5 transition-transform ${showCallMenu ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showCallMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-700 z-[100] py-2 overflow-hidden"
            >
              <button className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <FaVideo className="w-3.5 h-3.5 mr-3 text-primary-500" />
                Video Call
              </button>
              <button className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                <FaPhoneAlt className="w-3.5 h-3.5 mr-3 text-secondary-500" />
                Voice Call
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* More Options Menu */}
      <div className="relative ml-2" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
        >
          <FaEllipsisV className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-700 z-[100] py-2 overflow-hidden"
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenProfile?.(user);
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaInfoCircle className="w-3.5 h-3.5 mr-3 opacity-70" />
                Contact Info
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onMute?.(user._id);
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaBellSlash className="w-3.5 h-3.5 mr-3 opacity-70" />
                {currentUser?.mutedUsers?.includes(user._id)
                  ? "Unmute notifications"
                  : "Mute notifications"}
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onFavorite?.(user._id);
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaHeart
                  className={`w-3.5 h-3.5 mr-3 ${currentUser?.favoriteUsers?.includes(user._id) ? "text-error-500" : "text-neutral-400"}`}
                />
                {currentUser?.favoriteUsers?.includes(user._id)
                  ? "Remove from favourites"
                  : "Add to favourites"}
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onBack();
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors border-b border-neutral-100 dark:border-neutral-700/50 mb-1 pb-3"
              >
                <FaSignOutAlt className="w-3.5 h-3.5 mr-3 opacity-70" />
                Close chat
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  toast.success("User reported for review!");
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaFlag className="w-3.5 h-3.5 mr-3 opacity-70" />
                Report
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  user.blockedByMe
                    ? onUnblock?.(user._id)
                    : onBlock?.(user._id);
                }}
                className={`w-full flex items-center px-4 py-2.5 text-xs font-bold transition-colors ${
                  user.blockedByMe
                    ? "text-success-600 hover:bg-success-50"
                    : "text-error-600 hover:bg-error-50"
                }`}
              >
                {user.blockedByMe ? (
                  <>
                    <FaUnlock className="w-3.5 h-3.5 mr-3" /> Unblock
                  </>
                ) : (
                  <>
                    <FaBan className="w-3.5 h-3.5 mr-3" /> Block
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onClearChat?.(user._id);
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaEraser className="w-3.5 h-3.5 mr-3 opacity-70" />
                Clear chat
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDeleteChat?.(user);
                }}
                className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-error-600 hover:bg-error-50 transition-colors"
              >
                <FaTrash className="w-3.5 h-3.5 mr-3" />
                Delete chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ChatHeader;
