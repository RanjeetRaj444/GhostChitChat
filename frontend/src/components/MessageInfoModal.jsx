import { motion } from "framer-motion";
import { FaTimes, FaCheckDouble, FaCheck, FaInfoCircle } from "react-icons/fa";
import { format } from "date-fns";

function MessageInfoModal({ message, isOpen, onClose, isGroup }) {
  if (!isOpen || !message) return null;

  const readReceipts = message.readBy || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800"
      >
        <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
              <FaInfoCircle />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Message Info
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-500"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Sent at
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
              {format(new Date(message.createdAt), "PPPP 'at' p")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Read Status
            </h3>
            <div className="space-y-3">
              {!isGroup ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.isRead ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"}`}
                    >
                      {message.isRead ? <FaCheckDouble /> : <FaCheck />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {message.isRead ? "Read" : "Delivered"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {readReceipts.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic px-2">
                      No one has read this yet
                    </p>
                  ) : (
                    readReceipts.map((receipt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={receipt.user?.avatar || "/default-avatar.svg"}
                            className="w-10 h-10 rounded-xl object-cover"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {receipt.user?.username}
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              Read {format(new Date(receipt.readAt), "p")}
                            </p>
                          </div>
                        </div>
                        <FaCheckDouble className="text-blue-500 w-3 h-3" />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/30 text-center">
          <p className="text-[10px] text-neutral-400 font-medium">
            Message Type: {message.messageType?.toUpperCase() || "TEXT"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default MessageInfoModal;
