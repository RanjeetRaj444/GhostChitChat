import { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaUsers, FaPlus, FaCheck, FaSearch } from "react-icons/fa";

function CreateGroupModal({ users, onClose, onCreateGroup, currentUserId }) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = users.filter(
    (user) =>
      user._id !== currentUserId &&
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setIsCreating(true);
    const result = await onCreateGroup(groupName, description, selectedMembers);
    setIsCreating(false);

    if (result) {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <FaUsers className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Create Group
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-neutral-700 transition-all outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 border-2 border-transparent focus:border-primary-500 focus:bg-white dark:focus:bg-neutral-700 transition-all outline-none text-neutral-900 dark:text-white placeholder-neutral-400 resize-none"
              maxLength={200}
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Add Members * ({selectedMembers.length} selected)
            </label>

            {/* Search */}
            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 border-2 border-transparent focus:border-primary-500/50 transition-all outline-none text-sm"
              />
            </div>

            {/* User List */}
            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-4">
                  No users found
                </p>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedMembers.includes(user._id);
                  return (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => toggleMember(user._id)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all ${
                        isSelected
                          ? "bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 border-2 border-transparent"
                      }`}
                    >
                      <img
                        src={user.avatar || "/default-avatar.svg"}
                        alt={user.username}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="ml-3 flex-1 text-left">
                        <p className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {user.username}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary-500 text-white"
                            : "bg-neutral-200 dark:bg-neutral-600"
                        }`}
                      >
                        {isSelected ? (
                          <FaCheck className="w-3 h-3" />
                        ) : (
                          <FaPlus className="w-3 h-3 text-neutral-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              !groupName.trim() || selectedMembers.length === 0 || isCreating
            }
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FaUsers className="w-4 h-4" />
                <span>Create Group</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default CreateGroupModal;
