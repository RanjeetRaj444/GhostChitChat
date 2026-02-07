import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaTimes } from "react-icons/fa";

function ClearChatModal({ isOpen, onClose, onConfirm, loading }) {
  const [keepStarred, setKeepStarred] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[400px] bg-[#1c1c1c] rounded-[28px] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <h2 className="text-xl font-medium text-white mb-6">
                Clear this chat?
              </h2>

              <p className="text-[#a0a0a0] text-[15px] leading-relaxed mb-8">
                This chat will be empty but will remain in your chat list.
              </p>

              <label className="flex items-center space-x-3 cursor-pointer group mb-10">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={keepStarred}
                    onChange={(e) => setKeepStarred(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-[#505050] rounded-[4px] checked:bg-[#ff5a5a] checked:border-[#ff5a5a] transition-all"
                  />
                  <svg
                    className="absolute w-3.5 h-3.5 pointer-events-none hidden peer-checked:block left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="text-[#e0e0e0] text-[15px] select-none group-hover:text-white transition-colors">
                  Keep starred messages
                </span>
              </label>

              <div className="flex items-center justify-end space-x-6">
                <button
                  onClick={onClose}
                  className="text-[#00a884] font-medium text-[15px] hover:text-[#00c39a] transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm(keepStarred)}
                  disabled={loading}
                  className="bg-[#ff5a5a] text-white px-6 py-2.5 rounded-full font-medium text-[15px] hover:bg-[#ff6b6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Clear chat"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ClearChatModal;
