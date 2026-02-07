import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUsers,
  FaEdit,
  FaTrash,
  FaSignOutAlt,
  FaUserPlus,
  FaUserMinus,
  FaCrown,
  FaCheck,
} from "react-icons/fa";

function GroupInfoModal({
  group,
  currentUserId,
  users,
  isUserOnline,
  onClose,
  onAddMembers,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateGroup,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group?.name || "");
  const [editDescription, setEditDescription] = useState(
    group?.description || "",
  );
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = group?.admins?.some(
    (admin) => (admin._id || admin) === currentUserId,
  );
  const isCreator =
    (group?.createdBy?._id || group?.createdBy) === currentUserId;

  const memberIds = group?.members?.map((m) => m._id || m) || [];
  const nonMembers = users.filter((u) => !memberIds.includes(u._id));

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setIsLoading(true);
    const success = await onUpdateGroup(group._id, {
      name: editName,
      description: editDescription,
    });
    setIsLoading(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    setIsLoading(true);
    const success = await onAddMembers(group._id, selectedNewMembers);
    setIsLoading(false);
    if (success) {
      setSelectedNewMembers([]);
      setShowAddMembers(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from the group?")) return;
    await onRemoveMember(group._id, userId);
  };

  const handleLeave = async () => {
    if (!window.confirm("Are you sure you want to leave this group?")) return;
    await onLeaveGroup(group._id);
    onClose();
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this group? This cannot be undone.",
      )
    )
      return;
    await onDeleteGroup(group._id);
    onClose();
  };

  const toggleNewMember = (userId) => {
    setSelectedNewMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
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
        <div className="relative">
          <div className="h-24 bg-gradient-to-br from-primary-500 to-secondary-500" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
          <div className="absolute -bottom-10 left-6">
            <img
              src={group?.avatar || "/default-avatar.svg"}
              alt={group?.name}
              className="w-20 h-20 rounded-2xl border-4 border-white dark:border-neutral-800 shadow-lg object-cover"
            />
          </div>
        </div>

        <div className="pt-14 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-96px)] custom-scrollbar">
          {/* Group Info */}
          {isEditing ? (
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 border-2 border-transparent focus:border-primary-500 outline-none font-bold"
                placeholder="Group name"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700/50 border-2 border-transparent focus:border-primary-500 outline-none resize-none text-sm"
                placeholder="Description"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isLoading || !editName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(group?.name || "");
                    setEditDescription(group?.description || "");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {group?.name}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                    {group?.description || "No description"}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Members Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                Members ({group?.members?.length || 0})
              </h4>
              {isAdmin && nonMembers.length > 0 && (
                <button
                  onClick={() => setShowAddMembers(!showAddMembers)}
                  className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center space-x-1"
                >
                  <FaUserPlus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {/* Add Members Section */}
            <AnimatePresence>
              {showAddMembers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/30 rounded-xl space-y-2">
                    <p className="text-xs text-neutral-500 mb-2">
                      Select users to add:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {nonMembers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => toggleNewMember(user._id)}
                          className={`w-full flex items-center px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedNewMembers.includes(user._id)
                              ? "bg-primary-100 dark:bg-primary-900/30"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          }`}
                        >
                          <img
                            src={user.avatar || "/default-avatar.svg"}
                            alt={user.username}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <span className="ml-2 font-medium truncate flex-1 text-left">
                            {user.username}
                          </span>
                          {selectedNewMembers.includes(user._id) && (
                            <FaCheck className="w-3 h-3 text-primary-500" />
                          )}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleAddMembers}
                      disabled={selectedNewMembers.length === 0 || isLoading}
                      className="w-full py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading
                        ? "Adding..."
                        : `Add ${selectedNewMembers.length} Member${selectedNewMembers.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Member List */}
            <div className="space-y-1">
              {group?.members?.map((member) => {
                const memberId = member._id || member;
                const isMemberAdmin = group.admins?.some(
                  (a) => (a._id || a) === memberId,
                );
                const isMemberCreator =
                  (group.createdBy?._id || group.createdBy) === memberId;
                const isMe = memberId === currentUserId;

                return (
                  <div
                    key={memberId}
                    className="flex items-center px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group"
                  >
                    <div className="relative">
                      <img
                        src={member.avatar || "/default-avatar.svg"}
                        alt={member.username}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      {isUserOnline(memberId) && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success-500 border-2 border-white dark:border-neutral-800 rounded-full" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {member.username}
                          {isMe && " (You)"}
                        </span>
                        {isMemberCreator && (
                          <FaCrown className="w-3 h-3 text-yellow-500" />
                        )}
                        {isMemberAdmin && !isMemberCreator && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded font-bold">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && !isMe && !isMemberCreator && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all"
                        title="Remove member"
                      >
                        <FaUserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {!isCreator && (
              <button
                onClick={handleLeave}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors font-semibold"
              >
                <FaSignOutAlt className="w-4 h-4 mr-2" />
                Leave Group
              </button>
            )}
            {isCreator && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors font-semibold"
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default GroupInfoModal;
