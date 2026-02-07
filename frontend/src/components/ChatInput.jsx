import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaSmile, FaImage, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";

function ChatInput({ onSendMessage, onSendImage, onTyping }) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 1000);

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Handle image send
    if (selectedImage && onSendImage) {
      setIsUploading(true);
      try {
        await onSendImage(selectedImage);
        clearSelectedImage();
      } catch (error) {
        console.error("Failed to send image:", error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle text message send
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      setIsTyping(false);
      onTyping(false);
      setShowEmojiPicker(false);

      // Focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const canSend = message.trim() || selectedImage;

  return (
    <div className="p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 relative pb-safe">
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-10 shadow-xl rounded-xl">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
        </div>
      )}

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 relative inline-block"
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded-xl object-cover border-2 border-primary-500"
            />
            <button
              type="button"
              onClick={clearSelectedImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-error-600 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-full transition-colors ${
            showEmojiPicker
              ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
              : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          }`}
          aria-label="Add emoji"
        >
          <FaSmile className="w-5 h-5" />
        </button>

        {/* Image Upload Button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 rounded-full transition-colors text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50"
          aria-label="Attach image"
        >
          <FaImage className="w-5 h-5" />
        </button>

        <input
          type="text"
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
          className="input py-2"
          autoComplete="off"
          disabled={isUploading}
        />

        <button
          type="submit"
          disabled={!canSend || isUploading}
          className={`p-2 rounded-full transition-colors ${
            canSend && !isUploading
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FaPaperPlane className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatInput;
