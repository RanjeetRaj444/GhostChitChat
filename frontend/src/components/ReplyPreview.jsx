import { FaTimes, FaImage } from "react-icons/fa";
import { motion } from "framer-motion";

function ReplyPreview({ replyTo, onCancel, isInMessage = false }) {
  if (!replyTo) return null;

  const senderName =
    replyTo.sender?.username || replyTo.senderName || "Unknown";
  const isImage = replyTo.messageType === "image";

  // Style for when it's shown inside a message bubble
  if (isInMessage) {
    return (
      <div
        className="mb-2 pl-3 border-l-2 border-primary-400 dark:border-primary-500 opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
        onClick={onCancel} // We reuse the onCancel prop for click handler whenisInMessage is true
      >
        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
          {senderName}
        </p>
        {isImage ? (
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <FaImage className="w-3 h-3" />
            <span>Photo</span>
          </div>
        ) : (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1">
            {replyTo.content}
          </p>
        )}
      </div>
    );
  }

  // Style for when it's shown as a preview above the input
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-start gap-3 p-3 bg-neutral-100 dark:bg-neutral-700/50 rounded-xl border-l-4 border-primary-500"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
          Replying to {senderName}
        </p>
        {isImage ? (
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <FaImage className="w-4 h-4" />
            <span>Photo</span>
          </div>
        ) : (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {replyTo.content}
          </p>
        )}
      </div>

      {isImage && replyTo.imageUrl && (
        <img
          src={
            replyTo.imageUrl.startsWith("http")
              ? replyTo.imageUrl
              : `${import.meta.env.VITE_API_URL}${replyTo.imageUrl}`
          }
          alt="Reply preview"
          className="w-12 h-12 rounded-lg object-cover"
        />
      )}

      <button
        onClick={onCancel}
        className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-500 dark:text-neutral-400 transition-colors"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default ReplyPreview;
