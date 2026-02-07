import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUsers, FaEllipsisV } from "react-icons/fa";

function GroupChatHeader({
  group,
  typingUsers,
  onBack,
  onOpenInfo,
  onlineCount,
}) {
  const memberCount = group?.members?.length || 0;

  return (
    <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center flex-1 min-w-0">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="md:hidden p-2 mr-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
        </motion.button>

        <div className="relative flex-shrink-0">
          <img
            src={group?.avatar || "/default-avatar.svg"}
            alt={group?.name}
            className="w-11 h-11 rounded-xl object-cover shadow-sm"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-500 rounded-lg flex items-center justify-center border-2 border-white dark:border-neutral-800">
            <FaUsers className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        <div className="ml-4 flex-1 min-w-0">
          <h2 className="font-bold text-neutral-900 dark:text-white truncate">
            {group?.name}
          </h2>
          <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
            {typingUsers && typingUsers.length > 0 ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-primary-500 font-medium"
              >
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people typing...`}
              </motion.span>
            ) : (
              <span>
                {memberCount} members
                {onlineCount > 0 && ` · ${onlineCount} online`}
              </span>
            )}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onOpenInfo}
        className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
      >
        <FaEllipsisV className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

export default GroupChatHeader;
