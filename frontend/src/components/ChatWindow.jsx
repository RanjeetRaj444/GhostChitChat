import { useEffect, useRef, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaImage, FaArrowDown, FaStar } from "react-icons/fa";
import MessageActions from "./MessageActions";
import ReplyPreview from "./ReplyPreview";
import ReactionDetails from "./ReactionDetails";
import toast from "react-hot-toast";

function ChatWindow({
  messages,
  currentUser,
  selectedUser,
  loading,
  isGroup = false,
  onReply,
  onReact,
  onDeleteForMe,
  onDeleteForEveryone,
  onEdit,
  onToggleStar,
  searchQuery = "",
  scrollTrigger = 0,
}) {
  const endRef = useRef(null);
  const containerRef = useRef(null);
  const messageRefs = useRef({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showReactionDetails, setShowReactionDetails] = useState(null); // { messageId, placement }
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (showReactionDetails) setShowReactionDetails(null);
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [showReactionDetails]);

  const scrollToBottom = () => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to first matching message when triggered
  useEffect(() => {
    if (scrollTrigger > 0 && searchQuery.trim()) {
      const firstMatch = messages.find(
        (msg) =>
          msg.content &&
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (firstMatch && messageRefs.current[firstMatch._id]) {
        messageRefs.current[firstMatch._id].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Flash effect
        messageRefs.current[firstMatch._id].classList.add(
          "search-highlight-flash",
        );
        setTimeout(() => {
          messageRefs.current[firstMatch._id]?.classList.remove(
            "search-highlight-flash",
          );
        }, 2000);
      } else if (searchQuery.trim()) {
        toast("No messages found", { icon: "🔍" });
      }
    }
  }, [scrollTrigger, searchQuery, messages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShowScrollBottom(!isNearBottom);
  };

  const formatMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (error) {
      return "";
    }
  };

  // Check if message can be edited (within 15 minutes)
  const canEditMessage = (message) => {
    if (!message.createdAt) return false;
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    return new Date(message.createdAt).getTime() > fifteenMinutesAgo;
  };

  // Check if message can be deleted for everyone (within 1 hour)
  const canDeleteForEveryoneMessage = (message) => {
    if (!message.createdAt) return false;
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return new Date(message.createdAt).getTime() > oneHourAgo;
  };

  const groupedMessages = useMemo(() => {
    const groups = {};
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
  }, [messages]);

  const formatDateDivider = (dateString) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMMM d, yyyy");
    }
  };

  // Get the full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${import.meta.env.VITE_API_URL}${imageUrl}`;
  };

  // Group reactions by emoji
  const groupReactions = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    const grouped = {};
    reactions.forEach((r) => {
      const emoji = r.emoji;
      if (!grouped[emoji]) {
        grouped[emoji] = { emoji, count: 0, users: [] };
      }
      grouped[emoji].count++;
      grouped[emoji].users.push(r.user?.username || "Unknown");
    });
    return Object.values(grouped);
  };

  const highlightText = (text, query) => {
    if (!query || typeof text !== "string") return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className="bg-yellow-200 dark:bg-yellow-800/60 rounded-sm text-inherit px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  const handleCopy = () => {
    toast.success("Copied to clipboard");
  };

  const handleReactionClick = (e, message) => {
    e.stopPropagation();
    if (!currentUser) return;

    if (showReactionDetails?.messageId === message._id) {
      setShowReactionDetails(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - rect.bottom;

    // Position modal optimally
    setShowReactionDetails({
      messageId: message._id,
      placement: spaceBelow < 250 ? "top" : "bottom",
    });
  };

  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a brief highlight effect
      element.classList.add("highlight-message");
      setTimeout(() => {
        element.classList.remove("highlight-message");
      }, 2000);
    } else {
      toast.error("Original message not found");
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 bg-neutral-100 dark:bg-neutral-900 scroll-smooth relative"
    >
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center"
        >
          <p className="text-neutral-500 dark:text-neutral-400 mb-2">
            No messages yet
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            Send a message to start the conversation
          </p>
        </motion.div>
      ) : (
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {groupedMessages.map(({ date, messages }) => (
              <div key={date}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center my-4"
                >
                  <div className="px-3 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-full text-xs text-neutral-600 dark:text-neutral-400">
                    {formatDateDivider(date)}
                  </div>
                </motion.div>

                {messages.map((message, idx) => {
                  const isSentByCurrentUser =
                    message.sender &&
                    currentUser &&
                    (message.sender._id === currentUser._id ||
                      message.sender === currentUser._id);

                  const senderName = message.sender?.username || "Unknown";
                  const senderAvatar =
                    message.sender?.avatar || "/default-avatar.svg";

                  const isImageMessage = message.messageType === "image";
                  const isDeleted = message.deletedForEveryone;
                  const reactions = groupReactions(message.reactions);

                  return (
                    <motion.div
                      id={`message-${message._id}`}
                      key={message._id || message.createdAt + idx}
                      ref={(el) => {
                        if (el) messageRefs.current[message._id] = el;
                      }}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        duration: 0.2,
                      }}
                      className={`flex ${
                        isSentByCurrentUser ? "justify-end" : "justify-start"
                      } mb-4 relative group`}
                    >
                      {!isSentByCurrentUser && (
                        <motion.img
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          src={
                            isGroup
                              ? senderAvatar
                              : selectedUser?.avatar || "/default-avatar.svg"
                          }
                          alt={
                            isGroup
                              ? senderName
                              : selectedUser?.username || "User"
                          }
                          className="w-8 h-8 rounded-full mr-2 self-end shadow-sm"
                        />
                      )}

                      <div className={`flex flex-col max-w-[75%] relative`}>
                        {/* Show sender name in groups for messages not sent by current user */}
                        {isGroup && !isSentByCurrentUser && (
                          <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 mb-1 ml-1 flex items-start">
                            {senderName}
                          </span>
                        )}

                        <div className="flex items-center gap-2 group/bubble">
                          {isSentByCurrentUser &&
                            !isDeleted &&
                            !message.isSending && (
                              <MessageActions
                                message={message}
                                isSentByCurrentUser={isSentByCurrentUser}
                                currentUserId={currentUser?._id}
                                onReply={onReply}
                                onReact={(messageId, emoji) =>
                                  onReact?.(messageId, emoji)
                                }
                                onDeleteForMe={onDeleteForMe}
                                onDeleteForEveryone={onDeleteForEveryone}
                                onDeleteStar={onToggleStar}
                                onToggleStar={(mid) => onToggleStar?.(mid)}
                                onEdit={onEdit}
                                onCopy={handleCopy}
                                canEdit={canEditMessage(message)}
                                canDeleteForEveryone={canDeleteForEveryoneMessage(
                                  message,
                                )}
                              />
                            )}

                          <div className="flex flex-col flex-1">
                            {/* Reply preview inside message */}
                            {message.replyTo && !isDeleted && (
                              <div
                                className={`${isSentByCurrentUser ? "bg-primary-700/30" : "bg-neutral-200 dark:bg-neutral-700"} rounded-xl rounded-b-none px-3 py-2`}
                              >
                                <ReplyPreview
                                  replyTo={message.replyTo}
                                  isInMessage={true}
                                  onCancel={() =>
                                    scrollToMessage(
                                      message.replyTo._id || message.replyTo,
                                    )
                                  }
                                />
                              </div>
                            )}

                            {/* Message content */}
                            {isDeleted ? (
                              <motion.div
                                layout
                                className={`message-bubble italic ${
                                  isSentByCurrentUser
                                    ? "bg-neutral-400 dark:bg-neutral-600 text-neutral-200 rounded-br-none"
                                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-bl-none"
                                }`}
                              >
                                🚫 This message was deleted
                              </motion.div>
                            ) : isImageMessage ? (
                              <motion.div
                                layout
                                className={`relative cursor-pointer overflow-hidden rounded-2xl ${
                                  isSentByCurrentUser
                                    ? "rounded-br-none"
                                    : "rounded-bl-none"
                                } ${message.replyTo ? "rounded-t-none" : ""}`}
                                onClick={() =>
                                  setLightboxImage(
                                    getImageUrl(message.imageUrl),
                                  )
                                }
                              >
                                <img
                                  src={getImageUrl(message.imageUrl)}
                                  alt="Shared image"
                                  className="max-w-full max-h-64 object-cover rounded-2xl hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                />
                                {message.isSending && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                                    <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                  </div>
                                )}

                                {/* Image Metadata Overlay */}
                                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                                  {message.starredBy?.some(
                                    (id) =>
                                      (id._id || id).toString() ===
                                      currentUser?._id.toString(),
                                  ) && (
                                    <FaStar className="w-2.5 h-2.5 text-yellow-400" />
                                  )}
                                  <span className="text-[10px] font-bold text-white/90 leading-none">
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                  {isSentByCurrentUser && (
                                    <div className="flex items-center h-3">
                                      {message.isSending ? (
                                        <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <div className="flex -space-x-1">
                                          <span
                                            className={`text-[10px] font-black ${message.isRead ? "text-primary-400" : "text-white/60"}`}
                                          >
                                            ✓
                                          </span>
                                          {message.isRead && (
                                            <span className="text-[10px] font-black text-primary-400">
                                              ✓
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                layout
                                className={`message-bubble inline-flex flex-wrap items-end gap-x-2 ${
                                  isSentByCurrentUser
                                    ? "message-sent rounded-br-none"
                                    : "message-received rounded-bl-none"
                                } ${message.replyTo ? "rounded-t-none" : ""}`}
                              >
                                <span>
                                  {highlightText(message.content, searchQuery)}
                                  {message.isEdited && (
                                    <span className="ml-1 text-[10px] opacity-60">
                                      (edited)
                                    </span>
                                  )}
                                </span>

                                <span className="inline-flex items-center gap-1 ml-auto self-end">
                                  {message.starredBy?.some(
                                    (id) =>
                                      (id._id || id).toString() ===
                                      currentUser?._id.toString(),
                                  ) && (
                                    <FaStar className="w-2.5 h-2.5 text-yellow-400 drop-shadow-sm" />
                                  )}
                                  <span
                                    className={`text-[10px] font-bold leading-none ${isSentByCurrentUser ? "text-primary-100/90" : "text-neutral-400"}`}
                                  >
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                  {isSentByCurrentUser && (
                                    <span className="inline-flex items-center h-3">
                                      {message.isSending ? (
                                        <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <span className="inline-flex -space-x-1">
                                          <span
                                            className={`text-[10px] font-black ${message.isRead ? "text-primary-200" : "text-white/60"}`}
                                          >
                                            ✓
                                          </span>
                                          {message.isRead && (
                                            <span className="text-[10px] font-black text-primary-200">
                                              ✓
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </span>
                              </motion.div>
                            )}
                          </div>

                          {!isSentByCurrentUser &&
                            !isDeleted &&
                            !message.isSending && (
                              <MessageActions
                                message={message}
                                isSentByCurrentUser={isSentByCurrentUser}
                                currentUserId={currentUser?._id}
                                onReply={onReply}
                                onReact={(messageId, emoji) =>
                                  onReact?.(messageId, emoji)
                                }
                                onDeleteForMe={onDeleteForMe}
                                onDeleteForEveryone={onDeleteForEveryone}
                                onToggleStar={(mid) => onToggleStar?.(mid)}
                                onEdit={onEdit}
                                onCopy={handleCopy}
                                canEdit={canEditMessage(message)}
                                canDeleteForEveryone={canDeleteForEveryoneMessage(
                                  message,
                                )}
                              />
                            )}
                        </div>
                        {/* Reactions display */}
                        {reactions.length > 0 && !isDeleted && (
                          <div
                            className={`flex flex-wrap gap-1 mt-1 ${isSentByCurrentUser ? "justify-end" : "justify-start"} relative`}
                          >
                            {reactions.map((r, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                title={r.users.join(", ")}
                                onClick={(e) => handleReactionClick(e, message)}
                              >
                                <span className="text-sm">{r.emoji}</span>
                                {r.count > 1 && (
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {r.count}
                                  </span>
                                )}
                              </motion.div>
                            ))}

                            <AnimatePresence>
                              {showReactionDetails?.messageId ===
                                message._id && (
                                <ReactionDetails
                                  message={message}
                                  currentUser={currentUser}
                                  placement={showReactionDetails.placement}
                                  onClose={() => setShowReactionDetails(null)}
                                  onRemoveReaction={(mid, emoji, target) => {
                                    onReact?.(mid, emoji, target);
                                  }}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>

                      {isSentByCurrentUser && (
                        <motion.img
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          src={currentUser?.avatar || "/default-avatar.svg"}
                          alt={currentUser?.username || "Me"}
                          className="w-8 h-8 rounded-full ml-2 self-end shadow-sm"
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </AnimatePresence>
          <div ref={endRef} className="h-4" />
        </div>
      )}

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={scrollToBottom}
            className="fixed bottom-24 right-8 z-30 p-3 bg-white dark:bg-neutral-800 text-primary-500 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all group"
            title="Scroll to bottom"
          >
            <FaArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <FaTimes className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatWindow;
