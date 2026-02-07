import { useEffect, useRef, useMemo, useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

function ChatWindow({
  messages,
  currentUser,
  selectedUser,
  loading,
  isGroup = false,
}) {
  const endRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), "h:mm a");
    } catch (error) {
      return "";
    }
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
    // Prepend the API URL for relative paths
    return `${import.meta.env.VITE_API_URL}${imageUrl}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-neutral-100 dark:bg-neutral-900 scroll-smooth">
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

                  // For group messages, get sender info
                  const senderName = message.sender?.username || "Unknown";
                  const senderAvatar =
                    message.sender?.avatar || "/default-avatar.svg";

                  const isImageMessage = message.messageType === "image";

                  return (
                    <motion.div
                      key={message._id || message.createdAt + idx}
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

                      <div className="flex flex-col max-w-[75%]">
                        {/* Show sender name in groups for messages not sent by current user */}
                        {isGroup && !isSentByCurrentUser && (
                          <span className="text-xs font-semibold text-primary-500 dark:text-primary-400 mb-1 ml-1">
                            {senderName}
                          </span>
                        )}

                        {isImageMessage ? (
                          <motion.div
                            layout
                            className={`relative cursor-pointer overflow-hidden rounded-2xl ${
                              isSentByCurrentUser
                                ? "rounded-br-none"
                                : "rounded-bl-none"
                            }`}
                            onClick={() =>
                              setLightboxImage(getImageUrl(message.imageUrl))
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
                          </motion.div>
                        ) : (
                          <motion.div
                            layout
                            className={`message-bubble relative ${
                              isSentByCurrentUser
                                ? "message-sent rounded-br-none"
                                : "message-received rounded-bl-none"
                            }`}
                          >
                            {message.content}
                          </motion.div>
                        )}

                        <div
                          className={`flex items-center text-xs mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                            isSentByCurrentUser
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <span className="text-neutral-500 dark:text-neutral-400">
                            {formatMessageTime(message.createdAt)}
                          </span>

                          {isSentByCurrentUser && (
                            <span className="ml-1 h-3 flex items-center">
                              {message.isSending ? (
                                <svg
                                  className="w-3 h-3 text-neutral-400 animate-spin"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : message.failed ? (
                                <span
                                  className="text-error-500 font-bold"
                                  title="Failed to send"
                                >
                                  !
                                </span>
                              ) : (
                                <div className="flex -space-x-1 items-end">
                                  <span
                                    className={`text-[10px] font-bold ${message.isRead ? "text-primary-500" : "text-neutral-400"}`}
                                  >
                                    ✓
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold ${message.isRead ? "text-primary-500" : "hidden"}`}
                                  >
                                    ✓
                                  </span>
                                </div>
                              )}
                            </span>
                          )}
                        </div>
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
