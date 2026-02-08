import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaReply,
  FaSmile,
  FaTrash,
  FaEdit,
  FaCopy,
  FaEllipsisH,
  FaStar,
  FaInfoCircle,
  FaShare,
  FaThumbtack,
  FaCheckSquare,
  FaDownload,
  FaPlus,
} from "react-icons/fa";

// Quick reaction emojis
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function MessageActions({
  message,
  isSentByCurrentUser,
  currentUserId,
  onReply,
  onReact,
  onDeleteForMe,
  onDeleteForEveryone,
  onEdit,
  onCopy,
  onToggleStar,
  onTogglePin,
  onForward,
  onDownload,
  onInfo,
  onSelect,
  canEdit,
  canDeleteForEveryone,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState("bottom"); // 'top' or 'bottom'
  const menuRef = useRef(null);

  const isStarred = message.starredBy?.some(
    (id) => (id._id || id).toString() === currentUserId.toString(),
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      onCopy?.();
    }
    setShowMenu(false);
  };

  const handleStar = () => {
    onToggleStar?.(message._id);
    setShowMenu(false);
  };

  const handleReply = () => {
    onReply?.(message);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit?.(message);
    setShowMenu(false);
  };

  const handleDeleteForMe = () => {
    onDeleteForMe?.(message._id);
    setShowMenu(false);
  };

  const handleDeleteForEveryone = () => {
    onDeleteForEveryone?.(message._id);
    setShowMenu(false);
  };

  const handlePin = () => {
    onTogglePin?.(message._id);
    setShowMenu(false);
  };

  const handleForward = () => {
    onForward?.(message);
    setShowMenu(false);
  };

  const handleReaction = (emoji) => {
    onReact?.(message._id, emoji);
    setShowReactions(false);
    setShowMenu(false);
  };

  // Check if user has already reacted with a specific emoji
  const hasUserReacted = (emoji) => {
    return message.reactions?.some(
      (r) =>
        (r.user?._id === currentUserId || r.user === currentUserId) &&
        r.emoji === emoji,
    );
  };

  const toggleMenu = (e) => {
    if (!showMenu) {
      const rect = e.currentTarget.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      // If less than 450px below, open upwards (menu is approx 420px tall)
      setMenuPlacement(spaceBelow < 450 ? "top" : "bottom");
    }
    setShowMenu(!showMenu);
    setShowReactions(false);
  };

  const toggleReactions = (e) => {
    if (!showReactions) {
      const rect = e.currentTarget.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      // Reactions bar is smaller, but usually opens upward anyway.
      // We'll use the same logic for consistency if we ever change it.
      setMenuPlacement(spaceBelow < 150 ? "top" : "bottom");
    }
    setShowReactions(!showReactions);
    setShowMenu(false);
  };

  return (
    <div
      ref={menuRef}
      className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20 flex-shrink-0 relative self-center mx-1`}
    >
      <button
        onClick={toggleMenu}
        className={`p-1.5 rounded-full transition-all hover:scale-110 ${
          showMenu
            ? "bg-primary-500 text-white shadow-lg"
            : "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md text-neutral-500 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 shadow-sm"
        }`}
        title="More options"
      >
        <FaEllipsisH className="w-3.5 h-3.5" />
      </button>

      {/* Context Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: menuPlacement === "top" ? 10 : -10,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: menuPlacement === "top" ? 10 : -10,
            }}
            style={{ originY: menuPlacement === "top" ? 1 : 0 }}
            className={`absolute ${isSentByCurrentUser ? "right-0" : "left-0"} ${
              menuPlacement === "top" ? "bottom-full mb-3" : "top-full mt-3"
            } w-64 bg-neutral-900 text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 p-1.5 flex flex-col max-h-[85vh]`}
          >
            {/* Reactions Bar - Top Part of Menu */}
            <div className="flex items-center justify-between px-2 py-2 mb-1 border-b border-white/10">
              <div className="flex items-center gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 text-lg hover:scale-110 ${
                      hasUserReacted(emoji) ? "bg-white/20 !scale-110" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <FaPlus className="w-3 h-3 text-white/70" />
              </button>
            </div>

            {/* Menu Items - Scrollable if needed */}
            <div className="space-y-0.5 overflow-y-auto custom-scrollbar pr-0.5">
              <button
                onClick={() => {
                  onInfo?.(message);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
              >
                <FaInfoCircle className="w-4 h-4 text-white/50 group-hover:text-white" />
                <span>Message info</span>
              </button>

              <button
                onClick={handleReply}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
              >
                <FaReply className="w-4 h-4 text-white/50 group-hover:text-white" />
                <span>Reply</span>
              </button>

              {(message.content || message.messageType === "text") && (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
                >
                  <FaCopy className="w-4 h-4 text-white/50 group-hover:text-white" />
                  <span>Copy</span>
                </button>
              )}

              <button
                onClick={handleForward}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
              >
                <FaShare className="w-4 h-4 text-white/50 group-hover:text-white" />
                <span>Forward</span>
              </button>

              <button
                onClick={handlePin}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
              >
                <FaThumbtack
                  className={`w-4 h-4 ${message.isPinned ? "text-primary-400" : "text-white/50 group-hover:text-white"}`}
                />
                <span>{message.isPinned ? "Unpin" : "Pin"}</span>
              </button>

              <button
                onClick={handleStar}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
              >
                <FaStar
                  className={`w-4 h-4 ${isStarred ? "text-yellow-400" : "text-white/50 group-hover:text-white"}`}
                />
                <span>{isStarred ? "Unstar" : "Star"}</span>
              </button>

              <div className="h-px bg-white/10 my-1 mx-2" />

              <button
                onClick={() => {
                  onSelect?.(message._id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
              >
                <FaCheckSquare className="w-4 h-4 text-white/50 group-hover:text-white" />
                <span>Select</span>
              </button>

              {(message.imageUrl ||
                message.videoUrl ||
                message.audioUrl ||
                message.fileUrl) && (
                <button
                  onClick={() => {
                    onDownload?.();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
                >
                  <FaDownload className="w-4 h-4 text-white/50 group-hover:text-white" />
                  <span>Save as</span>
                </button>
              )}

              {/* Edit (only for sender, text messages) */}
              {isSentByCurrentUser &&
                canEdit &&
                message.messageType === "text" && (
                  <button
                    onClick={handleEdit}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-white/10 rounded-xl transition-colors text-left group"
                  >
                    <FaEdit className="w-4 h-4 text-white/50 group-hover:text-white" />
                    <span>Edit message</span>
                  </button>
                )}

              <div className="h-px bg-white/10 my-1 mx-2" />

              <button
                onClick={handleDeleteForMe}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-error-500/20 text-error-400 rounded-xl transition-colors text-left"
              >
                <FaTrash className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              {isSentByCurrentUser && canDeleteForEveryone && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-error-500/20 text-error-400 rounded-xl transition-colors text-left"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                  <span>Delete for everyone</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MessageActions;
