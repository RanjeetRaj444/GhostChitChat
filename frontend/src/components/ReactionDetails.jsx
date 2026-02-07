import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaTrash } from "react-icons/fa";

function ReactionDetails({
  message,
  currentUser,
  onClose,
  onRemoveReaction,
  placement = "bottom",
}) {
  const [activeTab, setActiveTab] = useState("all");

  if (!message || !message.reactions) return null;

  // Group reactions for tabs
  const emojiGroups = {};
  message.reactions.forEach((r) => {
    if (!emojiGroups[r.emoji]) {
      emojiGroups[r.emoji] = [];
    }
    emojiGroups[r.emoji].push(r);
  });

  const emojis = Object.keys(emojiGroups);
  const filteredReactions =
    activeTab === "all" ? message.reactions : emojiGroups[activeTab] || [];

  const isOwner =
    message.sender?._id === currentUser?._id ||
    message.sender === currentUser?._id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: placement === "top" ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: placement === "top" ? 10 : -10 }}
      className={`absolute z-[60] min-w-[280px] max-w-sm bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col max-h-[400px] ${
        placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } ${message.sender?._id === currentUser?._id ? "right-0" : "left-0"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header / Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 px-2 bg-neutral-50/50 dark:bg-neutral-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-2 text-sm font-semibold transition-all relative ${
              activeTab === "all"
                ? "text-primary-600 dark:text-primary-400"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            All {message.reactions.length}
            {activeTab === "all" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
              />
            )}
          </button>

          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setActiveTab(emoji)}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-all relative ${
                activeTab === emoji
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              <span>{emoji}</span>
              <span className="text-xs font-medium">
                {emojiGroups[emoji].length}
              </span>
              {activeTab === emoji && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      {/* Content List */}
      <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
        <div className="flex flex-col">
          {filteredReactions.map((reaction, idx) => {
            const isMyReaction =
              reaction.user?._id === currentUser?._id ||
              reaction.user === currentUser?._id;
            const user = reaction.user || {};

            return (
              <div
                key={reaction._id || idx}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || "/default-avatar.svg"}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold dark:text-white">
                      {isMyReaction ? "You" : user.username || "Unknown"}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Reacted with {reaction.emoji}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl">{reaction.emoji}</span>
                  {(isMyReaction || isOwner) && (
                    <button
                      onClick={() =>
                        onRemoveReaction(
                          message._id,
                          reaction.emoji,
                          user._id || user,
                        )
                      }
                      className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-error-100 dark:hover:bg-error-900/30 text-error-500 transition-all ml-1"
                      title={
                        isMyReaction
                          ? "Remove your reaction"
                          : "Remove this reaction"
                      }
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default ReactionDetails;
