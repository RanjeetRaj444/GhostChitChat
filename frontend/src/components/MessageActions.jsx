import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaReply,
  FaSmile,
  FaTrash,
  FaEdit,
  FaCopy,
  FaEllipsisH,
} from "react-icons/fa";

// Quick reaction emojis
const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

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
  canEdit,
  canDeleteForEveryone,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const menuRef = useRef(null);

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

  return (
    <div
      ref={menuRef}
      className={`opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20 flex-shrink-0`}
    >
      {/* Quick reactions bar */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`absolute ${isSentByCurrentUser ? "right-0" : "left-0"} bottom-full mb-2 flex items-center gap-0.5 bg-white dark:bg-neutral-800 rounded-full px-1.5 py-1 shadow-xl border border-neutral-200 dark:border-neutral-700`}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all text-base hover:scale-110 ${
                  hasUserReacted(emoji)
                    ? "bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-500"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                }`}
                title={hasUserReacted(emoji) ? "Click to remove" : "React"}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons - horizontal bar */}
      <div className="flex items-center gap-0.5 bg-white dark:bg-neutral-800 rounded-full px-1 py-0.5 shadow-lg border border-neutral-200 dark:border-neutral-700">
        <button
          onClick={() => {
            setShowReactions(!showReactions);
            setShowMenu(false);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            showReactions
              ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
              : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
          }`}
          title="React"
        >
          <FaSmile className="w-3 h-3" />
        </button>

        <button
          onClick={handleReply}
          className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors"
          title="Reply"
        >
          <FaReply className="w-3 h-3" />
        </button>

        <button
          onClick={() => {
            setShowMenu(!showMenu);
            setShowReactions(false);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            showMenu
              ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
              : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
          }`}
          title="More options"
        >
          <FaEllipsisH className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`absolute ${isSentByCurrentUser ? "right-0" : "left-0"} top-full mt-2 w-44 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden z-30`}
          >
            {/* Copy */}
            {message.content && message.messageType !== "image" && (
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <FaCopy className="w-3.5 h-3.5" />
                Copy text
              </button>
            )}

            {/* Reply */}
            <button
              onClick={handleReply}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <FaReply className="w-3.5 h-3.5" />
              Reply
            </button>

            {/* Edit (only for sender, text messages, within time limit) */}
            {isSentByCurrentUser &&
              canEdit &&
              message.messageType === "text" && (
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <FaEdit className="w-3.5 h-3.5" />
                  Edit message
                </button>
              )}

            <div className="border-t border-neutral-200 dark:border-neutral-700" />

            {/* Delete for me */}
            <button
              onClick={handleDeleteForMe}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
              <FaTrash className="w-3.5 h-3.5" />
              Delete for me
            </button>

            {/* Delete for everyone (only for sender, within time limit) */}
            {isSentByCurrentUser && canDeleteForEveryone && (
              <button
                onClick={handleDeleteForEveryone}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
              >
                <FaTrash className="w-3.5 h-3.5" />
                Delete for everyone
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MessageActions;
