import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaSmile } from "react-icons/fa";

import EmojiPicker from "emoji-picker-react";

function ChatInput({ onSendMessage, onTyping }) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();

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

  return (
    <div className="p-4 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 relative pb-safe">
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-10 shadow-xl rounded-xl">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2 rounded-full transition-colors ${showEmojiPicker ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20" : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"}`}
          aria-label="Add emoji"
        >
          <FaSmile className="w-5 h-5" />
        </button>

        <input
          type="text"
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input py-2"
          autoComplete="off"
        />

        <button
          type="submit"
          disabled={!message.trim()}
          className={`p-2 rounded-full transition-colors ${
            message.trim()
              ? "bg-primary-600 text-white hover:bg-primary-700"
              : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
          }`}
          aria-label="Send message"
        >
          <FaPaperPlane className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default ChatInput;
