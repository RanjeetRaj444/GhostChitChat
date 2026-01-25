import { useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";

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
    <div className="flex-1 overflow-y-auto p-4 bg-neutral-100 dark:bg-neutral-900">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-2">
            No messages yet
          </p>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            Send a message to start the conversation
          </p>
        </div>
      ) : (
        <>
          {groupedMessages.map(({ date, messages }) => (
            <div key={date}>
              <div className="flex justify-center my-4">
                <div className="px-3 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-full text-xs text-neutral-600 dark:text-neutral-400">
                  {formatDateDivider(date)}
                </div>
              </div>

              {messages.map((message) => {
                const isSentByCurrentUser =
                  message.sender &&
                  currentUser &&
                  message.sender._id === currentUser._id;

                return (
                  <div
                    key={message._id}
                    className={`flex ${
                      isSentByCurrentUser ? "justify-end" : "justify-start"
                    } mb-4 animate-fade-in`}
                  >
                    {!isSentByCurrentUser && (
                      <img
                        src={selectedUser?.avatar || "/default-avatar.svg"}
                        alt={selectedUser?.username || "User"}
                        className="w-8 h-8 rounded-full mr-2 self-end"
                      />
                    )}

                    <div className="flex flex-col">
                      <div
                        className={`message-bubble ${
                          isSentByCurrentUser
                            ? "message-sent"
                            : "message-received"
                        }`}
                      >
                        {message.content}
                      </div>

                      <div
                        className={`flex items-center text-xs mt-1 ${
                          isSentByCurrentUser
                            ? "justify-end mr-1"
                            : "justify-start ml-1"
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
                              <span className="text-error-500 font-bold">
                                !
                              </span>
                            ) : (
                              <div className="flex -space-x-1 items-end">
                                <span
                                  className={`text-[10px] font-bold ${message.isRead ? "text-success-500" : "text-neutral-400"}`}
                                >
                                  ✓
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${message.isRead ? "text-success-500" : "hidden"}`}
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
                      <img
                        src={currentUser?.avatar || "/default-avatar.svg"}
                        alt={currentUser?.username || "Me"}
                        className="w-8 h-8 rounded-full ml-2 self-end"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={endRef} />
        </>
      )}
    </div>
  );
}

export default ChatWindow;
