import { motion, AnimatePresence } from "framer-motion";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl shadow-neutral-900/20 overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-error-50 dark:bg-error-500/10">
              <FaExclamationTriangle className="w-8 h-8 text-error-500" />
            </div>

            <h3 className="text-xl font-black text-center text-neutral-900 dark:text-white mb-2">
              {title}
            </h3>

            <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                disabled={loading}
                onClick={onConfirm}
                className={`flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isDanger
                    ? "bg-error-500 hover:bg-error-600 text-white shadow-lg shadow-error-500/30"
                    : "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : (
                  confirmText
                )}
              </button>

              <button
                disabled={loading}
                onClick={onClose}
                className="flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all duration-300 disabled:opacity-50"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
