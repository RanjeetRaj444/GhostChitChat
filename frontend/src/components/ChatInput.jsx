import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaSmile,
  FaImage,
  FaVideo,
  FaFileAudio,
  FaFile,
  FaPaperclip,
  FaTimes,
  FaBan,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import ReplyPreview from "./ReplyPreview";

function ChatInput({
  onSendMessage,
  onSendImage,
  onSendVideo,
  onSendAudio,
  onSendFile,
  onTyping,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onEditMessage,
  isBlocked,
  hasBlockedMe,
}) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const docInputRef = useRef(null);
  const attachmentRef = useRef(null);

  // Set message content when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content || "");
      inputRef.current?.focus();
    }
  }, [editingMessage]);

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

  // Handle click away for attachment menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        attachmentRef.current &&
        !attachmentRef.current.contains(event.target)
      ) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }

      clearSelectedFiles();
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Video size must be less than 50MB");
        return;
      }
      if (!file.type.startsWith("video/")) {
        alert("Only video files are allowed");
        return;
      }

      clearSelectedFiles();
      setSelectedVideo(file);
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const handleAudioSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert("Audio size must be less than 25MB");
        return;
      }
      if (!file.type.startsWith("audio/")) {
        alert("Only audio files are allowed");
        return;
      }

      clearSelectedFiles();
      setSelectedAudio(file);
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
    }
  };

  const handleDocSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert("File size must be less than 25MB");
        return;
      }
      clearSelectedFiles();
      setSelectedFile(file);
    }
  };

  const clearSelectedFiles = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setSelectedVideo(null);
    setVideoPreview(null);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setSelectedAudio(null);
    setAudioPreview(null);
    setSelectedFile(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleCancelEdit = () => {
    setMessage("");
    onCancelEdit?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Handle edit mode
    if (editingMessage && message.trim()) {
      await onEditMessage?.(editingMessage._id, message.trim());
      setMessage("");
      return;
    }

    // Handle image send
    if (selectedImage && onSendImage) {
      setIsUploading(true);
      try {
        await onSendImage(selectedImage, replyTo?._id);
        clearSelectedFiles();
        onCancelReply?.();
      } catch (error) {
        console.error("Failed to send image:", error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle video send
    if (selectedVideo && onSendVideo) {
      setIsUploading(true);
      try {
        await onSendVideo(selectedVideo, replyTo?._id);
        clearSelectedFiles();
        onCancelReply?.();
      } catch (error) {
        console.error("Failed to send video:", error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle audio send
    if (selectedAudio && onSendAudio) {
      setIsUploading(true);
      try {
        await onSendAudio(selectedAudio, replyTo?._id);
        clearSelectedFiles();
        onCancelReply?.();
      } catch (error) {
        console.error("Failed to send audio:", error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle file send
    if (selectedFile && onSendFile) {
      setIsUploading(true);
      try {
        await onSendFile(selectedFile, replyTo?._id);
        clearSelectedFiles();
        onCancelReply?.();
      } catch (error) {
        console.error("Failed to send file:", error);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Handle text message send
    if (message.trim()) {
      onSendMessage(message, replyTo?._id);
      setMessage("");
      setIsTyping(false);
      onTyping(false);
      setShowEmojiPicker(false);
      onCancelReply?.();

      // Focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const canSend =
    message.trim() ||
    selectedImage ||
    selectedVideo ||
    selectedAudio ||
    selectedFile;

  return (
    <div className="bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 relative pb-safe">
      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && !editingMessage && (
          <div className="px-4 pt-3">
            <ReplyPreview replyTo={replyTo} onCancel={onCancelReply} />
          </div>
        )}
      </AnimatePresence>

      {/* Edit mode indicator */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pt-3"
          >
            <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border-l-4 border-primary-500">
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  Editing message
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
                  {editingMessage.content}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="p-1.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800/30 text-primary-600 dark:text-primary-400 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 sm:left-4 z-10 shadow-xl rounded-xl mb-2 w-full sm:w-auto max-w-[100vw] sm:max-w-none flex justify-center sm:justify-start overflow-hidden">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" width="100%" />
        </div>
      )}

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pt-3 relative inline-block"
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded-xl object-cover border-2 border-primary-500"
            />
            <button
              type="button"
              onClick={clearSelectedFiles}
              className="absolute top-1 right-2 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-error-600 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Preview */}
      <AnimatePresence>
        {videoPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pt-3 relative inline-block"
          >
            <video
              src={videoPreview}
              className="max-h-32 rounded-xl object-cover border-2 border-primary-500"
            />
            <button
              type="button"
              onClick={clearSelectedFiles}
              className="absolute top-1 right-2 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-error-600 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Preview */}
      <AnimatePresence>
        {audioPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pt-3 relative"
          >
            <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border-2 border-primary-500 max-w-sm">
              <FaFileAudio className="w-5 h-5 text-primary-500" />
              <audio src={audioPreview} controls className="h-8" />
              <button
                type="button"
                onClick={clearSelectedFiles}
                className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800/30 text-error-500"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 pt-3 relative"
          >
            <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border-2 border-primary-500 max-w-xs">
              <FaFile className="w-5 h-5 text-primary-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelectedFiles}
                className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800/30 text-error-500"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2 p-4">
        {isBlocked || hasBlockedMe ? (
          <div className="flex-1 bg-neutral-100 dark:bg-neutral-700/50 p-3 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center space-x-2">
            <FaBan className="w-3.5 h-3.5 text-neutral-400" />
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              {isBlocked
                ? "You have blocked this user. Unblock to send messages."
                : "This user has blocked you."}
            </p>
          </div>
        ) : (
          <>
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

            {/* Attachment Menu */}
            <div className="relative" ref={attachmentRef}>
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-2 rounded-full transition-colors ${
                  showAttachmentMenu
                    ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                    : "text-neutral-500 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                }`}
                title="Attach"
              >
                <FaPaperclip className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute bottom-full left-0 mb-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-700/50 p-2 min-w-[220px] z-50 overflow-hidden"
                  >
                    {[
                      {
                        icon: FaImage,
                        label: "Photos & Videos",
                        color: "text-blue-500",
                        onClick: () => {
                          fileInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        },
                      },
                      {
                        icon: FaVideo,
                        label: "Short Video",
                        color: "text-red-500",
                        onClick: () => {
                          videoInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        },
                      },
                      {
                        icon: FaFileAudio,
                        label: "Audio Message",
                        color: "text-violet-500",
                        onClick: () => {
                          audioInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        },
                      },
                      {
                        icon: FaFile,
                        label: "Document",
                        color: "text-emerald-500",
                        onClick: () => {
                          docInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        },
                      },
                    ].map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/30 rounded-xl transition-colors group"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${item.color.replace("text", "bg")}/10 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}
                        >
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept="video/*"
              className="hidden"
            />
            <input
              type="file"
              ref={audioInputRef}
              onChange={handleAudioSelect}
              accept="audio/*"
              className="hidden"
            />
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocSelect}
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
            />

            <input
              type="text"
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                editingMessage
                  ? "Edit your message..."
                  : selectedImage ||
                      selectedVideo ||
                      selectedAudio ||
                      selectedFile
                    ? "Add a caption..."
                    : "Type a message..."
              }
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
              aria-label={editingMessage ? "Save edit" : "Send message"}
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FaPaperPlane className="w-5 h-5" />
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default ChatInput;
