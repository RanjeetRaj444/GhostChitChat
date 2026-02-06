import { useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

function ChatWindow({ messages, currentUser, selectedUser, loading }) {
  const endRef = useRef(null);

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
                          src={selectedUser?.avatar || "/default-avatar.svg"}
                          alt={selectedUser?.username || "User"}
                          className="w-8 h-8 rounded-full mr-2 self-end shadow-sm"
                        />
                      )}

                      <div className="flex flex-col max-w-[75%]">
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
    </div>
  );
}

export default ChatWindow;
