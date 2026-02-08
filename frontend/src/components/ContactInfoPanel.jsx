import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowLeft,
  FaSearch,
  FaBell,
  FaBellSlash,
  FaImage,
  FaLock,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaHeart,
  FaRegHeart,
  FaUsers,
  FaUserPlus,
  FaBan,
  FaUnlock,
  FaTrash,
  FaEraser,
  FaTimes,
  FaCheck,
  FaPhone,
  FaVideo,
  FaLink,
  FaFileAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

function ContactInfoPanel({
  user,
  currentUser,
  onClose,
  onBlock,
  onUnblock,
  onMute,
  onFavorite,
  onClearChat,
  onDeleteChat,
  onSearch,
  isOnline,
  messages = [],
  groups = [],
  users = [],
  onCreateGroup,
  onSelectGroup,
}) {
  const [showStarredMessages, setShowStarredMessages] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [activeGalleryTab, setActiveGalleryTab] = useState("media"); // media, docs, links

  if (!user) return null;

  const isBlocked = user.blockedByMe;
  const isMuted = currentUser?.mutedUsers?.includes(user._id);
  const isFavorite = currentUser?.favoriteUsers?.includes(user._id);

  // Get starred messages
  const starredMessages = messages.filter((msg) =>
    msg.starredBy?.some(
      (id) => (id._id || id).toString() === currentUser?._id.toString(),
    ),
  );

  // Get media messages (images, videos)
  const mediaMessages = messages.filter(
    (msg) => msg.messageType === "image" || msg.messageType === "video",
  );

  // Get documents
  const docMessages = messages.filter((msg) => msg.messageType === "file");

  // Get links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const linkMessages = messages.filter(
    (msg) => msg.messageType === "text" && msg.content?.match(urlRegex),
  );

  const totalMediaLinksDocs =
    mediaMessages.length + docMessages.length + linkMessages.length;

  // Get common groups
  const commonGroups = groups.filter((group) => {
    const memberIds = group.members?.map((m) => (m._id || m).toString()) || [];
    return (
      memberIds.includes(currentUser?._id.toString()) &&
      memberIds.includes(user._id.toString())
    );
  });

  // Filter users for group creation (exclude current user and selected user)
  const filteredUsers = users.filter(
    (u) =>
      u._id !== currentUser?._id &&
      u._id !== user._id &&
      u.username.toLowerCase().includes(memberSearch.toLowerCase()),
  );

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setIsCreating(true);
    // Include the selected user in the group members
    const allMembers = [user._id, ...selectedMembers];
    const result = await onCreateGroup?.(
      groupName,
      groupDescription,
      allMembers,
    );
    setIsCreating(false);

    if (result) {
      toast.success(`Group "${groupName}" created!`);
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      onClose?.();
    }
  };

  const menuItems = [
    {
      icon: isMuted ? FaBellSlash : FaBell,
      label: isMuted ? "Unmute notifications" : "Mute notifications",
      onClick: () => {
        onMute?.(user._id);
        toast.success(
          isMuted ? "Notifications unmuted" : "Notifications muted",
        );
      },
    },
    {
      icon: FaImage,
      label: "Media, links and docs",
      count: totalMediaLinksDocs,
      onClick: () => {
        if (totalMediaLinksDocs > 0) {
          setShowMediaGallery(true);
        } else {
          toast("No media, links or docs in this chat");
        }
      },
    },
    {
      icon: FaStar,
      label: "Starred messages",
      count: starredMessages.length,
      onClick: () => {
        if (starredMessages.length > 0) {
          setShowStarredMessages(true);
        } else {
          toast("No starred messages");
        }
      },
    },
    {
      icon: FaLock,
      label: "Encryption",
      subtitle: "Messages are end-to-end encrypted. Tap to verify.",
      onClick: () =>
        toast.success("Your messages are secured with end-to-end encryption"),
    },
    {
      icon: FaClock,
      label: "Disappearing messages",
      subtitle: "Off",
      onClick: () => toast("Disappearing messages coming soon!"),
    },
    {
      icon: FaShieldAlt,
      label: "Advanced chat privacy",
      subtitle: "Off",
      onClick: () => toast("Advanced privacy settings coming soon!"),
    },
  ];

  // Create Group View
  if (showCreateGroup) {
    return (
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:relative inset-0 md:inset-auto h-full w-full md:w-[380px] md:min-w-[380px] bg-white dark:bg-neutral-900 md:border-l border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden z-50 md:z-auto"
      >
        <div className="flex items-center px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setShowCreateGroup(false)}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="ml-4 text-lg font-semibold text-neutral-900 dark:text-white flex-1">
            Create group with {user.username}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Group Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Pre-selected User */}
          <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl flex items-center">
            <img
              src={user.avatar || "/default-avatar.svg"}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {user.username}
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400">
                Will be added to group
              </p>
            </div>
            <FaCheck className="w-4 h-4 text-primary-500" />
          </div>

          {/* Add More Members */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Add more members (optional)
            </label>
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => toggleMember(u._id)}
                  className={`w-full flex items-center p-2.5 rounded-xl transition-colors ${
                    selectedMembers.includes(u._id)
                      ? "bg-primary-50 dark:bg-primary-500/10"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                >
                  <img
                    src={u.avatar || "/default-avatar.svg"}
                    alt={u.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="ml-3 text-sm font-medium text-neutral-800 dark:text-neutral-200 flex-1 text-left">
                    {u.username}
                  </span>
                  {selectedMembers.includes(u._id) && (
                    <FaCheck className="w-4 h-4 text-primary-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </motion.div>
    );
  }

  // Starred Messages View
  if (showStarredMessages) {
    return (
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:relative inset-0 md:inset-auto h-full w-full md:w-[380px] md:min-w-[380px] bg-white dark:bg-neutral-900 md:border-l border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden z-50 md:z-auto"
      >
        <div className="flex items-center px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setShowStarredMessages(false)}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="ml-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Starred messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {starredMessages.map((msg) => (
            <div
              key={msg._id}
              className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
            >
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {msg.content || (msg.image ? "📷 Image" : "Message")}
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                {new Date(msg.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Media Gallery View
  if (showMediaGallery) {
    return (
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed md:relative inset-0 md:inset-auto h-full w-full md:w-[380px] md:min-w-[380px] bg-white dark:bg-neutral-900 md:border-l border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden z-50 md:z-auto"
      >
        <div className="flex flex-col bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => setShowMediaGallery(false)}
              className="p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="ml-4 text-lg font-semibold text-neutral-900 dark:text-white">
              Media, links and docs
            </h2>
          </div>

          <div className="flex px-4">
            {["media", "docs", "links"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveGalleryTab(tab)}
                className={`flex-1 py-3 text-sm font-bold capitalize relative transition-colors ${
                  activeGalleryTab === tab
                    ? "text-primary-500"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {tab}
                {activeGalleryTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeGalleryTab === "media" && (
              <motion.div
                key="media"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-2 grid grid-cols-3 gap-1"
              >
                {mediaMessages.length > 0 ? (
                  mediaMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden group relative"
                    >
                      <img
                        src={msg.imageUrl || msg.image}
                        alt="Media"
                        className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                      />
                      {msg.messageType === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white">
                            <FaVideo className="w-3 h-3 ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-12 text-center text-neutral-500">
                    No media found
                  </div>
                )}
              </motion.div>
            )}

            {activeGalleryTab === "docs" && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-3"
              >
                {docMessages.length > 0 ? (
                  docMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 transition-all group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                        <FaFileAlt className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                          {msg.fileName || "Shared Document"}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-medium">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-neutral-500 font-medium">
                    No documents shared
                  </div>
                )}
              </motion.div>
            )}

            {activeGalleryTab === "links" && (
              <motion.div
                key="links"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 space-y-3"
              >
                {linkMessages.length > 0 ? (
                  linkMessages.flatMap((msg) => {
                    const links = msg.content.match(urlRegex) || [];
                    return links.map((link, i) => (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={`${msg._id}-${i}`}
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-800 transition-all group"
                      >
                        <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                          <FaLink className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 truncate">
                            {link}
                          </p>
                          <p className="text-[10px] text-neutral-500 font-medium truncate">
                            From: {msg.content}
                          </p>
                        </div>
                      </a>
                    ));
                  })
                ) : (
                  <div className="py-12 text-center text-neutral-500 font-medium">
                    No links shared
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed md:relative inset-0 md:inset-auto h-full w-full md:w-[380px] md:min-w-[380px] bg-white dark:bg-neutral-900 md:border-l border-neutral-200 dark:border-neutral-700 flex flex-col overflow-hidden z-50 md:z-auto"
    >
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="ml-4 text-lg font-semibold text-neutral-900 dark:text-white flex-1">
          Contact info
        </h2>
        <button
          onClick={() => {
            onFavorite?.(user._id);
          }}
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? (
            <FaHeart className="w-4 h-4 text-error-500" />
          ) : (
            <FaRegHeart className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Section */}
        <div className="flex flex-col items-center py-8 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="relative">
            <img
              src={user.avatar || "/default-avatar.svg"}
              alt={user.username}
              className="w-28 h-28 rounded-full object-cover border-4 border-primary-500/20 shadow-xl"
            />
            {isOnline && (
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-success-500 border-3 border-white dark:border-neutral-800 rounded-full" />
            )}
          </div>
          <h3 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
            {user.username}
          </h3>
          {user.email && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={() => toast("Audio call coming soon!")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl border-2 border-primary-500 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                <FaPhone className="w-5 h-5 text-primary-500" />
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Audio
              </span>
            </button>
            <button
              onClick={() => toast("Video call coming soon!")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl border-2 border-primary-500 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                <FaVideo className="w-5 h-5 text-primary-500" />
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Video
              </span>
            </button>
            <button
              onClick={() => onSearch?.("")}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className="w-12 h-12 rounded-2xl border-2 border-primary-500 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                <FaSearch className="w-5 h-5 text-primary-500" />
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Search
              </span>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold mb-2">
            About
          </p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {user.bio || "Hey there! I am using G-ChitChat"}
          </p>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full flex items-center px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <item.icon className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
              <div className="ml-5 flex-1">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {item.label}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 leading-relaxed">
                    {item.subtitle}
                  </p>
                )}
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-sm text-primary-500 font-semibold">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Groups in Common */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold mb-3">
            {commonGroups.length} Group{commonGroups.length !== 1 ? "s" : ""} in
            common
          </p>

          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 -mx-2 px-2 rounded-xl transition-colors mb-2"
          >
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
              <FaUserPlus className="w-5 h-5 text-white" />
            </div>
            <span className="ml-4 text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Create group with {user.username}
            </span>
          </button>

          {/* Common Groups List */}
          {commonGroups.map((group) => (
            <button
              key={group._id}
              onClick={() => onSelectGroup?.(group)}
              className="w-full flex items-center py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 -mx-2 px-2 rounded-xl transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  group.name?.charAt(0)?.toUpperCase() || "G"
                )}
              </div>
              <div className="ml-4 flex-1 text-left">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {group.name}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {group.members?.length || 0} members
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="py-2 border-t border-neutral-100 dark:border-neutral-800 mt-4">
          {/* Clear Chat */}
          <button
            onClick={() => onClearChat?.(user._id)}
            className="w-full flex items-center px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <FaEraser className="w-5 h-5 text-warning-500" />
            <span className="ml-5 text-sm font-medium text-warning-600 dark:text-warning-500">
              Clear chat
            </span>
          </button>

          {/* Block */}
          <button
            onClick={() => {
              if (isBlocked) {
                onUnblock?.(user._id);
              } else {
                onBlock?.(user._id);
              }
            }}
            className="w-full flex items-center px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            {isBlocked ? (
              <>
                <FaUnlock className="w-5 h-5 text-success-500" />
                <span className="ml-5 text-sm font-medium text-success-500">
                  Unblock {user.username}
                </span>
              </>
            ) : (
              <>
                <FaBan className="w-5 h-5 text-error-500" />
                <span className="ml-5 text-sm font-medium text-error-500">
                  Block {user.username}
                </span>
              </>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDeleteChat?.(user)}
            className="w-full flex items-center px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left"
          >
            <FaTrash className="w-5 h-5 text-error-500" />
            <span className="ml-5 text-sm font-medium text-error-500">
              Delete chat
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ContactInfoPanel;
