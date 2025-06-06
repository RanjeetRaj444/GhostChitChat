import { FaArrowLeft } from "react-icons/fa";

function ChatHeader({ user, isOnline, isTyping, onBack }) {
  if (!user) return null;

  return (
    <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 flex items-center">
      <button
        className="md:hidden mr-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
        aria-label="Back"
        onClick={onBack}
      >
        <FaArrowLeft className="w-4 h-4" />
      </button>

      <div className="relative flex-shrink-0">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={user.username || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        {isOnline && <span className="online-indicator"></span>}
      </div>

      <div className="ml-3 flex-1">
        <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
          {user.username}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {isTyping ? (
            <span className="text-primary-600 dark:text-primary-500 animate-pulse">
              typing...
            </span>
          ) : isOnline ? (
            "Online"
          ) : (
            "Offline"
          )}
        </p>
      </div>
    </div>
  );
}

export default ChatHeader;
