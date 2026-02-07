import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaUsers,
  FaEllipsisV,
  FaSearch,
  FaTimes,
  FaVideo,
  FaPhoneAlt,
  FaChevronDown,
  FaInfoCircle,
  FaBellSlash,
  FaHeart,
  FaTrash,
  FaEraser,
  FaFlag,
  FaSignOutAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useRef, useEffect } from "react";

function GroupChatHeader({
  group,
  typingUsers,
  onBack,
  onOpenInfo,
  onlineCount,
  onSearch,
  onClearChat,
  onDeleteChat,
  onMute,
  onFavorite,
  currentUser,
}) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const menuRef = useRef(null);
  const callMenuRef = useRef(null);

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

      <div className="flex items-center">
        <button
          onClick={toggleSearch}
          className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all mr-1"
          title={isSearching ? "Close search" : "Search messages"}
        >
          {isSearching ? (
            <FaTimes className="w-4 h-4" />
          ) : (
            <FaSearch className="w-4 h-4" />
          )}
        </button>

        {!isSearching && (
          <>
            {/* Call Button Group */}
            <div className="relative mr-1" ref={callMenuRef}>
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
            <div className="relative" ref={menuRef}>
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
                        onOpenInfo();
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FaInfoCircle className="w-3.5 h-3.5 mr-3 opacity-70" />
                      Group Info
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onMute?.(group?._id);
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FaBellSlash className="w-3.5 h-3.5 mr-3 opacity-70" />
                      {currentUser?.mutedGroups?.includes(group?._id)
                        ? "Unmute notifications"
                        : "Mute notifications"}
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onFavorite?.(group?._id);
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FaHeart
                        className={`w-3.5 h-3.5 mr-3 ${currentUser?.favoriteGroups?.includes(group?._id) ? "text-error-500" : "text-neutral-400"}`}
                      />
                      {currentUser?.favoriteGroups?.includes(group?._id)
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
                        toast.success("Group reported");
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FaFlag className="w-3.5 h-3.5 mr-3 opacity-70" />
                      Report Group
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onClearChat?.(group?._id);
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <FaEraser className="w-3.5 h-3.5 mr-3 opacity-70" />
                      Clear chat
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteChat?.(group?._id);
                      }}
                      className="w-full flex items-center px-4 py-2.5 text-xs font-bold text-error-600 hover:bg-error-50 transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5 mr-3" />
                      Delete Group
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GroupChatHeader;
